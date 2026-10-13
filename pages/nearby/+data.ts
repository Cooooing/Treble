import { bbsClient } from "@/utils/sdk";
import { pageRequest } from "@/utils/page";
import type { PageContextServer } from "vike/types";
import { setPageStatus } from "../pageStatus";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  try {
    const articles = await bbsClient.article.listNearby({ listNearbyArticlesReq: { page: pageRequest(1, 15) } });
    return { rows: articles.rows || [] };
  } catch (cause) {
    setPageStatus(pageContext, 500);
    return {
      rows: [],
      error: cause instanceof Error ? cause.message : "位置文章暂时无法加载。",
      pageStatus: 500 as const,
    };
  }
}
