import { bbsClient } from "@/utils/sdk";
import type { PageContextServer } from "vike/types";
import { setPageStatus } from "../pageStatus";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  try {
    const [domains, tags] = await Promise.all([
      bbsClient.domain.list({ listDomainsReq: { page: { page: 1, size: 100 } } }),
      bbsClient.tag.list({ listTagsReq: { page: { page: 1, size: 100 } } }),
    ]);
    return { rows: domains.rows || [], tags: tags.rows || [] };
  } catch (cause) {
    setPageStatus(pageContext, 500);
    return {
      rows: [],
      tags: [],
      error: cause instanceof Error ? cause.message : "领域暂时无法加载。",
      pageStatus: 500 as const,
    };
  }
}
