<script setup lang="ts">
import { toRefs } from "vue";
import { useData } from "vike-vue/useData";
import AppLink from "@/components/ui/AppLink.vue";
import MemberProfileLayout from "@/components/member/MemberProfileLayout.vue";
import { fromNow } from "@/utils/date";
const { profile, rows } = toRefs(useData<any>());
</script>
<template>
  <MemberProfileLayout v-if="profile" :profile="profile" active="comments">
    <p v-if="profile.visibility?.comments === false" class="member-empty">该用户未公开回帖列表。</p>
    <p v-else-if="!rows.length" class="member-empty">暂无回帖。</p>
    <div v-else class="member-list">
      <AppLink v-for="row in rows" :key="row.id" :href="`/article/${row.articleId}#comments`" class="comment-row">
        <h2>{{ row.article?.title || "文章" }}</h2>
        <p>{{ row.content }}</p>
        <time>{{ row.createdAt ? fromNow(row.createdAt) : "" }}</time>
      </AppLink>
    </div>
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
.comment-row {
  display: block;
  padding: 15px;
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid var(--layer-border-color);
}
.comment-row:hover {
  background: var(--background-secondary-color);
}
.comment-row h2 {
  margin: 0 0 6px;
  color: var(--text-color);
  font-size: 16px;
  line-height: 24px;
}
.comment-row p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-gray-color);
  font-size: 13px;
  line-height: 21px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.comment-row time {
  display: block;
  margin-top: 7px;
  color: var(--text-fade-color);
  font-size: 12px;
  line-height: 18px;
}
</style>
