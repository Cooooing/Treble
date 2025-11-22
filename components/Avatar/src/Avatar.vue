<script setup lang="ts">
import { isNumber } from '@/utils';

  const props = defineProps<{
    url: string;
    size: number | string;
  }>();

  const avatarSize = computed(() => {
    if (isNumber(props.size)) {
      return `${props.size}px`;
    }
    return props.size;
  });
</script>
<template>
  <div class="avatar" :class="{ 'avatar-placeholder': !url.startsWith('http') }">
    <div v-if="url.startsWith('http') || url.startsWith('/api/')" class="rounded-full" :style="{ width: avatarSize }">
      <img :src="url" />
    </div>
    <div v-else class="bg-neutral text-neutral-content rounded-full" :style="{ width: avatarSize, height: avatarSize }">
      <span>{{ url }}</span>
    </div>
  </div>
</template>