// https://vike.dev/data

import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  return { theme: pageContext.user?.theme || 'default' };
}
