import { defHttp } from "@/utils/http";

export function getTheme() {
  return defHttp.get<{ theme: string }>({
    url: '/theme',
  });
}