<script setup lang="ts">
const menuList = [
  { name: '最新', icon: 'tabler:refresh', path: '/recent', mobile: true },
  { name: '热门', icon: 'mingcute:fire-line', path: '/hot', mobile: true },
  { name: '聊天室', icon: 'fluent:chat-12-regular', path: '/cr', mobile: true },
  { name: '领域', icon: 'fluent:building-32-regular', path: '/domains' },
  { name: '清风明月', icon: 'solar:moon-line-duotone', path: '/breezemoons' },
  { name: '问答', icon: 'proicons:chat-question', path: '/qna', mobile: true },
  { name: '优选', icon: 'fluent:ribbon-star-20-regular', path: '/perfect' },
  { name: '总榜', icon: 'ph:ranking-fill', path: '/top' },
  { name: '关注', icon: 'mdi:eye', path: '/watch', mobile: true },
];
</script>
<template>
  <ul class="menu menu-horizontal px-1 space-x-2">
    <li v-for="menu in menuList" :key="menu.name" :class="menu.mobile ? '' : 'md:inline hidden'">
      <a 
        class="group hover:font-bold hover:bg-primary/20 hover:text-primary text-inherit"
        :href="menu.path"
      >
        <Icon class="opacity-0 group-hover:opacity-100 !hidden !md:inline-flex" :icon="menu.icon" />
        {{ menu.name }}
      </a>
    </li>
  </ul>
</template>