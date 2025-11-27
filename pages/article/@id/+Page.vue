<script setup lang="ts">
import { useData } from "vike-vue/useData";
import { Data } from "./+data";
import MdRender from "~/MdRender/src/MdRender.vue";
import { useEvent } from "@/hooks/useEvent";
import Toolbar from "./Toolbar.vue";
import Author from "./Author.vue";
import Comments from "./Comments.vue";

const { article, comments } = useData<Data>();
const titleRef = ref<HTMLElement>();
const contentRef = ref<InstanceType<typeof MdRender>>();
const needShowHeader = ref(false);
onMounted(() => {
  useEvent({
    name: "scroll",
    listener: () => {
      // 检查标题是否超出可视区域
      if (!titleRef.value) return;
      const rect = titleRef.value.getBoundingClientRect();
      needShowHeader.value = rect.bottom < 0;
    },
    debounce: true,
    wait: 100,
  });
});
const prefixCls = useDesign('article');

</script>

<template>
  <article class="flex flex-col" :class="prefixCls">
    <header v-show="needShowHeader" :class="`${prefixCls}-header fixed left-0 right-0 top-0 bg-base-100 shadow-lg z-100`">
      <section class="flex items-center justify-between px-2 h-12 z-10 wrapper">
        <section>
          <Logo icon-only />
        </section>
        <section class="truncate">{{ article.title }}</section>
        <section>
          <Toolbar :article="article" />
        </section>
      </section>
    </header>
    <main :class="`${prefixCls}-content mx-auto mt-8 px-2 md:px-10 md:max-w-[800px] space-y-8 bg-base-200 w-full py-8`">
      <header ref="titleRef" :class="`${prefixCls}-title text-3xl font-bold text-center`">{{ article.title }}</header>
      <MdRender 
        ref="contentRef" 
        class="vditor-reset" 
        :md="article.content" 
        :html="article.content_render"
      > 
      </MdRender>
      <footer :class="`${prefixCls}-footer`">
        <Author :article="article" />
      </footer>
    </main>
    <footer class="mx-auto md:max-w-[800px] px-2 md:px-10 bg-base-200 pb-8 w-full">
      <Comments :comments="comments" :article="article" />
    </footer>
  </article>
</template>
