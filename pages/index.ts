import { usePageContext } from "vike-vue/usePageContext";

export interface ILayoutContext {
  pageContext: ReturnType<typeof usePageContext>;
}

export const LayoutContextKey: InjectionKey<ILayoutContext> = Symbol('LayoutContextKey');