import { bbsClient } from "@/utils/sdk";
import { pageRequest } from "@/utils/page";
import type { PageContextServer } from "vike/types";
import { setPageStatus } from "../../pageStatus";

export type Data = {
  tag?: Awaited<ReturnType<typeof data>>["tag"];
  articles: Awaited<ReturnType<typeof data>>["articles"];
  tags: Awaited<ReturnType<typeof data>>["tags"];
  domains: Awaited<ReturnType<typeof data>>["domains"];
  error?: string;
  pageStatus?: 404 | 500;
};

export async function data(pageContext: PageContextServer): Promise<Data> {
  try {
    const tag = (
      await bbsClient.tag.list({
        listTagsReq: { query: { name: pageContext.routeParams.name }, page: pageRequest(1, 1) },
      })
    ).rows?.[0];
    if (!tag) {
      setPageStatus(pageContext, 404);
      return { articles: [], tags: [], domains: [], error: "你访问的标签不存在或已被删除。", pageStatus: 404 };
    }
    const [articles, tags, domains] = await Promise.all([
      bbsClient.article.list({
        listArticlesReq: {
          query: { tagId: tag.id, publishStatus: "ARTICLE_PUBLISH_STATUS_PUBLISHED" },
          page: pageRequest(1, 15),
        },
      }),
      bbsClient.tag.list({ listTagsReq: { page: pageRequest(1, 100) } }),
      bbsClient.domain.list({ listDomainsReq: { page: pageRequest(1, 100) } }),
    ]);
    return { tag, articles: articles.rows || [], tags: tags.rows || [], domains: domains.rows || [] };
  } catch (cause) {
    setPageStatus(pageContext, 500);
    return {
      articles: [],
      tags: [],
      domains: [],
      error: cause instanceof Error ? cause.message : "标签暂时无法加载。",
      pageStatus: 500,
    };
  }
}
