<script setup lang="ts">
import { useData } from "vike-vue/useData";
import { Data } from "./+data";
import MdRender from "~/MdRender/src/MdRender.vue";
import { useEvent } from "@/hooks/useEvent";
import Toolbar from "./Toolbar.vue";

const { article } = useData<Data>();
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

</script>

<template>
  <article class="flex flex-col">
    <header v-show="needShowHeader" class="fixed left-0 right-0 top-0 bg-base-100 shadow-lg z-100">
      <section class="flex items-center justify-between px-2 h-12 z-10 max-w-[1300px] m-auto">
        <section>
          <Logo icon-only />
        </section>
        <section class="truncate">{{ article.title }}</section>
        <section>
          <Toolbar :article="article" />
        </section>
      </section>
    </header>
    <main class="mx-auto my-8 px-2 md:px-10 md:max-w-[800px] pt-8 space-y-8 bg-base-200 w-full">
      <header ref="titleRef" class="text-3xl font-bold text-center">{{ article.title }}</header>
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
