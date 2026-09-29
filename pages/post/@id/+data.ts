import { ApiError } from "@/utils/sdk";
import { bbsClient } from "@/utils/sdk";
import type { PageContextServer } from "vike/types";
import { setPageStatus } from "../../pageStatus";

export type Data = Awaited<ReturnType<typeof data>> & { error?: string; pageStatus?: 404 | 500 };
export async function data(pageContext: PageContextServer): Promise<Data> {
  try {
    return await bbsClient.article.get({ getArticleReq: { articleId: pageContext.routeParams.id } });
  } catch (cause) {
    if (cause instanceof ApiError && (cause.status === 404 || cause.code === 404)) {
      setPageStatus(pageContext, 404);
      return { error: "你访问的草稿不存在或已被删除。", pageStatus: 404 };
    }
    setPageStatus(pageContext, 500);
    return { error: cause instanceof Error ? cause.message : "草稿暂时无法加载。", pageStatus: 500 };
  }
}
