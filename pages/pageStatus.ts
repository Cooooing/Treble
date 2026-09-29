import type { PageContextServer } from "vike/types";

const pageStatusHeader = "x-treble-page-status";

export function setPageStatus(pageContext: PageContextServer, status: 404 | 500) {
  pageContext.headersResponse.set(pageStatusHeader, String(status));
}
