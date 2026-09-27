import { ApiError } from "@/utils/sdk";
import { bbsClient } from "@/utils/sdk";
import { render } from "vike/abort";
import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;
export async function data(pageContext: PageContextServer) {
  try {
    return await bbsClient.article.get({ getArticleReq: { articleId: pageContext.routeParams.id } });
  } catch (cause) {
    if (cause instanceof ApiError && (cause.status === 404 || cause.code === 404)) {
      throw render(404, "你访问的草稿不存在或已被删除。");
    }
    return {};
  }
}
