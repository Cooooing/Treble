import { bbsClient } from "@/utils/sdk";
import type { PageContextServer } from "vike/types";
import { setPageStatus } from "../pageStatus";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  try {
    const [tags, domains] = await Promise.all([
      bbsClient.tag.list({ listTagsReq: { page: { page: 1, size: 100 } } }),
      bbsClient.domain.list({ listDomainsReq: { page: { page: 1, size: 100 } } }),
    ]);
    return { rows: tags.rows || [], domains: domains.rows || [] };
  } catch (cause) {
    setPageStatus(pageContext, 500);
    return {
      rows: [],
      domains: [],
      error: cause instanceof Error ? cause.message : "标签暂时无法加载。",
      pageStatus: 500 as const,
    };
  }
}
