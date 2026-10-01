import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";
import { getSessionRepository, SessionStoreError, type TrebleSession } from "./session";

const sessionCookieName = "treble.sid";
const csrfCookieName = "treble.csrf";
const refreshPath = "/v1/user/auth/refresh-token";
const loginPath = "/v1/user/auth/login";
const logoutPath = "/v1/user/auth/logout";
const refreshBeforeMs = 30_000;
const bffRequestTimeoutMs = 3_000;
const refreshPromises = new Map<string, Promise<TrebleSession | undefined>>();

type GatewayRequest = IncomingMessage & { originalUrl?: string };
type GatewayOptions = { bffUrl: string; isProduction: boolean };

function parseCookies(header: string | undefined) {
  return new Map(
    (header || "").split(";").flatMap((entry) => {
      const separator = entry.indexOf("=");
      if (separator <= 0) return [];
      return [[entry.slice(0, separator).trim(), decodeURIComponent(entry.slice(separator + 1).trim())] as const];
    }),
  );
}

function appendCookie(res: ServerResponse, value: string) {
  const current = res.getHeader("set-cookie");
  const cookies = Array.isArray(current) ? current.map(String) : current ? [String(current)] : [];
  res.setHeader("set-cookie", [...cookies, value]);
}

function cookieAttributes(isProduction: boolean) {
  return `${isProduction ? "; Secure" : ""}; SameSite=Lax; Path=/`;
}

function setSessionCookie(res: ServerResponse, sid: string, expiresAt: string, isProduction: boolean) {
  const maxAge = Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000));
  appendCookie(
    res,
    `${sessionCookieName}=${encodeURIComponent(sid)}; Max-Age=${maxAge}; HttpOnly; Priority=High${cookieAttributes(isProduction)}`,
  );
}

function clearSessionCookie(res: ServerResponse, isProduction: boolean) {
  appendCookie(res, sessionCookieClearValue(isProduction));
}

export function sessionCookieClearValue(isProduction: boolean) {
  return `${sessionCookieName}=; Max-Age=0; HttpOnly; Priority=High${cookieAttributes(isProduction)}`;
}

export function ensureCsrfCookie(isProduction: boolean) {
  return (req: GatewayRequest, res: ServerResponse, next?: () => void) => {
    const cookies = parseCookies(req.headers.cookie);
    if (!cookies.has(csrfCookieName)) {
      const token = randomBytes(32).toString("base64url");
      appendCookie(
        res,
        `${csrfCookieName}=${encodeURIComponent(token)}; Priority=High${cookieAttributes(isProduction)}`,
      );
    }
    next?.();
  };
}

function isMutation(method: string | undefined) {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}

function validateCsrf(req: GatewayRequest) {
  if (!isMutation(req.method)) return true;
  const expected = parseCookies(req.headers.cookie).get(csrfCookieName);
  const actual = req.headers["x-treble-csrf"];
  if (!expected || typeof actual !== "string") return false;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

function requestId(req: GatewayRequest) {
  const current = req.headers["x-request-id"];
  return typeof current === "string" && /^[a-zA-Z0-9-]{8,128}$/.test(current) ? current : randomUUID();
}

function sendJson(res: ServerResponse, status: number, msg: string, data: object = {}) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ code: status, msg, data }));
}

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function bffRequestUrl(bffUrl: string, requestUrl: string | undefined) {
  const target = new URL(bffUrl);
  const request = new URL(requestUrl || "/", "http://treble.local");
  const basePath = target.pathname.replace(/\/$/, "");
  target.pathname = `${basePath}${request.pathname}`.replace(/\/\/{2,}/g, "/");
  target.search = request.search;
  return target;
}

