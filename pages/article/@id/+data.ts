import { getArticle } from "@/apis/article";
import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  return getArticle(pageContext.routeParams.id).then((article) => ({ article }));
}
