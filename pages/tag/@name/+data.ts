import { getArticles, IArticle } from "@/apis/article";
import { IBasicPageResult } from "@/apis/common";
import { getTags } from "@/apis/tag";
import type { PageContext } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContext) {
  const tag = await getTags({ 
    query: { name: pageContext.routeParams.name }, 
    page: { page: 1, size: 15 }
  }).then(res => res.rows.find(t => t.name === pageContext.routeParams.name));
  const articles = tag ? await getArticles({ 
    query: { tagId: tag.id }, 
    page: { page: 1, size: 15 }
  }) : { page: { page: 1, size: 15, total: 0 }, rows: [] } as IBasicPageResult<IArticle>;
  return { tag, articles };
}
