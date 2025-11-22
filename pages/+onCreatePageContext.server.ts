import { Request } from "express"
import type { PageContextServer } from 'vike/types'

export async function onCreatePageContext(pageContext: PageContextServer) {
  const req = pageContext.runtime.req as Request;
  if (req?.session?.user) {
    pageContext.user = {  } as any; //req.session.user;
  }
}