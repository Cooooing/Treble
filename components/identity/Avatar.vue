<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{
  url?: string;
  name?: string;
  size: number | string;
  square?: boolean;
}>();

const avatarSize = computed(() => {
  if (typeof props.size === "number") {
    return `${props.size}px`;
  }
  return props.size;
});

const avatarUrl = computed(() => {
  const url = props.url?.trim();
  if (url) {
    if (url.startsWith("/v1/")) return `/api/bbs${url}`;
    return url;
  }

  const search = props.name ? `?name=${encodeURIComponent(props.name)}` : "";
  return `/api/bbs/v1/user/account/avatar${search}`;
});
</script>
<template>
  <span
    :aria-label="name || '用户头像'"
    :class="{ 'avatar-square': props.square }"
    :style="{
      width: avatarSize,
      height: avatarSize,
      backgroundImage: `url(${avatarUrl})`,
    }"
    class="avatar"
  />
</template>
