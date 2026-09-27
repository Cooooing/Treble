import { bbsClient } from "@/utils/sdk";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data() {
  const [tags, domains] = await Promise.all([
    bbsClient.tag.list({ listTagsReq: { page: { page: 1, size: 100 } } }),
    bbsClient.domain.list({ listDomainsReq: { page: { page: 1, size: 8 } } }),
  ]);
  return { rows: tags.rows || [], domains: domains.rows || [] };
}
