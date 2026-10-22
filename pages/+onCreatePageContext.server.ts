import type { PageContextServer } from "vike/types";
import type { RespCurrentAccount } from "@bass/bbs-sdk-fetch/models/RespCurrentAccount";
import { getSessionRepository, type TrebleSession } from "@/server/session";
import { bffUrl } from "@/utils/sdk/server";

function sessionID(cookie: string | undefined) {
  return cookie
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("treble.sid="))
    ?.slice("treble.sid=".length);
}

async function currentAccount(session: TrebleSession) {
  const response = await fetch(new URL("/v1/user/account/get-current", bffUrl), {
    method: "POST",
    headers: {
      authorization: `Bearer ${session.accessToken}`,
      "content-type": "application/json",
    },
    body: "{}",
    signal: AbortSignal.timeout(3_000),
  });
  if (!response.ok) return undefined;
  const envelope = (await response.json()) as { code?: number; data?: { account?: RespCurrentAccount } };
  return envelope.code === 0 || envelope.code === 200 ? envelope.data?.account : undefined;
}

export async function onCreatePageContext(pageContext: PageContextServer) {
  pageContext.title = process.env.VITE_GLOB_APP_TITLE;
  pageContext.user = undefined;
  const sid = sessionID(pageContext.headers?.cookie);
  if (!sid) return;

  try {
    const session = await getSessionRepository().get(decodeURIComponent(sid));
    if (!session) return;
    const account = await currentAccount(session);
    if (account?.profile) pageContext.user = account;
  } catch {
    pageContext.user = undefined;
  }
}
