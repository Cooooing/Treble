import { ApiError } from "@/utils/sdk";
import { bbsClient } from "@/utils/sdk";
import { render } from "vike/abort";
import type { ArticleDetail } from "@bass/bbs-sdk-fetch/models/ArticleDetail";
import type { ArticleListItem } from "@bass/bbs-sdk-fetch/models/ArticleListItem";
import type { ArticlePostscript } from "@bass/bbs-sdk-fetch/models/ArticlePostscript";
import type { ListCommentThreadsResp } from "@bass/bbs-sdk-fetch/models/ListCommentThreadsResp";
import type { PageContextServer } from "vike/types";

export type Data = {
  article?: ArticleDetail;
  comments?: ListCommentThreadsResp;
  latest?: ArticleListItem[];
  hottest?: ArticleListItem[];
  postscripts?: ArticlePostscript[];
  error?: string;
};

export async function data(pageContext: PageContextServer): Promise<Data> {
  try {
    const [article, comments, latest, hottest, postscripts] = await Promise.all([
      bbsClient.article
        .get({ getArticleReq: { articleId: pageContext.routeParams.id } })
        .then((response) => response.article),
      bbsClient.comment.listThreads({
        listCommentThreadsReq: {
          articleId: pageContext.routeParams.id,
          order: "COMMENT_ORDER_HOTTEST",
          page: { page: 1, size: 20 },
          replyPreviewLimit: 3,
        },
      }),
      bbsClient.article
        .list({
          listArticlesReq: {
            page: { page: 1, size: 6 },
            query: { order: "ARTICLE_ORDER_NEWEST" },
          },
        })
        .then((response) => response.rows || []),
      bbsClient.article
        .list({
          listArticlesReq: {
            page: { page: 1, size: 6 },
            query: { order: "ARTICLE_ORDER_HOTTEST" },
          },
        })
        .then((response) => response.rows || []),
      bbsClient.postscript
        .list({ listPostscriptsReq: { articleId: pageContext.routeParams.id } })
        .then((response) => response.rows || []),
    ]);
    return { article, comments, latest, hottest, postscripts };
  } catch (cause) {
    if (cause instanceof ApiError && (cause.status === 404 || cause.code === 404)) {
      throw render(404, "你访问的文章不存在或已被删除。");
    }
    return { error: cause instanceof Error ? cause.message : "文章暂时无法加载。" };
  }
}
