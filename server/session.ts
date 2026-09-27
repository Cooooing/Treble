import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "redis";

export interface TrebleSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  sessionExpiresAt: string;
  version: number;
}

export class SessionStoreError extends Error {
  constructor(message = "会话服务暂时不可用") {
    super(message);
    this.name = "SessionStoreError";
  }
}

export function sessionTtlSeconds(session: TrebleSession, now = Date.now()) {
  const access = Date.parse(session.accessTokenExpiresAt);
  const refresh = Date.parse(session.refreshTokenExpiresAt);
  const absolute = Date.parse(session.sessionExpiresAt);
  const expiresAt = Math.min(absolute, Math.max(access, refresh));
  return Math.max(0, Math.floor((expiresAt - now) / 1000));
}

function assertSession(value: unknown): asserts value is TrebleSession {
  if (!value || typeof value !== "object") throw new SessionStoreError("会话数据无效");
  const session = value as Partial<TrebleSession>;
  if (
    !session.accessToken || !session.refreshToken ||
    !session.accessTokenExpiresAt || !session.refreshTokenExpiresAt || !session.sessionExpiresAt ||
    typeof session.version !== "number" || sessionTtlSeconds(session as TrebleSession) <= 0
  ) {
    throw new SessionStoreError("会话数据已过期");
  }
}

export class SessionRepository {
  private readonly client;
  private connection?: Promise<void>;

  constructor(redisUrl: string) {
    this.client = createClient({
      url: redisUrl,
      disableOfflineQueue: true,
      socket: { connectTimeout: 3_000, reconnectStrategy: false },
    });
    this.client.on("error", (error) => console.error("Redis 会话服务错误", error));
  }

  private async connect() {
    if (this.client.isOpen) return;
    this.connection ??= this.client.connect().then(() => undefined).catch((error) => {
      this.connection = undefined;
      throw error;
    });
    try {
      await this.connection;
    } catch {
      throw new SessionStoreError();
    }
  }

  private key(sid: string) {
    return `treble:session:${sid}`;
  }

  private lockKey(sid: string) {
    return `treble:session:refresh-lock:${sid}`;
  }

  async create(session: Omit<TrebleSession, "version">) {
    const ttl = sessionTtlSeconds({ ...session, version: 1 });
    if (ttl <= 0) throw new SessionStoreError("登录会话已过期");
    await this.connect();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const sid = randomBytes(32).toString("base64url");
      const stored: TrebleSession = { ...session, version: 1 };
      try {
        const created = await this.client.set(this.key(sid), JSON.stringify(stored), { EX: ttl, NX: true });
        if (created === "OK") return sid;
      } catch {
        throw new SessionStoreError();
      }
    }
    throw new SessionStoreError("创建会话失败");
  }

  async get(sid: string | undefined) {
    if (!sid) return undefined;
    await this.connect();
    try {
      const raw = await this.client.get(this.key(sid));
      if (!raw) return undefined;
      const session: unknown = JSON.parse(raw);
      assertSession(session);
      return session;
    } catch (error) {
      if (error instanceof SessionStoreError) {
        await this.remove(sid).catch(() => undefined);
        return undefined;
      }
      throw new SessionStoreError();
    }
  }

  async save(sid: string, session: TrebleSession) {
    const ttl = sessionTtlSeconds(session);
    if (ttl <= 0) {
      await this.remove(sid);
      return false;
    }
    await this.connect();
    try {
      await this.client.set(this.key(sid), JSON.stringify(session), { EX: ttl });
      return true;
    } catch {
      throw new SessionStoreError();
    }
  }

  async remove(sid: string | undefined) {
    if (!sid) return;
    await this.connect();
    try {
      await this.client.del(this.key(sid));
    } catch {
      throw new SessionStoreError();
    }
  }

  async acquireRefreshLock(sid: string) {
    await this.connect();
    const token = randomUUID();
    try {
      const locked = await this.client.set(this.lockKey(sid), token, { NX: true, PX: 5_000 });
      return locked === "OK" ? token : undefined;
    } catch {
      throw new SessionStoreError();
    }
  }

  async releaseRefreshLock(sid: string, token: string) {
    await this.connect();
    try {
      const lockKey = this.lockKey(sid);
      const current = await this.client.get(lockKey);
      if (current === token) await this.client.del(lockKey);
    } catch {
      throw new SessionStoreError();
    }
  }
}

let repository: SessionRepository | undefined;

export function getSessionRepository() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) throw new SessionStoreError("必须配置 REDIS_URL");
  repository ??= new SessionRepository(redisUrl);
  return repository;
}
