import { bbsClient } from "@/utils/sdk";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data() {
  const [domains, tags] = await Promise.all([
    bbsClient.domain.list({ listDomainsReq: { page: { page: 1, size: 100 } } }),
    bbsClient.tag.list({ listTagsReq: { page: { page: 1, size: 100 } } }),
  ]);
  return { rows: domains.rows || [], tags: tags.rows || [] };
}
