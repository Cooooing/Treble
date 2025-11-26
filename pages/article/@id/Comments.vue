<script setup lang="ts">
  import { IBasicPageResult } from '@/apis/common';
  import { IComment } from '@/apis/comment';
  import { LayoutContextKey } from '@/pages/index';

  const props = defineProps<{
    comments: IBasicPageResult<IComment>;
  }>();

  const { pageContext } = inject(LayoutContextKey)!;
  const { user } = pageContext;
</script>
<template>
  <article>
    <header class="border-b border-base-content/50">
      <h1 class="text-base mb-1 px-2">{{ comments.page.total || 0 }} 回帖</h1>
    </header>
    <main>
      <header class="flex items-center w-full p-0 my-2">
        <Avatar :url="user.avatar_url" :size="40" square />
        <div class="text-primary border border-base-content/50 ml-3 flex h-10 flex-1 items-center px-3 rounded">
          <span>请输入回帖内容...</span>
        </div>
      </header>
      <main v-if="comments.rows?.length">

      </main>
    </main>
  </article>
</template>