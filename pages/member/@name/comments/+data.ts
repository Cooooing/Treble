import type { PageContextServer } from "vike/types";
import { ApiError, bbsClient } from "@/utils/sdk";
import { pageRequest } from "@/utils/page";

export async function data(pageContext: PageContextServer) {
  const name = pageContext.routeParams.name;
  const profile = await bbsClient.account.getProfile({ getProfileReq: { name } });
  try {
    const comments = await bbsClient.comment.list({
      listCommentsReq: { query: { userId: profile.profile?.account?.id }, page: pageRequest(1, 20) },
    });
    return { profile: profile.profile, rows: comments.rows || [] };
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) return { profile: profile.profile, rows: [], private: true };
    throw error;
  }
}
