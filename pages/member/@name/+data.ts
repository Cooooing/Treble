import { getArticles } from "@/apis/article";
import { getComments } from "@/apis/comment";
import { getUser } from "@/apis/user";
import { getObjOfUrl } from "@/utils";
import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  const { p } = getObjOfUrl(pageContext.urlOriginal);
  const { user } = await getUser(pageContext.routeParams.name);
  const { rows: articles } = await getArticles({ 
    query: { authorId: user.id }, 
    page: { page: p || 1, size: 20 }
  });
  const { rows: comments } = await getComments({ 
    query: { user_id: user.id, with_article: true }, 
    page: { page: p || 1, size: 20 }
  });
  return { user, articles, comments };
}
