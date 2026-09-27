import { bbsClient } from "@/utils/sdk";
import { render } from "vike/abort";
import type { PageContext } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContext) {
  const domain = (
    await bbsClient.domain.list({
      listDomainsReq: { query: { code: pageContext.routeParams.id }, page: { page: 1, size: 1 } },
    })
  ).rows?.[0];

  if (!domain) throw render(404, "你访问的领域不存在或已被删除。");

  const [articles, tags, domains] = await Promise.all([
    bbsClient.article.list({ listArticlesReq: { query: { domainId: domain.id }, page: { page: 1, size: 15 } } }),
    bbsClient.tag.list({ listTagsReq: { query: { domainId: domain.id }, page: { page: 1, size: 100 } } }),
    bbsClient.domain.list({ listDomainsReq: { page: { page: 1, size: 8 } } }),
  ]);

  return { domain, articles: articles.rows || [], tags: tags.rows || [], domains: domains.rows || [] };
}
