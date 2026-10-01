import type { PageContextServer } from "vike/types";
import { ApiError, bbsClient } from "@/utils/sdk";
import { setPageStatus } from "../../pageStatus";

export async function data(pageContext: PageContextServer) {
  const name = pageContext.routeParams.name;
  try {
    const profile = await bbsClient.account.getProfile({ getProfileReq: { name } });
    if (!profile.profile) {
      setPageStatus(pageContext, 404);
      return { profile: undefined, articles: [], error: "该用户不存在。", pageStatus: 404 as const };
    }
    try {
      const articles = await bbsClient.article.list({
        listArticlesReq: {
          query: { authorId: profile.profile.account?.id, publishStatus: "ARTICLE_PUBLISH_STATUS_PUBLISHED" },
          page: { page: 1, size: 20 },
        },
      });
      return { profile: profile.profile, articles: articles.rows || [] };
    } catch (error) {
      if (error instanceof ApiError && error.status === 403)
        return { profile: profile.profile, articles: [], private: true };
      throw error;
    }
  } catch (error) {
    setPageStatus(pageContext, 404);
    return {
      profile: undefined,
      articles: [],
      error: error instanceof Error ? error.message : "个人主页暂时无法打开。",
      pageStatus: 404 as const,
    };
  }
}
