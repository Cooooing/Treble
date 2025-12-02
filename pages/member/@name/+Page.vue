<script setup lang="ts">
import { useData } from "vike-vue/useData";
import { Data } from "./+data";
const { user, articles } = useData<Data>();
const pageContext = usePageContext();

const original = ref(pageContext.urlOriginal);
const isCommentsPage = computed(() => original.value.endsWith("/comments"));
const tabActive = ref(isCommentsPage.value ? "comments" : "posts");
onMounted(() => {
  original.value = location.href;
  tabActive.value = isCommentsPage.value ? "comments" : "posts";
});
</script>
<template>
  <article class="flex gap-4 wrapper m-4">
    <main class="flex-1">
      <div role="tablist" class="tabs tabs-lift w-full flex border-b-2 border-base-100">
        <a 
          role="tab" 
          :href="`/member/${user.name}`" 
          class="tab flex-1" 
          :class="{ 'tab-active': tabActive == 'posts' }" 
          @click.prevent.stop="tabActive = 'posts'">
          帖子
        </a>
        <a
          role="tab"
          :href="`/member/${user.name}/comments`"
          class="tab flex-1"
          :class="{ 'tab-active': tabActive == 'comments' }"
          @click.prevent.stop="tabActive = 'comments'"
        >
          回帖
        </a>
      </div>
      <section>
        <ArticleCard class="rounded-t-none!" mode="list-more" v-if="tabActive == 'posts'" :articles="articles" />
      </section>
    </main>
    <aside class="card w-91 flex-none bg-base-100 px-4 py-8">
      <section class="text-center">
        <Avatar
          :url="user.avatar_url"
          :alt="user.name"
          size="210px"
          square
          class="mx-auto overflow-hidden rounded-lg"
        />
      </section>
      <section class="mt-4 text-center">
        <p class="text-2xl font-bold">{{ user.nickname }}</p>
        <p class="text-xl text-base-content/50">{{ user.name }}</p>
      </section>
    </aside>
  </article>
</template>
