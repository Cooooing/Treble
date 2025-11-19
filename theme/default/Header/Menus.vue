<script setup lang="ts">
const menuList = [
  { name: '最新', icon: 'tabler:refresh', path: '/recent' },
  { name: '热门', icon: 'mingcute:fire-line', path: '/hot' },
  { name: '聊天室', icon: 'fluent:chat-12-regular', path: '/cr' },
  { name: '领域', icon: 'fluent:building-32-regular', path: '/domains' },
  { name: '清风明月', icon: 'solar:moon-line-duotone', path: '/breezemoons' },
  { name: '问答', icon: 'proicons:chat-question', path: '/qna' },
  { name: '优选', icon: 'fluent:ribbon-star-20-regular', path: '/perfect' },
  { name: '总榜', icon: 'ph:ranking-fill', path: '/top' },
  { name: '关注', icon: 'mdi:eye', path: '/watch' },
];
</script>
<template>
  <ul class="menu menu-horizontal px-1 space-x-2">
    <li v-for="menu in menuList" :key="menu.name">
      <a class="group hover:font-bold hover:bg-primary/20 hover:text-primary text-inherit" :href="menu.path">
        <Icon class="opacity-0 group-hover:opacity-100" :icon="menu.icon" />
        {{ menu.name }}
      </a>
    </li>
  </ul>
</template>