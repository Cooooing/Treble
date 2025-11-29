import { getUser } from "@/apis/user";
import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  return await getUser(pageContext.routeParams.name);
}
