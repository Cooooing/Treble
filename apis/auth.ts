import { defHttp } from "@/utils/http";

export interface IRegister {
  /**
   * 邮箱
   */
  email: string;
  /**
   * 用户名
   */
  name: string;
  /**
   * 昵称
   */
  nickname: string;
  /**
   * 密码
   */
  password: string;
}

export interface IRegisterVerify {
  /**
   * 验证码
   */
  code?: string;
  /**
   * 验证码令牌
   */
  codeToken?: string;
}

/**
 * 邮箱是否存在
 * POST /v1/authentication/exist/email
 * 接口ID：362881409
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-362881409
 */
export function checkEmailExist(email: string) {
  return defHttp.post<{ exist: boolean }>({
    url: '/v1/authentication/exist/email',
    data: { email },
  });
}

/**
 * 用户名是否存在
 * POST /v1/authentication/exist/username
 * 接口ID：362881411
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-362881411
 */
export function checkUsernameExist(username: string) {
  return defHttp.post<{ exist: boolean }>({
    url: '/v1/authentication/exist/username',
    data: { username },
  });
}

/**
 * 邮箱注册
 * POST /v1/authentication/register/email
 * 接口ID：362881413
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-362881413
 */
export function registerByEmail(data: IRegister, errorRef?: { value: string }) {
  return defHttp.post<{ codeToken: string }>({
    url: '/v1/authentication/register/email',
    data,
    errorRef,
  });
}

/**
 * 邮箱注册验证码验证
 * POST /v1/authentication/register/email/verify
 * 接口ID：362881414
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-362881414
 */
export function verifyRegisterByEmail(data: IRegisterVerify, errorRef?: { value: string }) {
  return defHttp.post<void>({
    url: '/v1/authentication/register/email/verify',
    data,
    errorRef,
  });
}