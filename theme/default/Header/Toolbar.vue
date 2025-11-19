<script setup lang="ts">
  import ThemeSwitch from './ThemeSwitch.vue';
</script>
<template>
  <section class="px-2 space-x-2 inline-flex items-center">
    <ThemeSwitch />
    <a href="/login" class="text-inherit">
      登录
    </a>
    <a href="/register" class="text-inherit">
      注册
    </a>
  </section>
</template>