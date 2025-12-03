import { defHttp } from "@/utils/http";
import { IUser } from "./user";
import { IBasicPageParams, IBasicPageResult } from "./common";
import { IArticle } from "./article";

/**
 * 评论发布
 */
export interface ICommentPost {
  /**
   * 文章Id
   */
  article_id: string;
  /**
   * 评论内容
   */
  content: string;
  /**
   * 回复评论Id
   */
  reply_id?: string;
}

/**
 * 评论查询参数
 */
export interface ICommentQuery {
  /**
   * 文章Id
   */
  article_id?: string;
  /**
   * 评论Id，查询该评论的回复。需为文章的评论，回复时间正序。
   */
  comment_id?: string;
  /**
   * 排序 0-最新 1-最热
   */
  order?: number;
  /**
   * 用户Id
   */
  user_id?: string;
  /**
   * 是否包含文章信息
   */
  with_article?: boolean;
}


/**
 * 评论
 */
export interface IComment {
  /**
   * 文章Id
   */
  article_id: string;
  /**
   * 收藏数量
   */
  collect_count: string;
  /**
   * 子评论
   */
  comments: IComment[];
  /**
   * 评论内容
   */
  content: string;
  /**
   * 评论内容渲染
   */
  content_render: string;
  /**
   * 创建时间
   */
  created_at: IDateLite;
  /**
   * 创建人
   */
  created_by: string;
  /**
   * 评论Id
   */
  id: string;
  /**
   * 评论层级
   */
  level: string;
  /**
   * 点赞数量
   */
  like_count: string;
  /**
   * 父级评论Id
   */
  parent_id?: string;
  /**
   * 子评论数量
   */
  reply_count: string;
  /**
   * 回复评论Id
   */
  reply_id?: string;
  /**
   * 回复评论的用户信息
   */
  reply_user?: IUser;
  /**
   * 状态
   */
  status: string;
  /**
   * 感谢数
   */
  thank_count: number;
  /**
   * 更新时间
   */
  updated_at: IDateLite;
  /**
   * 更新人
   */
  updated_by: string;
  /**
   * 评论用户信息
   */
  user: IUser;
  /**
   * 文章信息
   */
  article?: IArticle;
}

/**
 * 新增评论
 * POST /content/v1/comment/add
 * 接口ID：365115464
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-365115464
 */
export function addComment(data: ICommentPost, errorRef: Ref<string>) {
  return defHttp.post<{
    commentId: number;
  }>({
    url: '/content/v1/comment/add',
    data,
    errorRef,
  });
}

/**
 * 点赞评论
 * POST /content/v1/comment/like
 * 接口ID：365115466
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-365115466
 */
export function likeComment(commentId: string) {
  return defHttp.post<void>({
    url: '/content/v1/comment/like',
    data: { commentId },
  });
}

/**
 * 感谢评论
 * POST /content/v1/comment/thank
 * 接口ID：365115467
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-365115467
 */
export function thankComment(commentId: string) {
  return defHttp.post<void>({
    url: '/content/v1/comment/thank',
    data: { commentId },
  });
}

/**
 * 查询评论列表
 * POST /content/v1/comment/page
 * 接口ID：376424993
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-376424993
 */
export function getComments(data: IBasicPageParams<ICommentQuery>) {
  return defHttp.post<IBasicPageResult<IComment>>({
    url: '/content/v1/comment/page',
    data,
  });
}