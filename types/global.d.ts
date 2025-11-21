import type { IUser } from '@/apis/auth';
import type {
  VNodeChild,
  ComponentPublicInstance,
  FunctionalComponent,
  PropType as VuePropType,
} from 'vue';

declare global {
  // vue
  type PropType<T> = VuePropType<T>;
  type VueNode = VNodeChild | JSX.Element;

  type Undefable<T> = T | undefined;
  type Nullable<T> = T | null;
  type NonNullable<T> = T extends null | undefined ? never : T;
  type Nullish<T> = T | null | undefined;

  type Recordable<T = any> = Record<string, T>;
  type ReadonlyRecordable<T = any> = {
    readonly [key: string]: T;
  };

  type TimeoutHandle = ReturnType<typeof setTimeout>;
  type IntervalHandle = ReturnType<typeof setInterval>;

  interface ViteEnv {
    VITE_USE_MOCK: boolean;
    VITE_GLOB_APP_TITLE: string;
    VITE_DROP_CONSOLE: boolean;
    VITE_LEGACY: boolean;
    VITE_COMPRESS: boolean;
  }

  function parseInt(s: string | number, radix?: number): number;

  function parseFloat(string: string | number): number;

  // https://blog.vuejs.org/posts/vue-3-4#removed-global-jsx-namespace
  namespace JSX {
    // tslint:disable no-empty-interface
    type Element = VNode;
    // tslint:disable no-empty-interface
    type ElementClass = ComponentRenderProxy;
    interface ElementAttributesProperty {
      $props: any;
    }
    interface IntrinsicElements {
      [elem: string]: any;
    }
    interface IntrinsicAttributes {
      [elem: string]: any;
    }
  }
}

declare module 'vue' {
  export type JSXComponent<Props = any> =
    | { new (): ComponentPublicInstance<Props> }
    | FunctionalComponent<Props>;
}


declare global {
  namespace Vike {
    interface GlobalContext {
      // Type of globalContext.user
      token?: string | null;
    }

    interface PageContext {
      user?: IUser;
    }
  }
} 