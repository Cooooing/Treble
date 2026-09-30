<script lang="ts" setup>
import Avatar from "@/components/identity/Avatar.vue";

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
      :name="username"
      :size="size || 24"
      :square="square"
      :url="avatar"
    />
    <span v-else>{{ username }}</span>
  </span>
</template>
