import type { PageContextServer } from "vike/types";
import { bbsClient } from "@/utils/sdk";
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
    const page = await bbsClient.breezemoon.pageMember({ pageMemberBreezemoonsReq: { name, size: 20 } });
    return { profile: profileResponse.profile, rows: page.rows || [], nextCursor: page.nextCursor };
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
