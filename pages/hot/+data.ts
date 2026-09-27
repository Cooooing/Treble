import { bbsClient } from "@/utils/sdk";
export type Data = Awaited<ReturnType<typeof data>>;

export async function data() {
  const [articles, tags, domains] = await Promise.all([
    bbsClient.article.list({ listArticlesReq: { query: { order: "ARTICLE_ORDER_HOTTEST" }, page: { page: 1, size: 15 } } }),
    bbsClient.tag.list({ listTagsReq: { page: { page: 1, size: 12 } } }),
    bbsClient.domain.list({ listDomainsReq: { page: { page: 1, size: 8 } } }),
  ]);
  return { rows: articles.rows || [], tags: tags.rows || [], domains: domains.rows || [] };
}
