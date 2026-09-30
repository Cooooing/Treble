<script lang="ts" setup>
import AppLink from "@/components/ui/AppLink.vue";
</script>

<template>
  <footer class="footer">
    <div class="wrapper">
      <div class="slogan">摸鱼派 - 鱼油专属摸鱼社区</div>
      <div class="fn-flex-1">
        <div class="footer-nav fn-clear ft-smaller">
          <div>探索</div>
          <AppLink href="/domains">领域</AppLink>
          <AppLink href="/tags">标签</AppLink>
        </div>
        <div class="footer-nav fn-clear ft-smaller">
          <span>Copyright © 摸鱼派</span>
        </div>
      </div>
    </div>
  </footer>
</template>
