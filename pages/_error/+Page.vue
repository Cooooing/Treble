<script lang="ts" setup>
import { usePageContext } from "vike-vue/usePageContext";
import errorImage0 from "@/assets/site/images/404/0.gif";
import errorImage1 from "@/assets/site/images/404/1.gif";
import errorImage2 from "@/assets/site/images/404/2.gif";
import errorImage3 from "@/assets/site/images/404/3.gif";
import errorImage4 from "@/assets/site/images/404/4.gif";
import errorImage5 from "@/assets/site/images/404/5.gif";

const pageContext = usePageContext();
let { is404, abortReason } = pageContext;
if (!abortReason) {
  abortReason = is404 ? "你访问的页面不存在或暂未开放。" : "页面暂时无法打开，请稍后重试。";
}
const heading = is404 ? "页面不存在" : "服务器内部错误";
const errorImages = [errorImage0, errorImage1, errorImage2, errorImage3, errorImage4, errorImage5];
const imageIndex =
  Array.from(pageContext.urlPathname).reduce((total, character) => total + character.charCodeAt(0), 0) %
  errorImages.length;
const errorImage = errorImages[imageIndex];
</script>

<template>
  <div class="main">
    <div class="wrapper verify error-page">
      <section class="verify-wrap">
        <div class="form">
          <img class="error-page__image" :src="errorImage" width="260" height="260" alt="摸鱼派页面未找到" />
          <h1>{{ heading }}</h1>
          <p class="ft-gray">{{ abortReason }}</p>
          <a class="green btn" href="/">返回首页</a>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.error-page__image {
  display: block;
  width: min(260px, 70vw);
  height: auto;
  margin: 0 auto 18px;
  object-fit: contain;
}
</style>
