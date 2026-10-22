<template>
  <div :class="{ 'site-layout--chat': isRealtimePage }" class="site-layout">
    <SiteHeader />
    <main id="site-main" class="bg">
      <div id="page-container">
        <div id="page-content" class="page-content"><slot /></div>
      </div>
    </main>
    <SiteFooter v-if="!isRealtimePage" />
    <UserCardHost />
    <ClientOnly>
      <WorkCountdown />
      <ImagePreviewHost />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import ClientOnly from "@/components/ui/ClientOnly.vue";
import ImagePreviewHost from "@/components/content/ImagePreviewHost.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";
import SiteHeader from "@/components/layout/SiteHeader.vue";
import WorkCountdown from "@/components/layout/WorkCountdown.vue";
import UserCardHost from "@/components/identity/UserCardHost.vue";
import { computed } from "vue";
import { usePageContext } from "vike-vue/usePageContext";

const pageContext = usePageContext();
const isRealtimePage = computed(() => pageContext.urlPathname === "/chat" || pageContext.urlPathname === "/messages");
</script>

<style scoped>
.site-layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.site-layout > #site-main {
  display: flex;
  flex: 1 0 auto;
  min-height: 0;
}

#page-container,
#page-content {
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  min-height: 0;
}

.site-layout--chat {
  height: 100dvh;
  overflow: hidden;
}

.site-layout--chat > #site-main,
.site-layout--chat #page-container,
.site-layout--chat #page-content {
  flex: 1 1 0;
  overflow: hidden;
}
</style>
