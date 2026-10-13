import type { PageContextServer } from "vike/types";
import { bbsClient } from "@/utils/sdk";
import { pageRequest } from "@/utils/page";
import { setPageStatus } from "../pageStatus";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  try {
    const [page, tags, domains, viewHistory] = await Promise.all([
      bbsClient.moonbreeze.pagePublic({ pagePublicMoonbreezesReq: { size: 20 } }),
      bbsClient.tag.list({ listTagsReq: { page: pageRequest(1, 12) } }),
      bbsClient.domain.list({ listDomainsReq: { page: pageRequest(1, 8) } }),
      pageContext.user
        ? bbsClient.article
            .pageViewHistory({ pageArticleViewHistoryReq: { page: pageRequest(1, 5) } })
            .catch(() => undefined)
        : Promise.resolve(undefined),
    ]);
    return {
      rows: page.rows || [],
      nextCursor: page.nextCursor,
      tags: tags.rows || [],
      domains: domains.rows || [],
      viewHistory: pageContext.user ? viewHistory?.rows || [] : undefined,
    };
  } catch (cause) {
    setPageStatus(pageContext, 500);
    return {
      rows: [],
      tags: [],
      domains: [],
      viewHistory: pageContext.user ? [] : undefined,
      error: cause instanceof Error ? cause.message : "清风明月暂时无法加载。",
      pageStatus: 500 as const,
    };
  }
}
