import type { PageContextServer } from "vike/types";
import { bbsClient } from "@/utils/sdk";
import { setPageStatus } from "../pageStatus";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  try {
    const page = await bbsClient.moonbreeze.pagePublic({ pagePublicMoonbreezesReq: { size: 20 } });
    return { rows: page.rows || [], nextCursor: page.nextCursor };
  } catch (cause) {
    setPageStatus(pageContext, 500);
    return {
      rows: [],
      error: cause instanceof Error ? cause.message : "清风明月暂时无法加载。",
      pageStatus: 500 as const,
    };
  }
}
