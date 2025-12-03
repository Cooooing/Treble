<script setup lang="ts">
  import { IComment } from "@/apis/comment";
import { formatDateTime } from "@/utils";
  defineProps<{
    comments: IComment[];
  }>();
</script>

<template>
  <section class="card bg-base-100">
    <section 
      v-for="comment in comments" 
      :key="comment.id" 
      class="border-b border-base-content/20 pt-4 group"
      :id="`comment_${comment.id}`"
    >
      <section class="flex">
        <section>
          <Avatar :url="comment.user.avatar_url" :size="40" />
        </section>
        <section class="flex-1 ml-3">
          <section class="flex justify-between items-center pr-3">
            <div>
              <a :href="`/article/${comment.article_id}`" class="font-bold text-current hover:underline">
                {{ comment.article?.title || '已删除的文章' }}
              </a>
            </div>
            <span class="text-sm text-base-content/60 ml-2">
              {{ formatDateTime(comment.created_at.seconds * 1000) }}
            </span>
          </section>
          <section class="vditor-reset" v-html="comment.content_render"></section>
        </section>
      </section>
    </section>
  </section>
</template>