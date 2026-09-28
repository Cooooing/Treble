import { bbsClient } from "@/utils/sdk";
import { render } from "vike/abort";
import type { PageContext } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContext) {
  const tag = (
    await bbsClient.tag.list({
      listTagsReq: { query: { name: pageContext.routeParams.name }, page: { page: 1, size: 1 } },
    })
  ).rows?.[0];
  if (!tag) throw render(404, "你访问的标签不存在或已被删除。");
  const [articles, tags, domains] = await Promise.all([
    bbsClient.article.list({ listArticlesReq: { query: { tagId: tag.id }, page: { page: 1, size: 15 } } }),
    bbsClient.tag.list({ listTagsReq: { page: { page: 1, size: 100 } } }),
    bbsClient.domain.list({ listDomainsReq: { page: { page: 1, size: 100 } } }),
  ]);
  return { tag, articles: articles.rows || [], tags: tags.rows || [], domains: domains.rows || [] };
}
