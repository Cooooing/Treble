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
</style>
