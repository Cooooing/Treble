import { bbsClient } from "@/utils/sdk";
import type { PageContextServer } from "vike/types";
import { setPageStatus } from "../pageStatus";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  try {
    const [articles, tags, domains, moonbreezes] = await Promise.all([
      bbsClient.article.list({
        listArticlesReq: {
          query: { order: "ARTICLE_ORDER_NEWEST", publishStatus: "ARTICLE_PUBLISH_STATUS_PUBLISHED" },
          page: { page: 1, size: 15 },
        },
      }),
      bbsClient.tag.list({ listTagsReq: { page: { page: 1, size: 12 } } }),
      bbsClient.domain.list({ listDomainsReq: { page: { page: 1, size: 8 } } }),
      bbsClient.moonbreeze.pagePublic({ pagePublicMoonbreezesReq: { size: 5 } }).catch(() => undefined),
    ]);
    return {
      rows: articles.rows || [],
      tags: tags.rows || [],
      domains: domains.rows || [],
      moonbreezes: moonbreezes?.rows || [],
    };
  } catch (cause) {
    setPageStatus(pageContext, 500);
    return {
      rows: [],
      tags: [],
      domains: [],
      moonbreezes: [],
      error: cause instanceof Error ? cause.message : "最新文章暂时无法加载。",
      pageStatus: 500 as const,
    };
  }
}
