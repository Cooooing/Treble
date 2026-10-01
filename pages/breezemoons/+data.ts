import type { PageContextServer } from "vike/types";
import { bbsClient } from "@/utils/sdk";
import { setPageStatus } from "../pageStatus";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  try {
    const page = await bbsClient.breezemoon.pagePublic({ pagePublicBreezemoonsReq: { size: 20 } });
    return { rows: page.rows || [], nextCursor: page.nextCursor };
  } catch (cause) {
    setPageStatus(pageContext, 500);
    return {
      rows: [],
      error: cause instanceof Error ? cause.message : "明月清风暂时无法加载。",
      pageStatus: 500 as const,
    };
  }
}
