import { bbsClient } from "@/utils/sdk";
import type { PageContextServer } from "vike/types";
import { setPageStatus } from "../pageStatus";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  const query = new URL(pageContext.urlOriginal, "http://treble.local").searchParams.get("q")?.trim() || "";
  if (!query) return { query, rows: [], nextCursor: undefined };

  try {
    const result = await bbsClient.articleSearch.search({
      searchArticlesReq: { query, size: 20 },
    });
    return {
      query,
      rows: result.rows || [],
      nextCursor: result.nextCursor,
    };
  } catch (cause) {
    setPageStatus(pageContext, 500);
    return {
      query,
      rows: [],
      nextCursor: undefined,
      error: cause instanceof Error ? cause.message : "搜索暂时无法完成。",
      pageStatus: 500 as const,
    };
  }
}
