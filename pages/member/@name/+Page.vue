<script lang="ts" setup>
import { toRefs } from "vue";
import { useData } from "vike-vue/useData";
import ErrorState from "@/components/feedback/ErrorState.vue";
import MemberArticleList from "@/components/member/MemberArticleList.vue";
import MemberProfileLayout from "@/components/member/MemberProfileLayout.vue";
import type { Profile } from "@bass/bbs-sdk-fetch/models/Profile";
import type { ArticleListItem } from "@bass/bbs-sdk-fetch/models/ArticleListItem";

type Data = {
  profile?: Profile;
  articles: ArticleListItem[];
  error?: string;
  pageStatus?: 404 | 500;
  private?: boolean;
};
const { profile, articles, error, private: isPrivate } = toRefs(useData<Data>());
</script>

<template>
  <ErrorState v-if="!profile" :message="error || '该用户不存在或不可用。'" title="用户未找到" />
  <MemberProfileLayout v-else :profile="profile" active="articles">
    <p v-if="isPrivate" class="member-empty">该用户未公开帖子列表。</p>
    <MemberArticleList v-else-if="articles.length" :articles="articles" />
    <p v-else class="member-empty">暂无帖子。</p>
  </MemberProfileLayout>
</template>

<style scoped>
.member-empty {
  margin: 0;
  padding: 48px 20px;
  color: var(--text-fade-color);
  font-size: 14px;
  line-height: 24px;
  text-align: center;
}
</style>
