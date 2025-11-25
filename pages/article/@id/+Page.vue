<script setup lang="ts">
import { useData } from "vike-vue/useData";
import { Data } from "./+data";
import MdRender from "~/MdRender/src/MdRender.vue";

const { article } = useData<Data>();
onMounted(() => {});
</script>

<template>
  <article class="flex flex-col">
    <main class="mx-auto my-8 md:px-10 md:max-w-[800px] pt-8 space-y-8 bg-base-200 w-full">
      <header class="text-3xl font-bold text-center">{{ article.title }}</header>
      <MdRender 
        ref="contentRef" 
        class="vditor-reset" 
        :md="article.content" 
        :html="article.content_render"
      > 
      </MdRender>
    </main>
  </article>
</template>
