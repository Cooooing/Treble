import type { PageContextServer } from "vike/types";
import { bbsClient } from "@/utils/sdk";
import { pageRequest } from "@/utils/page";
import { setPageStatus } from "../pageStatus";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  const url = new URL(pageContext.urlOriginal, "http://treble.local");
  const requestedPage = Number.parseInt(url.searchParams.get("page") || "1", 10);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  try {
    return await bbsClient.article.pageViewHistory({ pageArticleViewHistoryReq: { page: pageRequest(page, 20) } });
  } catch (cause) {
    setPageStatus(pageContext, 500);
    return {
      rows: [],
      error: cause instanceof Error ? cause.message : "浏览历史暂时无法加载。",
      pageStatus: 500 as const,
    };
  }
}
