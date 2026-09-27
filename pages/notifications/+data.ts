import type { PageContextServer } from "vike/types";
import { bbsClient } from "@/utils/sdk";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(_pageContext: PageContextServer) {
  return bbsClient.notification.list({ listNotificationsReq: { page: { page: 1, size: 30 } } });
}
