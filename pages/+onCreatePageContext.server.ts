import type { PageContextServer } from "vike/types";
import { bbsClient } from "@/utils/sdk";
import { ApiError } from "@/utils/sdk/shared";
import { sessionCookieClearValue } from "@/server/bbsGateway";

export async function onCreatePageContext(pageContext: PageContextServer) {
  pageContext.title = process.env.VITE_GLOB_APP_TITLE;
  pageContext.user = undefined;
  const hasSession = pageContext.headers?.cookie?.split(";").some((item) => item.trimStart().startsWith("treble.sid="));
  if (!hasSession) return;

  try {
    const response = await bbsClient.account.getCurrent({ body: {} });
    if (response.account?.profile) pageContext.user = response.account;
  } catch (error) {
    pageContext.user = undefined;
    // A timeout, Redis failure, or upstream 5xx must not turn into a permanent logout.
    // Only the BFF's explicit 401 proves that this browser session is no longer usable.
    if (error instanceof ApiError && error.status === 401) {
      pageContext.headersResponse?.append("set-cookie", sessionCookieClearValue(process.env.NODE_ENV === "production"));
    }
  }
}
