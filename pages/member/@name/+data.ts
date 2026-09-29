import type { PageContextServer } from "vike/types";
import { bbsClient } from "@/utils/sdk";
import { setPageStatus } from "../../pageStatus";

export async function data(pageContext: PageContextServer) {
  const name = pageContext.routeParams.name;
  try {
    const profile = await bbsClient.account.getProfile({ getProfileReq: { name } });
    if (!profile.profile) { setPageStatus(pageContext, 404); return { profile: undefined, articles: [], error: "该用户不存在。", pageStatus: 404 as const }; }
    const articles = profile.profile.visibility?.articles === false ? [] : (await bbsClient.article.list({ listArticlesReq: { query: { authorId: profile.profile.account?.id }, page: { page: 1, size: 20 } } })).rows || [];
    return { profile: profile.profile, articles };
  } catch (error) { setPageStatus(pageContext, 404); return { profile: undefined, articles: [], error: error instanceof Error ? error.message : "个人主页暂时无法打开。", pageStatus: 404 as const }; }
}