function forwardHeaders(
  headers: IncomingHttpHeaders,
  remoteAddress: string | undefined,
  accessToken: string | undefined,
  requestIdValue: string,
) {
  const forwarded = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (
      !value ||
      ["host", "connection", "content-length", "cookie", "authorization", "x-treble-csrf", "x-request-id"].includes(
        name.toLowerCase(),
      )
    )
      continue;
    forwarded.set(name, Array.isArray(value) ? value.join(",") : value);
  }
  // Requests arrive at the BFF from this Node process, so its socket address
  // cannot identify the browser. Replace any client-supplied forwarding value
  // with the address observed by Treble before sending the internal request.
  const clientIP = remoteAddress?.trim().replace(/^::ffff:/i, "");
  if (clientIP) forwarded.set("x-forwarded-for", clientIP);
  forwarded.set("x-request-id", requestIdValue);
  if (accessToken) forwarded.set("authorization", `Bearer ${accessToken}`);
  return forwarded;
}

async function callBff(
  options: GatewayOptions,
  req: GatewayRequest,
  body: Buffer,
  accessToken: string | undefined,
  requestIdValue: string,
) {
  return fetch(bffRequestUrl(options.bffUrl, req.url), {
    method: req.method,
    headers: forwardHeaders(req.headers, req.socket.remoteAddress, accessToken, requestIdValue),
    body: body.length ? (new Uint8Array(body).buffer as ArrayBuffer) : undefined,
    signal: AbortSignal.timeout(bffRequestTimeoutMs),
  });
}

function isSuccessfulEnvelope(value: unknown): value is { code: number; msg?: string; data: Record<string, unknown> } {
  const code = value && typeof value === "object" ? (value as { code?: number }).code : undefined;
  return Boolean(
    (code === 0 || code === 200) &&
      value &&
      typeof value === "object" &&
      typeof (value as { data?: unknown }).data === "object",
  );
}

function sessionFromLogin(data: Record<string, unknown>): Omit<TrebleSession, "version"> | undefined {
  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;
  const accessTokenExpiresAt = data.access_token_expires_at;
  const refreshTokenExpiresAt = data.refresh_token_expires_at;
  const sessionExpiresAt = data.session_expires_at;
  if (
    [accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt, sessionExpiresAt].some(
      (value) => typeof value !== "string",
    )
  )
    return undefined;
  return { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt, sessionExpiresAt } as Omit<
    TrebleSession,
    "version"
  >;
}

function sessionFromRefresh(data: Record<string, unknown>, previous: TrebleSession): TrebleSession | undefined {
  const updated = sessionFromLogin({ ...data, account: {} });
  return updated ? { ...updated, version: previous.version + 1 } : undefined;
}

export async function refreshSession(
  options: GatewayOptions,
  sid: string,
  previous: TrebleSession,
  requestIdValue: string,
) {
  const existing = refreshPromises.get(sid);
  if (existing) return existing;
  const refresh = (async () => {
    const repository = getSessionRepository();
    const lock = await repository.acquireRefreshLock(sid);
    if (!lock) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const updated = await repository.get(sid);
      return updated && updated.version > previous.version ? updated : undefined;
    }
    try {
      const latest = await repository.get(sid);
      if (!latest) return undefined;
      if (latest.version !== previous.version) return latest;
      let response: Response;
      try {
        response = await fetch(bffRequestUrl(options.bffUrl, refreshPath), {
          method: "POST",
          headers: { "content-type": "application/json", "x-request-id": requestIdValue },
          body: JSON.stringify({ refresh_token: latest.refreshToken }),
          signal: AbortSignal.timeout(bffRequestTimeoutMs),
        });
      } catch {
        await repository.remove(sid).catch(() => undefined);
        return undefined;
      }
      const envelope: unknown = await response.json().catch(() => undefined);
      if (!response.ok || !isSuccessfulEnvelope(envelope)) {
        await repository.remove(sid);
        return undefined;
      }
      const updated = sessionFromRefresh(envelope.data, latest);
      if (!updated || !(await repository.save(sid, updated))) return undefined;
      return updated;
    } finally {
      await repository.releaseRefreshLock(sid, lock).catch(() => undefined);
    }
  })().finally(() => refreshPromises.delete(sid));
  refreshPromises.set(sid, refresh);
  return refresh;
}

export async function getUsableSession(options: GatewayOptions, sid: string | undefined, requestIdValue: string) {
  const repository = getSessionRepository();
  const session = await repository.get(sid);
  if (!session || !sid) return undefined;
  if (Date.parse(session.accessTokenExpiresAt) - Date.now() > refreshBeforeMs) return session;
  return refreshSession(options, sid, session, requestIdValue);
}

