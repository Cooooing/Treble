import { defHttp } from "@/utils/http";
import { IUser } from "./auth";

/**
 * 新增文章参数
 */
export interface IArticlePost {
  /**
   * 悬赏积分
   */
  bountyPoints: number;
  /**
   * 内容
   */
  content: string;
  /**
   * 打赏内容
   */
  rewardContent: string;
  /**
   * 打赏积分
   */
  rewardPoints: number;
  /**
   * 状态 0-正常 1-隐藏 2-锁定 3-草稿 4-删除
   */
  status: number;
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
   * 采纳评论ID（可为空）
   */
  acceptedAnswerId?: string;
  /**
   * 是否匿名
   */
  anonymous?: boolean;
  /**
   * 作者信息
   */
  authorUser?: IUser;
  /**
   * 悬赏积分
   */
  bountyPoints?: number;
  /**
   * 收藏数
   */
  collectCount?: number;
  /**
   * 是否允许评论
   */
  commentable?: boolean;
  /**
   * 正文内容
   */
  content?: string;
  /**
   * 创建时间
   */
  createdAt?: Date;
  /**
   * 创建人
   */
  createdBy?: string;
  /**
   * 是否有附言
   */
  hasPostscript?: boolean;
  /**
   * 唯一ID
   */
  id?: string;
  /**
   * 点赞数
   */
  likeCount?: number;
  /**
   * 抽奖参与人数
   */
  lotteryParticipantCount?: number;
  /**
   * 抽奖获奖人数
   */
  lotteryWinnerCount?: number;
  /**
   * 附言
   */
  postscripts?: IPostscript[];
  /**
   * 最后回复时间
   */
  repliedAt?: Date;
  /**
   * 回复数
   */
  replyCount?: number;
  /**
   * 最后回复用户
   */
  replyUser?: IUser;
  /**
   * 打赏区内容（可为空）
   */
  rewardContent?: string;
  /**
   * 打赏积分
   */
  rewardPoints?: number;
  /**
   * 状态: 0-正常 1-隐藏 2-锁定 3-草稿 4-删除
   */
  status?: number;
  /**
   * 感谢数
   */
  thankCount?: number;
  /**
   * 标题
   */
  title?: string;
  /**
   * 类型: 0-普通 1-问答 2-投票 3-抽奖
   */
  type?: number;
  /**
   * 更新时间
   */
  updatedAt?: Date;
  /**
   * 更新人
   */
  updatedBy?: string;
  /**
   * 总投票数
   */
  voteTotal?: number;
  /**
   * 关注数
   */
  watchCount?: number;
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
  createdAt?: Date;
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
  updatedAt?: Date;
  /**
   * 更新人
   */
  updatedBy?: string;
}

/**
 * 新增文章
 * POST /v1/article/add
 * 接口ID：365115453
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-365115453
 */
export function addArticle(data: IArticlePost) {
  return defHttp.post<{ articleId: number }>({
    url: '/v1/article/add',
    data,
  });
}

/**
 * 发布文章（从草稿发布）
 * POST /v1/article/publish
 * 接口ID：367779217
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-367779217
 */
export function publishArticle(articleId: number) {
  return defHttp.post({
    url: '/v1/article/publish',
    data: { articleId },
  });
}

/**
 * 添加附言
 * POST /v1/article/addPostscript
 * 接口ID：365115454
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-365115454
 */
export function addArticlePostscript(articleId: number, content: string) {
  return defHttp.post({
    url: '/v1/article/addPostscript',
    data: { articleId, content },
  });
}