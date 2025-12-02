import { getArticles } from "@/apis/article";
import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  return getArticles({ 
    query: { order: 0 }, 
    page: { page: 1, size: 15 }
  });
}
