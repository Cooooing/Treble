<script lang="ts" setup>
import { computed } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import errorImage0 from "@/assets/site/images/404/0.gif";
import errorImage1 from "@/assets/site/images/404/1.gif";
import errorImage2 from "@/assets/site/images/404/2.gif";
import errorImage3 from "@/assets/site/images/404/3.gif";
import errorImage4 from "@/assets/site/images/404/4.gif";
import errorImage5 from "@/assets/site/images/404/5.gif";
import AppLink from "@/components/ui/AppLink.vue";

const props = defineProps<{
  title: string;
  message: string;
}>();

const pageContext = usePageContext();
const errorImages = [errorImage0, errorImage1, errorImage2, errorImage3, errorImage4, errorImage5];
const errorImage = computed(() => {
  const imageIndex =
    Array.from(pageContext.urlPathname).reduce((total, character) => total + character.charCodeAt(0), 0) %
    errorImages.length;
  return errorImages[imageIndex];
});
</script>

<template>
  <section class="error-state" aria-labelledby="error-state-title">
    <div class="error-state__art" aria-hidden="true">
      <img :src="errorImage" width="260" height="260" alt="" />
    </div>
    <h1 id="error-state-title" class="error-state__title">{{ props.title }}</h1>
    <p class="error-state__message">{{ props.message }}</p>
    <AppLink class="error-state__home" href="/">回到首页</AppLink>
  </section>
</template>

<style scoped>
.error-state {
  width: min(calc(100% - 32px), 420px);
  margin: 32px auto;
  padding: 28px 24px 32px;
  border: 1px solid var(--layer-border-color);
  border-radius: 8px;
  background: var(--layer-background-color);
  box-sizing: border-box;
  text-align: center;
}

.error-state__art {
  display: grid;
  place-items: center;
  width: min(260px, 100%);
  aspect-ratio: 1;
  margin: 0 auto 20px;
  border: 1px solid var(--layer-border-color);
  border-radius: 6px;
  background: var(--background-secondary-color);
  overflow: hidden;
}

.error-state__art img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.error-state__title {
  margin: 0;
  color: var(--text-color);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
}

.error-state__message {
  margin: 8px 0 20px;
  color: var(--text-fade-color);
  font-size: 14px;
  line-height: 1.6;
}

.error-state__home {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 104px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid var(--layer-border-color);
  border-radius: 4px;
  background: var(--background-secondary-color);
  color: var(--link-color);
  box-sizing: border-box;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}

.error-state__home:hover,
.error-state__home:focus-visible {
  border-color: var(--link-color);
  text-decoration: none;
}

.error-state__home:focus-visible {
  outline: 2px solid var(--link-color);
  outline-offset: 2px;
}

@media (max-width: 480px) {
  .error-state {
    margin: 20px auto;
    padding: 24px 18px 28px;
  }

  .error-state__art {
    width: min(220px, 100%);
  }
}
</style>
