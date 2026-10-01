import type { PageContextServer } from "vike/types";
import { ApiError, bbsClient } from "@/utils/sdk";

export async function data(pageContext: PageContextServer) {
  const name = pageContext.routeParams.name;
  const profile = await bbsClient.account.getProfile({ getProfileReq: { name } });
  try {
    const result = await bbsClient.account.listFollowing({ listFollowingReq: { name, page: { page: 1, size: 30 } } });
    return { profile: profile.profile, rows: result.rows || [] };
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) return { profile: profile.profile, rows: [], private: true };
    throw error;
  }
}
