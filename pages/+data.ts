// https://vike.dev/data

import { getTheme } from "@/apis/theme";
import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export function data(_pageContext: PageContextServer) {
  return getTheme();
}
