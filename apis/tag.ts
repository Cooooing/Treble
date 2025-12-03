import { defHttp } from "@/utils/http";
import { IBasicPageParams, IBasicPageResult } from "./common";

export interface ITagQuery {
  /**
   * 文章数量范围
   */
  article_count?: { end: number; start: number };
  /**
   * 标签描述
   */
  description?: string;
  /**
   * 领域Id
   */
  domain_id?: string;
  /**
   * 标签Id列表
   */
  ids?: string[];
  /**
   * 标签名称
   */
  name?: string;
  /**
   * 标签名称列表
   */
  names?: string[];
  /**
   * 标签状态
   */
  status?: number;
  /**
   * 用户Id
   */
  user_id?: string;
}

export interface ITag {
  /**
   * 文章数
   */
  article_count?: number;
  /**
   * 创建时间
   */
  created_at?: Date;
  /**
   * 创建人
   */
  created_by?: string;
  /**
   * 描述
   */
  description?: string;
  /**
   * 所属领域Id
   */
  domain_id?: string;
  /**
   * 主键
   */
  id?: string;
  /**
   * 标签名称
   */
  name?: string;
  /**
   * 标签状态：0-正常，1-禁用
   */
  status?: number;
  /**
   * 更新时间
   */
  updated_at?: Date;
  /**
   * 更新人
   */
  updated_by?: string;
}

/**
 * 分页获取标签
 * POST /v1/tag/page
 * 接口ID：381810217
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-381810217
 */
export function getTags(data: IBasicPageParams<ITagQuery>) {
  return defHttp.post<IBasicPageResult<ITag>>({
    url: "/content/v1/tag/page",
    data,
  });
}