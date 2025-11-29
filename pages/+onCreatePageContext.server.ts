import { getCurrentUser } from "@/apis/user";
import { Request } from "express"
import type { PageContextServer } from 'vike/types'

export async function onCreatePageContext(pageContext: PageContextServer) {
  const req = pageContext.runtime.req as Request;
  pageContext.title = process.env.VITE_GLOB_APP_TITLE;
  if (req?.session?.user) {
    pageContext.user = await getCurrentUser(pageContext.headers || {}).then((res) => res.user).catch(() => null);
    if (pageContext.user) {
      pageContext.token = req.session.token;
    } else {
      delete req.session.user;
      delete req.session.token;
      req.session.save();
    }
  }
}