function copyResponseHeaders(source: Response, target: ServerResponse) {
  source.headers.forEach((value, name) => {
    if (!["connection", "content-length", "set-cookie"].includes(name.toLowerCase())) target.setHeader(name, value);
  });
}

async function writeResponse(source: Response, target: ServerResponse) {
  copyResponseHeaders(source, target);
  target.statusCode = source.status;
  target.end(Buffer.from(await source.arrayBuffer()));
}

export function createBbsGateway(options: GatewayOptions) {
  return async (req: GatewayRequest, res: ServerResponse) => {
    const id = requestId(req);
    res.setHeader("x-request-id", id);
    res.setHeader("x-treble-proxy-request-id", id);
    const path = new URL(req.url || "/", "http://treble.local").pathname;
    if (path === refreshPath) return sendJson(res, 403, "令牌刷新仅由 Treble 服务端处理");

    if (path === logoutPath) {
      const cookies = parseCookies(req.headers.cookie);
      const sid = cookies.get(sessionCookieName);
      let body = Buffer.alloc(0);
      try {
        body = await readBody(req);
      } catch {
        // 退出本地会话不依赖请求体可读。
      }

      try {
        const repository = getSessionRepository();
        const session = await repository.get(sid);
        await repository.remove(sid);
        if (session) void callBff(options, req, body, session.accessToken, id).catch(() => undefined);
      } catch {
        // Redis 故障时仍清除浏览器 sid，避免用户被困在失效登录态。
      }

      clearSessionCookie(res, options.isProduction);
      return sendJson(res, 200, "已退出登录");
    }

    if (!validateCsrf(req)) return sendJson(res, 403, "CSRF 校验失败，请刷新页面后重试");

    let body: Buffer;
    try {
      body = await readBody(req);
    } catch {
      return sendJson(res, 400, "请求体读取失败");
    }

    const cookies = parseCookies(req.headers.cookie);
    const sid = cookies.get(sessionCookieName);
    let session: TrebleSession | undefined;
    try {
      session = path === loginPath ? undefined : await getUsableSession(options, sid, id);
    } catch (error) {
      if (error instanceof SessionStoreError) return sendJson(res, 503, error.message);
      return sendJson(res, 503, "会话服务暂时不可用");
    }

    let response: Response;
    try {
      response = await callBff(options, req, body, session?.accessToken, id);
      if (response.status === 401 && session && sid) {
        const refreshed = await refreshSession(options, sid, session, id);
        if (refreshed) response = await callBff(options, req, body, refreshed.accessToken, id);
        else clearSessionCookie(res, options.isProduction);
      }
    } catch {
      return sendJson(res, 502, "BBS 服务暂时不可用");
    }

    if (path === loginPath && response.ok) {
      const raw = await response.text();
      let envelope: unknown;
      try {
        envelope = JSON.parse(raw);
      } catch {
        return sendJson(res, 502, "BBS 登录响应格式错误");
      }
      if (!isSuccessfulEnvelope(envelope)) {
        res.statusCode = response.status;
        res.setHeader("content-type", "application/json; charset=utf-8");
        return res.end(raw);
      }
      const created = sessionFromLogin(envelope.data);
      if (!created) return sendJson(res, 502, "BBS 登录响应缺少会话信息");
      try {
        const newSid = await getSessionRepository().create(created);
        await getSessionRepository().remove(sid);
        setSessionCookie(res, newSid, created.sessionExpiresAt, options.isProduction);
      } catch (error) {
        return sendJson(res, 503, error instanceof Error ? error.message : "创建登录会话失败");
      }
      res.statusCode = response.status;
      res.setHeader("content-type", "application/json; charset=utf-8");
      return res.end(
        JSON.stringify({ code: envelope.code, msg: envelope.msg, data: { account: envelope.data.account } }),
      );
    }

    if (sid && !session) {
      clearSessionCookie(res, options.isProduction);
    }
    await writeResponse(response, res);
  };
}
