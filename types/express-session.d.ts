import 'express-session';
import type { IUser } from '@/apis/auth';

declare module 'express-session' {
  interface SessionData {
    token?: string;
    user?: IUser;
  }
}