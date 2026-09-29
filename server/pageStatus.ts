import { enhance, MiddlewareOrder } from "@universal-middleware/core";

const pageStatusHeader = "x-treble-page-status";
const pageContextSuffix = "/index.pageContext.json";

export const pageStatusMiddleware = enhance(
  async (request: Request) => (response: Response) => {
    const status = response.headers.get(pageStatusHeader);
    if (!status) return;

    const headers = new Headers(response.headers);
    headers.delete(pageStatusHeader);

    // Vike client navigation always needs a successful JSON response. Only the
    // initial HTML document carries the semantic HTTP status for crawlers.
    const isPageContextRequest = new URL(request.url).pathname.endsWith(pageContextSuffix);
    return new Response(response.body, {
      status: isPageContextRequest ? response.status : Number(status),
      statusText: response.statusText,
      headers,
    });
  },
  { name: "treble-page-status", order: MiddlewareOrder.RESPONSE_TRANSFORM },
);
