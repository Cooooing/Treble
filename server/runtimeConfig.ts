import type { IncomingMessage, ServerResponse } from "node:http";

export function runtimeConfigHandler(realtimeNodeUrl: string) {
  return (_req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("cache-control", "no-store");
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ realtimeNodeUrl }));
  };
}
