import { PageContext } from "vike/types";
import { Data } from "./+data";

export function title(pageContext: PageContext) {
  return ((pageContext.data as Data).article?.title || "文章") + " | 摸鱼派";
}
