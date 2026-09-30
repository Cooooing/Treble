<script lang="ts" setup>
import { navigate } from "vike/client/router";

const props = defineProps<{ href: string }>();

function handleClick(event: MouseEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (event.currentTarget as HTMLAnchorElement).target ||
    (event.currentTarget as HTMLAnchorElement).hasAttribute("download")
  ) {
    return;
  }

  const destination = new URL(props.href, window.location.href);
  const isSameDocumentHash =
    destination.pathname === window.location.pathname &&
    destination.search === window.location.search &&
    Boolean(destination.hash);
  if (destination.origin !== window.location.origin || isSameDocumentHash) {
    return;
  }

  event.preventDefault();
  void navigate(`${destination.pathname}${destination.search}${destination.hash}`);
}
</script>

<template>
  <a :href="href" @click="handleClick"><slot /></a>
</template>
