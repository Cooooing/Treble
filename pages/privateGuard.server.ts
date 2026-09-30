import { redirect } from "vike/abort";
import type { PageContextServer } from "vike/types";

export async function guard(pageContext: PageContextServer) {
  if (pageContext.user) return;
  const requestedUrl = new URL(pageContext.urlOriginal, "http://treble.local");
  // Client-side Vike navigation asks for an internal pageContext URL. It is not a
  // user-facing route and must never become the post-login destination.
  const pathname = requestedUrl.pathname.replace(/\/index\.pageContext\.json$/, "") || "/";
  const next = `${pathname}${requestedUrl.search}`;
  throw redirect(`/login?next=${encodeURIComponent(next)}`);
}
