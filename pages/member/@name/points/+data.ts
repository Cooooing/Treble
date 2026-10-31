import { ApiError, bbsClient } from "@/utils/sdk";
import { pageRequest } from "@/utils/page";
import type { PageContextServer } from "vike/types";
import { setPageStatus } from "../../../pageStatus";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  const name = String(pageContext.routeParams?.name || "").trim();
  try {
    const profile = await bbsClient.account.getProfile({ getProfileReq: { name } });
    try {
      const records = await bbsClient.account.listPointRecords({
        listPointRecordsReq: { name, page: pageRequest(1, 50) },
      });
      const [tags, domains] = await Promise.all([
        bbsClient.tag.list({ listTagsReq: { page: pageRequest(1, 12) } }),
        bbsClient.domain.list({ listDomainsReq: { page: pageRequest(1, 8) } }),
      ]);
      return { profile: profile.profile, rows: records.rows || [], tags: tags.rows || [], domains: domains.rows || [] };
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 403)
        return { profile: profile.profile, rows: [], tags: [], domains: [], private: true };
      throw cause;
    }
  } catch (cause) {
    setPageStatus(pageContext, 500);
    return {
      profile: undefined,
      rows: [],
      tags: [],
      domains: [],
      error: cause instanceof Error ? cause.message : "积分明细暂时无法加载。",
      pageStatus: 500 as const,
    };
  }
}
