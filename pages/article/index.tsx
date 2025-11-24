export const articleTypes = reactive([
  {
    type: 0,
    name: '帖子',
    description: () => <span><span class="text-success">分享</span>对别人有帮助的经验与见解</span>,
    icon: 'svg-icon:article',
  },
  {
    type: 1,
    name: '问答',
    description: () => <span>总有一个人知道这个问题的<span class="text-warning">答案</span></span>,
    icon: 'svg-icon:ask',
  },
  {
    type: 2,
    name: '投票',
    description: () => <span>让我们来看看大家的<span class="text-info">选择</span></span>,
    icon: 'streamline-flex:politics-vote-2-solid',
  },
  {
    type: 3,
    name: '抽奖',
    description: () => <span>
      发布一个<span class="text-primary">有趣</span>的抽奖活动，看看大家的手气
    </span>,
    icon: 'material-symbols:local-activity-rounded',
  }
]);
