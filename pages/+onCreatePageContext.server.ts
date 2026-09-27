import type { PageContextServer } from "vike/types";
import { bbsClient } from "@/utils/sdk";
import { sessionCookieClearValue } from "@/server/bbsGateway";

export async function onCreatePageContext(pageContext: PageContextServer) {
  pageContext.title = process.env.VITE_GLOB_APP_TITLE;
  const hasSession = pageContext.headers?.cookie?.split(";").some((item) => item.trimStart().startsWith("treble.sid="));
  if (!hasSession) return;

  try {
    const response = await bbsClient.account.getCurrent({ body: {} });
    if (response.account?.profile) pageContext.user = response.account;
  } catch {
    pageContext.user = undefined;
    pageContext.headersResponse?.append("set-cookie", sessionCookieClearValue(process.env.NODE_ENV === "production"));
  }
}
