import { redirect } from 'vike/abort';
import type { PageContextServer } from 'vike/types';

export async function guard(pageContext: PageContextServer) {
  if (pageContext.user) return;
  const requestedUrl = new URL(pageContext.urlOriginal, 'http://treble.local');
  const next = `${requestedUrl.pathname}${requestedUrl.search}`;
  throw redirect(`/login?next=${encodeURIComponent(next)}`);
}
