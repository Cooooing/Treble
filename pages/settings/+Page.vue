<script setup lang="ts">
import Base from './base.vue';

const menuActive = ref('base');
</script>
<template>
  <article class="flex gap-4 wrapper m-4">
    <main class="flex-1">
      <Base v-if="menuActive == 'base'" />
    </main>
    <aside class="card w-91 flex-none bg-base-100 border border-base-300">
      <ul class="menu rounded-box w-full">
        <li>
          <span :class="{ 'menu-active': menuActive == 'base' }" @click="menuActive = 'base'">基本信息</span>
        </li>
        <li>
          <span :class="{ 'menu-active': menuActive == 'personal' }" @click="menuActive = 'personal'">个性化</span>
        </li>
        <li>
          <span :class="{ 'menu-active': menuActive == 'avatar' }" @click="menuActive = 'avatar'">头像</span>
        </li>
        <li>
          <span :class="{ 'menu-active': menuActive == 'privacy' }" @click="menuActive = 'privacy'">隐私</span>
        </li>
      </ul>
    </aside>
  </article>
</template>