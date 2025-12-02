<script setup lang="ts">
import { LayoutContextKey } from '@/pages';

const { pageContext } = inject(LayoutContextKey)!;
const { user } = pageContext;
</script>
<template>
  <article class="card bg-base-100 border border-base-300 card-sm">
    <h2 class="card-title border-b border-dashed border-base-300 px-4 py-2">
      <a :href="`/member/${user.name}`">
       {{ user.nickname }}
      </a>
      的基本信息
    </h2>
    <VForm is="div" class="card-body">
      
    </VForm>
  </article>
</template>