export const isServer = typeof window === "undefined";
export const isClient = !isServer;

export function isString(val: unknown): val is string {
  return typeof val === "string";
}
