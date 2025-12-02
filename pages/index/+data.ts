import { getArticles } from "@/apis/article";
import { getComments } from "@/apis/comment";
import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  const recents = getArticles({ 
    query: { order: 0 }, 
    page: { page: 1, size: 15 }
  }).then(res => res.rows);
  const hots = getArticles({ 
    query: { order: 1 }, 
    page: { page: 1, size: 15 }
  }).then(res => res.rows);
  return {
    recents: await recents,
    hots: await hots,
  };
}
