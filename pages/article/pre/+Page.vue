<script setup lang="tsx">

  const articleTypes = reactive([
    {
      type: 1,
      name: '帖子',
      description: () => <span><span class="text-success">分享</span>对别人有帮助的经验与见解</span>,
      icon: 'svg-icon:article',
    },
    {
      type: 2,
      name: '问答',
      description: () => <span>总有一个人知道这个问题的<span class="text-warning">答案</span></span>,
      icon: 'svg-icon:ask',
    },
    {
      type: 3,
      name: '投票',
      description: () => <span>让我们来看看大家的<span class="text-info">选择</span></span>,
      icon: 'streamline-flex:politics-vote-2-solid',
    },
    {
      type: 4,
      name: '抽奖',
      description: () => <span>
        发布一个<span class="text-primary">有趣</span>的抽奖活动，看看大家的手气
      </span>,
      icon: 'material-symbols:local-activity-rounded',
    }
  ]);
</script>

<template>
  <article class="md:px-20 md:py-26 pt-8 space-y-8 bg-base-200">
    <article class="flex flex-col md:flex-row md:justify-around">
      <a :href="`/article/post?type=${a.type}`" v-for="a in articleTypes" class="text-inherit md:p-0 py-4 inline-block md:border-none border-b border-base-100">
        <h2 class="flex flex-row md:flex-col md:text-3xl justify-center items-center gap-4 mb-4">
          <Icon :icon="a.icon" size="1.8em" class="md:mb-10" />
          <span>{{ a.name }}</span>
        </h2>
        <p class="text-center">
          <component :is="a.description" />
        </p>
      </a>
    </article>
  </article>
</template>
