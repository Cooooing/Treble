import { bbsClient } from "@/utils/sdk";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data() {
  const [recentsResult, hotsResult] = await Promise.allSettled([
    bbsClient.article.list({ listArticlesReq: { query: { order: "ARTICLE_ORDER_NEWEST" }, page: { page: 1, size: 15 } } }),
    bbsClient.article.list({ listArticlesReq: { query: { order: "ARTICLE_ORDER_HOTTEST" }, page: { page: 1, size: 8 } } }),
  ]);
  return {
    recents: recentsResult.status === 'fulfilled' ? recentsResult.value.rows || [] : [],
    hots: hotsResult.status === 'fulfilled' ? hotsResult.value.rows || [] : [],
    contentError: recentsResult.status === 'rejected' ? '文章暂时无法加载，请刷新后重试。' : '',
  };
}
