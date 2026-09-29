import type { PageContextServer } from "vike/types";
import { bbsClient } from "@/utils/sdk";
export async function data(pageContext: PageContextServer) { const name=pageContext.routeParams.name; const profile=await bbsClient.account.getProfile({getProfileReq:{name}}); const comments=profile.profile?.visibility?.comments===false?{rows:[]}:await bbsClient.comment.list({listCommentsReq:{query:{userId:profile.profile?.account?.id},page:{page:1,size:20}}}); return {profile:profile.profile,rows:comments.rows||[]}; }
