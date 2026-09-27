<script setup lang="ts">
import type { ArticleDetail } from "@bass/bbs-sdk-fetch/models/ArticleDetail";
import Avatar from "@/components/Avatar";
import MemberLink from "@/components/MemberLink";
import Icon from "@/components/community/Icon.vue";
import { fromNow } from "@/utils/date";
defineProps<{ article: ArticleDetail; replyCount: number }>();
</script>
<template>
  <div class="article__meta">
    <div>
      <MemberLink :username="article.authorUser?.name || ''"
        ><Avatar
          class="avatar fn-left"
          :url="article.authorUser?.avatarUrl"
          :name="article.authorUser?.name"
          :size="48"
      /></MemberLink>
    </div>
    <div class="fn-flex-1">
      <div id="articleMeta" class="fn-clear">
        <MemberLink class="article__stats article__stats--a" :username="article.authorUser?.name || ''"
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
