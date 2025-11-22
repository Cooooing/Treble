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

export interface ILogin {
  /**
   * 账号（用户名/邮箱）
   */
  account: string;
  /**
   * 密码
   */
  password: string;
}

/**
 * 用户信息
 */
export interface IUser {
    /**
     * 头像URL
     */
    avatarUrl?: string;
    /**
     * 所在城市
     */
    city?: string;
    /**
     * 所在国家
     */
    country?: string;
    /**
     * 当前连续签到天数
     */
    currentCheckinStreak?: string;
    /**
     * 邮箱
     */
    email: string;
    /**
     * 启用邮件订阅
     */
    enableEmailSubscribe?: boolean;
    /**
     * 启用Web通知
     */
    enableWebNotify?: boolean;
    /**
     * 关注数
     */
    followCount?: string;
    /**
     * 粉丝数
     */
    followerCount?: string;
    /**
     * 用户组名称
     */
    groupName?: string;
    /**
     * 用户ID
     */
    id?: string;
    /**
     * 个人简介
     */
    introduction?: string;
    /**
     * 用户语言
     */
    language?: string;
    /**
     * 最近签到时间
     */
    lastCheckinTime?: Date;
    /**
     * 最近登录IP
     */
    lastLoginIp?: string;
    /**
     * 最近登录时间
     */
    lastLoginTime?: Date;
    /**
     * 最长连续签到天数
     */
    longestCheckinStreak?: string;
    /**
     * 用户 MBTI 类型
     */
    mbti?: string;
    /**
     * 移动端皮肤主题
     */
    mobileTheme?: string;
    /**
     * 用户名
     */
    name: string;
    /**
     * 昵称
     */
    nickname: string;
    /**
     * 在线总时长（分钟）
     */
    onlineMinutes?: string;
    /**
     * 手机号
     */
    phone?: string;
    /**
     * 所在省份
     */
    province?: string;
    /**
     * 是否公开帖子列表
     */
    publicArticles?: boolean;
    /**
     * 是否公开评论列表
     */
    publicComments?: boolean;
    /**
     * 是否公开粉丝列表
     */
    publicFollowers?: boolean;
    /**
     * 是否公开地理位置
     */
    publicLocation?: boolean;
    /**
     * 是否公开在线状态
     */
    publicOnlineStatus?: boolean;
    /**
     * 是否公开积分榜
     */
    publicPoints?: boolean;
    /**
     * 用户状态：0-正常，1-封禁，2-注销
     */
    status?: string;
    /**
     * 皮肤主题
     */
    theme?: string;
    /**
     * 时区
     */
    timezone?: string;
    /**
     * 二步验证 Secret
     */
    twofaSecret?: string;
    /**
     * 用户个人主页链接
     */
    url?: string;
}
/**
 * 邮箱是否存在
 * POST /v1/authentication/exist/email
 * 接口ID：362881409
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-362881409
 */
export function checkEmailExist(email: string, headers?: Record<string, string>) {
  return defHttp.post<{ exist: boolean }>({
    url: '/v1/authentication/exist/email',
    data: { email },
    headers
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

/**
 * 账号登录（用户名/邮箱）
 * POST /v1/authentication/login/account
 * 接口ID：362881412
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-362881412
 */
export function loginByAccount(data: ILogin, errorRef?: { value: string }) {
  return defHttp.post<{ token: string, user: IUser }>({
    url: '/v1/authentication/login/account',
    data,
    errorRef,
  });
}

/**
 * 账号登出
 * POST /v1/authentication/logout
 * 接口ID：380201919
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-380201919
 */
export function logout() {
  return defHttp.post<void>({
    url: '/v1/authentication/logout',
  });
}