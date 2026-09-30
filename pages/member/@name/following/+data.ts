import type { PageContextServer } from "vike/types";
import { bbsClient } from "@/utils/sdk";

export async function data(pageContext: PageContextServer) {
  const name = pageContext.routeParams.name;
  const [profile, result] = await Promise.all([
    bbsClient.account.getProfile({ getProfileReq: { name } }),
    bbsClient.account.listFollowing({ listFollowingReq: { name, page: { page: 1, size: 30 } } }),
  ]);
  return { profile: profile.profile, rows: result.rows || [] };
}
