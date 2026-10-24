import type { PageContextServer } from "vike/types";

/** Records enough safe context to correlate Vike's fallback page with BFF logs. */
export function onError(error: unknown, pageContext: PageContextServer | null) {
  const requestID = pageContext?.headers?.["x-request-id"];
  const details = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { error };
  console.error("treble SSR render failed", {
    request_id: requestID,
    route: pageContext?.urlPathname,
    ...details,
  });
}
