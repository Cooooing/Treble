<script setup lang="ts">
import Avatar from "@/components/Avatar";

const props = defineProps<{
  username: string;
  avatar?: string;
  size?: number;
  square?: boolean;
}>();
</script>
<template>
  <span :aria-label="username">
    <slot v-if="$slots.default" :username="username" />
    <Avatar
      v-else-if="props.avatar !== undefined || props.size"
      :url="avatar"
      :name="username"
      :size="size || 24"
      :square="square"
    />
    <span v-else>{{ username }}</span>
  </span>
</template>
