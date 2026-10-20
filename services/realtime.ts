export type RealtimeTicket = {
  ticket: string;
  path: string;
};

type RuntimeConfig = {
  realtimeNodeUrl?: string;
};

type RealtimeEventListener = (event: MessageEvent<string>) => void;

type RealtimeConnectionOptions = {
  issueTicket: () => Promise<RealtimeTicket | undefined>;
  resolveEndpoint: (ticket: RealtimeTicket) => string;
};

const initialReconnectDelayMs = 2_000;
const maxReconnectDelayMs = 30_000;

let runtimeConfigPromise: Promise<RuntimeConfig> | undefined;

export function getRealtimeNodeUrl() {
  runtimeConfigPromise ??= fetch("/runtime-config.json", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) return {};
      return (await response.json()) as RuntimeConfig;
    })
    .catch(() => ({}));
  return runtimeConfigPromise.then((config) => config.realtimeNodeUrl?.replace(/\/$/, ""));
}

declare global {
  interface Window {
    __trebleRealtimeConnection?: RealtimeConnection;
  }
}

// RealtimeConnection owns one browser SSE stream and dispatches named events to feature subscribers.
export class RealtimeConnection {
  private readonly listeners = new Map<string, Set<RealtimeEventListener>>();
  private source?: EventSource;
  private reconnectDelayMs = initialReconnectDelayMs;
  private reconnectTimer?: number;
  private started = false;

  constructor(private readonly options: RealtimeConnectionOptions) {}

  start() {
    if (this.started || typeof EventSource === "undefined") return;
    this.started = true;
    void this.connect();
  }

  stop() {
    this.started = false;
    this.reconnectDelayMs = initialReconnectDelayMs;
    if (this.reconnectTimer !== undefined) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.closeSource();
  }

  subscribe(eventName: string, listener: RealtimeEventListener) {
    const listeners = this.listeners.get(eventName) || new Set<RealtimeEventListener>();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);
    this.source?.addEventListener(eventName, this.dispatchEvent);
    return () => {
      const current = this.listeners.get(eventName);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) {
        this.listeners.delete(eventName);
        this.source?.removeEventListener(eventName, this.dispatchEvent);
      }
    };
  }

  private async connect() {
    if (!this.started) return;
    try {
      const ticket = await this.options.issueTicket();
      if (!ticket || !this.started) {
        this.scheduleReconnect();
        return;
      }
      const source = new EventSource(this.options.resolveEndpoint(ticket));
      source.onopen = () => {
        this.reconnectDelayMs = initialReconnectDelayMs;
      };
      source.onerror = () => {
        if (source !== this.source) return;
        this.closeSource();
        this.scheduleReconnect();
      };
      for (const eventName of this.listeners.keys()) {
        source.addEventListener(eventName, this.dispatchEvent);
      }
      this.source = source;
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.started || this.reconnectTimer !== undefined) return;
    const delay = this.reconnectDelayMs;
    this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, maxReconnectDelayMs);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.connect();
    }, delay);
  }

  private closeSource() {
    this.source?.close();
    this.source = undefined;
  }

  private dispatchEvent = (event: Event) => {
    if (!(event instanceof MessageEvent)) return;
    for (const listener of this.listeners.get(event.type) || []) {
      listener(event as MessageEvent<string>);
    }
  };
}

export function getRealtimeConnection(options: RealtimeConnectionOptions) {
  if (typeof window === "undefined") return new RealtimeConnection(options);
  window.__trebleRealtimeConnection ??= new RealtimeConnection(options);
  return window.__trebleRealtimeConnection;
}

export function stopRealtimeConnection() {
  if (typeof window === "undefined") return;
  window.__trebleRealtimeConnection?.stop();
  window.__trebleRealtimeConnection = undefined;
}
