import { getArticles } from "@/apis/article";
import { getUser } from "@/apis/user";
import { getObjOfUrl } from "@/utils";
import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  const { p } = getObjOfUrl(pageContext.urlOriginal);
  const { user } = await getUser(pageContext.routeParams.name);
  const { rows } = await getArticles({ 
    query: { authorId: user.id }, 
    page: { page: p || 1, size: 20 }
  });
  return { user, articles: rows };
}
