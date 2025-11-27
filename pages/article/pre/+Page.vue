<script setup lang="ts">
  import { articleTypes } from '../index';
  const prefixCls = useDesign('article-pre');
</script>

<template>
  <article :class="prefixCls" class="md:px-20 md:py-26 pt-8 space-y-8 bg-base-200">
    <article class="flex flex-col md:flex-row md:justify-around">
      <a 
        v-for="a in articleTypes"
        :key="a.type"
        :href="`/article/post?type=${a.type}`" 
        :class="`${prefixCls}-item`"
        class="text-inherit md:p-0 py-4 inline-block md:border-none border-b border-base-100"
      >
        <h2 class="flex flex-row md:flex-col md:text-3xl justify-center items-center gap-4 mb-4">
          <Icon :icon="a.icon" size="1.8em" class="md:mb-10" />
          <span>{{ a.name }}</span>
        </h2>
        <p class="text-center">
          <component :is="a.description" />
        </p>
      </a>
    </article>
  </article>
</template>
