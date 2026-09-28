<template>
  <div class="site-layout">
    <SiteHeader />
    <main class="bg" id="site-main">
      <div id="page-container">
        <div id="page-content" class="page-content"><slot /></div>
      </div>
    </main>
    <SiteFooter />
  </div>
</template>

<script lang="ts" setup>
import SiteFooter from "@/components/site/SiteFooter.vue";
import SiteHeader from "@/components/site/SiteHeader.vue";
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
</style>
