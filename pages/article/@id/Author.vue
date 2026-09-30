<script lang="ts" setup>
import type { ArticleDetail } from "@bass/bbs-sdk-fetch/models/ArticleDetail";
import Avatar from "@/components/identity/Avatar.vue";
import MemberLink from "@/components/identity/MemberLink.vue";
import Icon from "@/components/ui/Icon.vue";
import { fromNow } from "@/utils/date";

defineProps<{ article: ArticleDetail; replyCount: number }>();
</script>
<template>
  <div class="article__meta">
    <div>
      <MemberLink :username="article.authorUser?.name || ''"
        ><Avatar
          :name="article.authorUser?.name"
          :size="48"
          :url="article.authorUser?.avatarUrl"
          class="avatar fn-left"
      /></MemberLink>
    </div>
    <div class="fn-flex-1">
      <div id="articleMeta" class="fn-clear">
        <MemberLink :username="article.authorUser?.name || ''" class="article__stats article__stats--a"
          ><span class="article__cnt">{{ article.authorUser?.nickname || article.authorUser?.name || "匿名用户" }}</span
          ><time>{{ article.createdAt ? fromNow(article.createdAt.getTime()) : "刚刚" }}</time></MemberLink
        >
        <span class="article__stats"
          ><span class="article__cnt">{{ article.likeCount || 0 }}</span
          >点赞</span
        >
        <span class="article__stats"
          ><span class="article__cnt">{{ article.collectCount || 0 }}</span
          >收藏</span
        >
        <span class="article__stats"
          ><span class="article__cnt">{{ replyCount }}</span
          >回复</span
        >
      </div>
      <div class="fn-clear article__view">
        <span class="fn-flex-inline"><Icon name="iconTop" /> {{ article.viewCount || 0 }}</span>
      </div>
    </div>
  </div>
</template>
