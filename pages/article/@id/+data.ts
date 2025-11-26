import { getArticle } from "@/apis/article";
import { getComments } from "@/apis/comment";
import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  const article = getArticle(pageContext.routeParams.id).then(res => res.article);
  const comments = getComments({ 
    page: {
      page: 1, size: 20
    }, 
    query: { 
      article_id: pageContext.routeParams.id 
    } 
  });
  return {
    article: await article,
    comments: await comments,
  };
}
