<!-- https://vike.dev/Layout -->

<template>
  <div v-html="svg" style="display:none"></div>
  <component :is="ThemeComponents[theme || 'default']">
    <slot></slot>
  </component>
</template>

<script lang="ts" setup>
  import { components as ThemeComponents } from '@/theme/';
  import svg from 'virtual:svg-icons-ssr-html'
  import { useData } from "vike-vue/useData";
  import { Data } from './+data';

  const { theme } = useData<Data>();

</script>


<style scoped>

</style>
