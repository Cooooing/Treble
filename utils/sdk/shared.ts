import { getPageContext } from "vike/getPageContext";
import { Configuration, type FetchAPI, type Middleware } from "@bass/bbs-sdk-fetch/runtime";

const bffRequestTimeoutMs = 3_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: number | string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function browserRequestId() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function toBbsProxyUrl(url: string, basePath: string) {
  const normalizedBasePath = basePath.replace(/\/$/, "");
  const parsedUrl = isAbsoluteUrl(url) ? new URL(url) : undefined;
  const path = parsedUrl ? `${parsedUrl.pathname}${parsedUrl.search}` : url;

  if (path === normalizedBasePath || path.startsWith(`${normalizedBasePath}/`)) {
    return path;
  }

  return `${normalizedBasePath}/${path.replace(/^\//, "")}`;
}

export function toBffUrl(url: string, proxyPath: string, bffUrl: string) {
  const normalizedProxyPath = proxyPath.replace(/\/$/, "");
  const parsedUrl = isAbsoluteUrl(url) ? new URL(url) : undefined;
  const requestPath = parsedUrl ? `${parsedUrl.pathname}${parsedUrl.search}` : url;
  const bffPath = requestPath.startsWith(normalizedProxyPath)
    ? requestPath.slice(normalizedProxyPath.length) || "/"
    : requestPath;

  return new URL(bffPath.replace(/^\//, ""), `${bffUrl.replace(/\/$/, "")}/`).toString();
}

export function createSdkFetch(options: { proxyPath: string }): FetchAPI {
  return async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (import.meta.env.SSR) {
      const { bffUrl } = await import("./server");
      const pageContext = getPageContext({ asyncHook: true });
      const cookie = pageContext?.headers?.cookie;
      const sid = cookie
        ?.split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("treble.sid="))
        ?.slice("treble.sid=".length);
      const requestId = pageContext?.headers?.["x-request-id"] || crypto.randomUUID();
      const headers = new Headers(init?.headers);
      headers.set("x-request-id", requestId);

      if (sid) {
        const { getUsableSession, refreshSession } = await import("../../server/bbsGateway");
        const decodedSid = decodeURIComponent(sid);
        const session = await getUsableSession(
          { bffUrl, isProduction: process.env.NODE_ENV === "production" },
          decodedSid,
          requestId,
        );
        if (session) {
          const responseHeaders = pageContext?.headersResponse;
          responseHeaders?.set("cache-control", "private, no-store");
          responseHeaders?.set("vary", "Cookie");
          headers.set("authorization", `Bearer ${session.accessToken}`);
          let response = await fetch(toBffUrl(url, options.proxyPath, bffUrl), {
            ...init,
            headers,
            signal: AbortSignal.timeout(bffRequestTimeoutMs),
          });
          if (response.status !== 401) return response;
          const refreshed = await refreshSession(
            { bffUrl, isProduction: process.env.NODE_ENV === "production" },
            decodedSid,
            session,
            requestId,
          );
          if (refreshed) {
            headers.set("authorization", `Bearer ${refreshed.accessToken}`);
            response = await fetch(toBffUrl(url, options.proxyPath, bffUrl), {
              ...init,
              headers,
              signal: AbortSignal.timeout(bffRequestTimeoutMs),
            });
          }
          return response;
        }
      }
      return fetch(toBffUrl(url, options.proxyPath, bffUrl), {
        ...init,
        headers,
        signal: AbortSignal.timeout(bffRequestTimeoutMs),
      });
    }

    const proxyUrl = toBbsProxyUrl(url, options.proxyPath);
    const headers = new Headers(init?.headers);
    headers.set("x-request-id", browserRequestId());
    if (init?.method && !["GET", "HEAD", "OPTIONS"].includes(init.method.toUpperCase())) {
      const csrf = document.cookie
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("treble.csrf="))
        ?.slice("treble.csrf=".length);
      if (csrf) headers.set("x-treble-csrf", decodeURIComponent(csrf));
    }
    return fetch(proxyUrl, { ...init, headers });
  };
}

export async function normalizeBusinessResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    if (!response.ok) {
      throw new ApiError(response.statusText || "请求失败", response.status);
    }
    return response;
  }

  const json = await response.clone().json();
  if (!json || typeof json !== "object" || !("code" in json)) {
    if (!response.ok) {
      throw new ApiError(json?.message || response.statusText || "请求失败", response.status, json?.code, json);
    }
    return response;
  }

  const message = json.msg || json.message || "请求失败";
  if (json.code !== 200 && json.code !== 0) {
    throw new ApiError(message, response.status, json.code, json.data);
  }

  const headers = new Headers(response.headers);
  headers.set("content-type", "application/json");

  return new Response(JSON.stringify(json.data ?? {}), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const businessResponseMiddleware: Middleware = {
  post: async ({ response }) => normalizeBusinessResponse(response),
};

export function createSdkConfiguration(options: { basePath: string; fetchApi: FetchAPI; middleware?: Middleware[] }) {
  return new Configuration({
    basePath: options.basePath,
    fetchApi: options.fetchApi,
    middleware: options.middleware ?? [businessResponseMiddleware],
  });
}
