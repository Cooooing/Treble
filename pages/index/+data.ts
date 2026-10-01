import { bbsClient } from "@/utils/sdk";
import { pageRequest } from "@/utils/page";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data() {
  const [recentsResult, hotsResult] = await Promise.allSettled([
    bbsClient.article.list({
      listArticlesReq: {
        query: { order: "ARTICLE_ORDER_NEWEST", publishStatus: "ARTICLE_PUBLISH_STATUS_PUBLISHED" },
        page: pageRequest(1, 15),
      },
    }),
    bbsClient.article.list({
      listArticlesReq: {
        query: { order: "ARTICLE_ORDER_HOTTEST", publishStatus: "ARTICLE_PUBLISH_STATUS_PUBLISHED" },
        page: pageRequest(1, 8),
      },
    }),
  ]);
  return {
    recents: recentsResult.status === "fulfilled" ? recentsResult.value.rows || [] : [],
    hots: hotsResult.status === "fulfilled" ? hotsResult.value.rows || [] : [],
    contentError: recentsResult.status === "rejected" ? "文章暂时无法加载，请刷新后重试。" : "",
  };
}
