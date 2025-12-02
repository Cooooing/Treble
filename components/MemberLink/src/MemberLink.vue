<script setup lang="ts">

defineProps<{
  username: string;
  avatar?: string;
  size?: number;
  square?: boolean;
}>()
</script>
<template>
  <a :href="`/member/${username}`" v-if="!avatar" class="hover:underline-current">
    <slot :username="username">
      <span>{{ username }}</span>
    </slot>
  </a>
  <a :href="`/member/${username}`" v-else>
    <Avatar :url="avatar" :size="size || 24" :square="square" />
  </a>
</template>

<style lang="less" scoped>
a {
  color: inherit;
  text-decoration: none;
}
</style>