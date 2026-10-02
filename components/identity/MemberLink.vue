<script lang="ts" setup>
import Avatar from "@/components/identity/Avatar.vue";
import AppLink from "@/components/ui/AppLink.vue";
import { closeUserCard, openUserCard } from "@/services/userCard";

const props = defineProps<{
  username: string;
  avatar?: string;
  size?: number;
  square?: boolean;
}>();

function CanOpenCard() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches && props.username !== "";
}

function OpenCard(event: PointerEvent | FocusEvent) {
  if (!CanOpenCard() || !(event.currentTarget instanceof HTMLElement)) return;
  openUserCard(props.username, event.currentTarget, event.type === "focusin");
}

function CloseCard() {
  closeUserCard();
}
</script>
<template>
  <AppLink
    v-if="props.username"
    :aria-label="username"
    :href="`/member/${props.username}`"
    @focusin="OpenCard"
    @focusout="CloseCard"
    @pointerenter="OpenCard"
    @pointerleave="CloseCard"
  >
    <slot v-if="$slots.default" :username="username" />
    <Avatar
      v-else-if="props.avatar !== undefined || props.size"
      :name="username"
      :size="size || 24"
      :square="square"
      :url="avatar"
    />
    <span v-else>{{ username }}</span>
  </AppLink>
  <span v-else><slot /></span>
</template>
