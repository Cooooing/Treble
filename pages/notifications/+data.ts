import type { PageContextServer } from "vike/types";
import { bbsClient } from "@/utils/sdk";
import { setPageStatus } from "../pageStatus";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  try {
    return await bbsClient.notification.list({ listNotificationsReq: { page: { page: 1, size: 30 } } });
  } catch (cause) {
    setPageStatus(pageContext, 500);
    return {
      rows: [],
      error: cause instanceof Error ? cause.message : "通知暂时无法加载。",
      pageStatus: 500 as const,
    };
  }
}
