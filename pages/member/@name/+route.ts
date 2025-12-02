import { PageContext } from "vike/types"

export function route(pageContext: PageContext) {
  const match = pageContext.urlPathname.match(/\/member\/([^/]+)/)
  if (!match) return false
  const [, name] = match
 
  return {
    routeParams: { name }
  }
}