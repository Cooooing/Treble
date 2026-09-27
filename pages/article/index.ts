import type { ReqArticleTypeEnum } from "@bass/bbs-sdk-fetch/models/ReqArticle";

export const articleTypes: Array<{
  type: ReqArticleTypeEnum;
  name: string;
  description: string;
  editorHint: string;
  icon: string;
}> = [
  {
    type: "ARTICLE_TYPE_NORMAL",
    name: "帖子",
    description: "分享 对别人有帮助的经验与见解",
    editorHint: "分享你的思考、经历或发现\n\n支持 Markdown 排版。",
    icon: "article",
  },
  {
    type: "ARTICLE_TYPE_QA",
    name: "问答",
    description: "提出问题，等待社区的答案",
    editorHint: "请清楚描述遇到的问题、已尝试的方法与期待的答案\n\n补充必要的环境和复现步骤，能帮助大家更快回答。",
    icon: "iconAsk",
  },
  {
    type: "ARTICLE_TYPE_LOTTERY",
    name: "抽奖",
    description: "发起一个有趣的抽奖活动",
    editorHint: "说明抽奖奖品、参与条件、开奖时间与领奖方式\n\n请在发布前确认规则清晰、公平且可执行。",
    icon: "star",
  },
  {
    type: "ARTICLE_TYPE_POLL",
    name: "投票",
    description: "邀请大家表达自己的选择",
    editorHint: "说明投票主题、每个选项的含义与截止时间\n\n让参与者了解投票结果将如何使用。",
    icon: "feed",
  },
  {
    type: "ARTICLE_TYPE_COLUMN",
    name: "专栏",
    description: "持续整理一个值得阅读的主题",
    editorHint: "写下这一期想整理的主题、背景与阅读收获\n\n结构清晰的标题和小节能让内容更易阅读。",
    icon: "book",
  },
];
