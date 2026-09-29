import { bbsClient } from "@/utils/sdk";
import type { PageContextServer } from "vike/types";
import { setPageStatus } from "../../pageStatus";

export type Data = {
  domain?: Awaited<ReturnType<typeof data>>["domain"];
  articles: Awaited<ReturnType<typeof data>>["articles"];
  domainTags: Awaited<ReturnType<typeof data>>["domainTags"];
  sidebarTags: Awaited<ReturnType<typeof data>>["sidebarTags"];
  domains: Awaited<ReturnType<typeof data>>["domains"];
  error?: string;
  pageStatus?: 404 | 500;
};

export async function data(pageContext: PageContextServer): Promise<Data> {
  try {
    const domain = (
      await bbsClient.domain.list({
        listDomainsReq: { query: { code: pageContext.routeParams.id }, page: { page: 1, size: 1 } },
      })
    ).rows?.[0];

    if (!domain) {
      setPageStatus(pageContext, 404);
      return { articles: [], domainTags: [], sidebarTags: [], domains: [], error: "你访问的领域不存在或已被删除。", pageStatus: 404 };
    }

    const [articles, domainTags, sidebarTags, domains] = await Promise.all([
      bbsClient.article.list({ listArticlesReq: { query: { domainId: domain.id }, page: { page: 1, size: 15 } } }),
      bbsClient.tag.list({ listTagsReq: { query: { domainId: domain.id }, page: { page: 1, size: 100 } } }),
      bbsClient.tag.list({ listTagsReq: { page: { page: 1, size: 100 } } }),
      bbsClient.domain.list({ listDomainsReq: { page: { page: 1, size: 100 } } }),
    ]);

    return { domain, articles: articles.rows || [], domainTags: domainTags.rows || [], sidebarTags: sidebarTags.rows || [], domains: domains.rows || [] };
  } catch (cause) {
    setPageStatus(pageContext, 500);
    return { articles: [], domainTags: [], sidebarTags: [], domains: [], error: cause instanceof Error ? cause.message : "领域暂时无法加载。", pageStatus: 500 };
  }
}
