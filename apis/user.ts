import { defHttp } from "@/utils/http";
import { IBasicPageParams, IBasicPageResult } from "./common";

/**
 * 用户查询参数
 */
export interface IUserQuery {
  /**
   * 邮箱
   */
  email?: string;
  /**
   * 邮箱列表
   */
  emails?: string[];
  /**
   * 用户名
   */
  name?: string;
  /**
   * 用户名列表
   */
  names?: string[];
  /**
   * 昵称
   */
  nickname?: string;
  /**
   * 昵称列表
   */
  nicknames?: string[];
  /**
   * 手机号
   */
  phone?: string;
  /**
   * 手机号列表
   */
  phones?: string[];
  /**
   * 用户ID列表
   */
  userIds?: string[];
}

/**
 * 用户信息
 */
export interface IUser {
  /**
   * 头像URL
   */
  avatar_url: string;
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
  current_checkin_streak?: string;
  /**
   * 邮箱
   */
  email: string;
  /**
   * 启用邮件订阅
   */
  enable_email_subscribe: boolean;
  /**
   * 启用Web通知
   */
  enable_web_notify: boolean;
  /**
   * 关注数
   */
  follow_count: string;
  /**
   * 粉丝数
   */
  follower_count: string;
  /**
   * 用户组名称
   */
  group_name: string;
  /**
   * 用户ID
   */
  id: string;
  /**
   * 个人简介
   */
  introduction: string;
  /**
   * 用户语言
   */
  language: string;
  /**
   * 最近签到时间
   */
  last_checkin_time?: IDateLite;
  /**
   * 最近登录IP
   */
  last_login_ip?: string;
  /**
   * 最近登录时间
   */
  last_login_time: IDateLite;
  /**
   * 最长连续签到天数
   */
  longest_checkin_streak: string;
  /**
   * 用户 MBTI 类型
   */
  mbti?: string;
  /**
   * 移动端皮肤主题
   */
  mobile_theme: string;
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
  online_minutes: string;
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
  public_articles: boolean;
  /**
   * 是否公开评论列表
   */
  public_comments: boolean;
  /**
   * 是否公开粉丝列表
   */
  public_followers: boolean;
  /**
   * 是否公开地理位置
   */
  public_location: boolean;
  /**
   * 是否公开在线状态
   */
  public_online_status: boolean;
  /**
   * 是否公开积分榜
   */
  public_points: boolean;
  /**
   * 用户状态：0-正常，1-封禁，2-注销
   */
  status: string;
  /**
   * 皮肤主题
   */
  theme: string;
  /**
   * 时区
   */
  timezone: string;
  /**
   * 二步验证 Secret
   */
  twofa_secret?: string;
  /**
   * 用户个人主页链接
   */
  url: string;
}

export interface IUserUpdate {
  /**
   * 头像URL
   */
  avatar_url?: string;
  /**
   * 启用邮件订阅
   */
  enable_email_subscribe?: boolean;
  /**
   * 启用Web通知
   */
  enable_web_notify?: boolean;
  /**
   * 用户语言
   */
  language?: string;
  /**
   * 移动端皮肤主题
   */
  mobile_theme?: string;
  /**
   * 皮肤主题
   */
  theme?: string;
  /**
   * 时区
   */
  timezone?: string;
}

/**
 * 获取当前用户信息
 * POST /v1/user/getCurrentUser
 * 接口ID：379919834
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-379919834
 */
export function getCurrentUser(headers?: Record<string, string>) {
  return defHttp.post<{ user: IUser }>({
    url: '/user/v1/user/getCurrentUser',
    headers,
  });
}

/**
 * 分页查询用户
 * POST /user/v1/user/page
 * 接口ID：381810218
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-381810218
 */
export function getUsers(data: IBasicPageParams<IUserQuery>) {
  return defHttp.post<IBasicPageResult<IUser>>({
    url: '/user/v1/user/page',
    data,
  });
}

/**
 * 查询单个用户
 * POST /v1/user/getOne
 * 接口ID：370061636
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-370061636
 */
export function getUser(name: string) {
  return defHttp.post<{user: IUser}>({
    url: '/user/v1/user/getOne',
    data: { name },
  });
}

/**
 * 更新用户设置
 * POST /v1/user/updateSetting
 * 接口ID：379919835
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-379919835
 */
export function settingUser(data: IUserUpdate) {
  return defHttp.post<{ user: IUser }>({
    url: '/user/v1/user/updateSetting',
    data,
  });
}