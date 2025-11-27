// pages/some-page/+title.js
// Environment: server, client

import { PageContext } from "vike/types";
import { Data } from "./+data";

 
export function title(pageContext: PageContext) {
  return (pageContext.data as Data).article.title + ' | ' + pageContext.title
}