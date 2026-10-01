import type { PageContextServer } from "vike/types";
import { ApiError, bbsClient } from "@/utils/sdk";
import { setPageStatus } from "../../../pageStatus";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  const name = pageContext.routeParams.name;
  try {
    const profileResponse = await bbsClient.account.getProfile({ getProfileReq: { name } });
    if (!profileResponse.profile) {
      setPageStatus(pageContext, 404);
      return { profile: undefined, rows: [], error: "该用户不存在。", pageStatus: 404 as const };
    }
    try {
      const page = await bbsClient.moonbreeze.pageMember({ pageMemberMoonbreezesReq: { name, size: 20 } });
      return { profile: profileResponse.profile, rows: page.rows || [], nextCursor: page.nextCursor };
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        return { profile: profileResponse.profile, rows: [], nextCursor: undefined, private: true };
      }
      throw error;
    }
  } catch (cause) {
    setPageStatus(pageContext, 404);
    return {
      profile: undefined,
      rows: [],
      error: cause instanceof Error ? cause.message : "个人动态暂时无法打开。",
      pageStatus: 404 as const,
    };
  }
}
