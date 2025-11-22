import { IUser } from '@/apis/auth';

export * from './is';

export interface PageContext {
  user?: IUser;
}


export const PageContextKey: InjectionKey<PageContext> = Symbol('PageContextKey');