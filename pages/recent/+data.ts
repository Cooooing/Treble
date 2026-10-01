import { bbsClient } from "@/utils/sdk";
import { pageRequest } from "@/utils/page";
import type { PageContextServer } from "vike/types";
import { setPageStatus } from "../pageStatus";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  try {
    const [articles, tags, domains, moonbreezes, viewHistory] = await Promise.all([
      bbsClient.article.list({
        listArticlesReq: {
          query: { order: "ARTICLE_ORDER_NEWEST", publishStatus: "ARTICLE_PUBLISH_STATUS_PUBLISHED" },
          page: pageRequest(1, 15),
        },
      }),
      bbsClient.tag.list({ listTagsReq: { page: pageRequest(1, 12) } }),
      bbsClient.domain.list({ listDomainsReq: { page: pageRequest(1, 8) } }),
      bbsClient.moonbreeze.pagePublic({ pagePublicMoonbreezesReq: { size: 5 } }).catch(() => undefined),
      pageContext.user
        ? bbsClient.article
            .pageViewHistory({ pageArticleViewHistoryReq: { page: pageRequest(1, 5) } })
            .catch(() => undefined)
        : Promise.resolve(undefined),
    ]);
    return {
      rows: articles.rows || [],
      tags: tags.rows || [],
      domains: domains.rows || [],
      moonbreezes: moonbreezes?.rows || [],
      viewHistory: pageContext.user ? viewHistory?.rows || [] : undefined,
    };
  } catch (cause) {
    setPageStatus(pageContext, 500);
    return {
      rows: [],
      tags: [],
      domains: [],
      moonbreezes: [],
      viewHistory: pageContext.user ? [] : undefined,
      error: cause instanceof Error ? cause.message : "最新文章暂时无法加载。",
      pageStatus: 500 as const,
    };
  }
}
