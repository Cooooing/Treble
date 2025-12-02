import { defHttp } from "@/utils/http";
import { IUser } from "./user";
import { IBasicPageParams, IBasicPageResult } from "./common";

/**
 * common.api.content.v1.TagSave
 */
export interface ITag {
    /**
     * 标签描述
     */
    description: string;
    /**
     * 领域ID
     */
    domainId: string;
    /**
     * 主键
     */
    id: string;
    /**
     * 标签名称
     */
    name: string;
    /**
     * 状态：0-正常，1-禁用
     */
    status: number;
}

/**
 * 新增文章参数
 */
export interface IArticlePost {
  id?: string;
  /**
   * 是否匿名
   */
  anonymous: boolean;
  /**
   * 悬赏积分
   */
  bounty_points: number;
  /**
   * 是否允许评论
   */
  commentable: boolean;
  /**
   * 内容
   */
  content: string;
  /**
   * 是否在列表展示
   */
  listable: boolean;
  /**
   * 打赏内容
   */
  reward_content: string;
  /**
   * 打赏积分
   */
  reward_points: number;
  /**
   * 创作声明
   */
  statement: string;
  /**
   * 状态 0-正常 1-隐藏 2-锁定 3-草稿 4-删除
   */
  status?: number;
  /**
   * 标签id
   */
  tags: Partial<ITag>[];
  /**
   * 标题
   */
  title: string;
  /**
   * 类型 0-普通 1-问答 2-投票 3-抽奖
   */
  type: number;
}

/**
 * 文章
 */
export interface IArticle {
  /**
   * 采纳评论Id（可为空）
   */
  accepted_answer_id?: string;
  /**
   * 是否匿名
   */
  anonymous: boolean;
  /**
   * 作者信息
   */
  author_user: IUser;
  /**
   * 悬赏积分
   */
  bounty_points: number;
  /**
   * 收藏数
   */
  collect_count: number;
  /**
   * 是否允许评论
   */
  commentable: boolean;
  /**
   * 正文内容
   */
  content: string;
  /**
   * 正文内容渲染
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
   * 是否有附言
   */
  has_postscript: boolean;
  /**
   * 唯一Id
   */
  id: string;
  /**
   * 最后回复时间
   */
  last_reply_at: IDateLite;
  /**
   * 最后回复用户
   */
  last_reply_user?: IUser;
  /**
   * 点赞数
   */
  like_count: number;
  /**
   * 是否在列表展示
   */
  listable: boolean;
  /**
   * 抽奖参与人数
   */
  lottery_participant_count: number;
  /**
   * 抽奖获奖人数
   */
  lottery_winner_count: number;
  /**
   * 附言
   */
  postscripts: IPostscript[];
  /**
   * 回复数
   */
  reply_count: number;
  /**
   * 打赏区内容（可为空）
   */
  reward_content: string;
  /**
   * 打赏积分
   */
  reward_points: number;
  /**
   * 创作声明
   */
  statement: string;
  /**
   * 状态: 0-正常 1-隐藏 2-锁定 3-草稿 4-删除
   */
  status: number;
  /**
   * 标签
   */
  tags: ITag[];
  /**
   * 感谢数
   */
  thank_count: number;
  /**
   * 标题
   */
  title: string;
  /**
   * 类型: 0-普通 1-问答 2-投票 3-抽奖
   */
  type: number;
  /**
   * 更新时间
   */
  updated_at?: IDateLite;
  /**
   * 更新人
   */
  updated_by?: string;
  /**
   * 总投票数
   */
  vote_total: number;
  /**
   * 关注数
   */
  watch_count: number;
}

/**
 * 文章附言
 */
export interface IPostscript {
  /**
   * 所属文章ID
   */
  articleId?: string;
  /**
   * 附言内容
   */
  content?: string;
  /**
   * 创建时间
   */
  createdAt?: IDateLite;
  /**
   * 创建人
   */
  createdBy?: string;
  /**
   * 主键ID
   */
  id?: string;
  /**
   * 更新时间
   */
  updatedAt?: IDateLite;
  /**
   * 更新人
   */
  updatedBy?: string;
}

export interface IArticleQuery {
    /**
     * 作者Id
     */
    authorId?: string;
    /**
     * 领域
     */
    domainId?: string;
    /**
     * 查询关键词
     */
    keyword?: string;
    /**
     * 排序 0-最新 1-最热
     */
    order?: number;
    /**
     * 状态 0-正常 3-草稿
     */
    status?: number;
    /**
     * 标签
     */
    tagId?: string;
    /**
     * 类型 0-普通 1-问答 2-投票 3-抽奖
     */
    type?: number;
}

/**
 * 新增文章
 * POST /content/v1/article/add
 * 接口ID：365115453
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-365115453
 */
export function addArticle(article: IArticlePost, errorRef?: Ref<string>) {
  return defHttp.post<{ articleId: number }>({
    url: '/content/v1/article/add',
    data: { article },
    errorRef
  });
}

/**
 * 更新草稿
 * POST /content/v1/article/updateDraft
 * 接口ID：380930501
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-380930501
 */
export function updateArticleDraft(article: IArticlePost, errorRef?: Ref<string>) {
  return defHttp.post({
    url: '/content/v1/article/updateDraft',
    data: { article },
    errorRef
  });
}

/**
 * 发布文章（从草稿发布）
 * POST /content/v1/article/publish
 * 接口ID：367779217
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-367779217
 */
export function publishArticle(articleId: number) {
  return defHttp.post({
    url: '/content/v1/article/publish',
    data: { articleId },
  });
}

/**
 * 添加附言
 * POST /content/v1/article/addPostscript
 * 接口ID：365115454
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-365115454
 */
export function addArticlePostscript(articleId: number, content: string) {
  return defHttp.post({
    url: '/content/v1/article/addPostscript',
    data: { articleId, content },
  });
}

/**
 * 查询单篇文章
 * POST /content/v1/article/getOne
 * 接口ID：370061632
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-370061632
 */
export function getArticle(articleId: number | string) {
  return defHttp.post<{article: IArticle}>({
    url: '/content/v1/article/getOne',
    data: { articleId },
  });
}

/**
 * 发布文章（从草稿发布）
 * POST /v1/article/publish
 * 接口ID：367779217
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-367779217
 */
export function publishArticleDraft(article_id: string, errorRef?: Ref<string>) {
  return defHttp.post({
    url: '/content/v1/article/publish',
    data: { article_id },
    errorRef
  });
}

/**
 * 查询文章
 * POST /v1/article/page
 * 接口ID：376424992
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-376424992
 */
export function getArticles(data: IBasicPageParams<IArticleQuery>) {
  return defHttp.post<IBasicPageResult<IArticle>>({
    url: '/content/v1/article/page',
    data,
  });
}