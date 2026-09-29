<script setup lang="ts">
import { articleTypes } from "@/pages/article";
import Icon from "@/components/ui/Icon.vue";
import AppLink from "@/components/ui/AppLink.vue";
</script>

<template>
  <div class="main pre-post-wrap">
    <div>
      <section class="wrapper pre-post" aria-label="选择发布类型">
        <article v-for="item in articleTypes" :key="item.type" class="pre-post__item">
          <AppLink class="pre-post__link" :href="`/post?type=${item.type}`">
            <Icon :name="item.icon" />
            <span>{{ item.name }}</span>
          </AppLink>
          <p class="ft-gray">{{ item.description }}</p>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pre-post-wrap {
  display: grid;
  flex: 1 1 auto;
  place-items: center;
  min-height: 0;
  padding: 24px 0;
  box-sizing: border-box;
}

.pre-post-wrap > div {
  width: 100%;
}

.pre-post {
  display: flex;
  align-items: flex-start;
  width: min(1200px, calc(100% - 32px));
  margin: 0 auto;
}

.pre-post__drafts {
  width: min(1200px, calc(100% - 32px));
  margin: 24px auto -72px;
  text-align: right;
}

.pre-post__drafts a {
  color: var(--toc-hover-color);
}

.pre-post__item {
  flex: 1 1 0;
  min-width: 0;
  margin: 100px 0;
  text-align: center;
}

.pre-post__link {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-color);
  font-size: 30px;
  font-weight: 400;
  text-decoration: none;
}

.pre-post__link :deep(svg) {
  width: 50px;
  height: 50px;
  margin-bottom: 50px;
  color: currentcolor;
}

.pre-post__link:hover,
.pre-post__link:focus-visible {
  color: #4285f4;
  outline: none;
}

.pre-post__link:focus-visible {
  outline: 2px solid #4285f4;
  outline-offset: 6px;
}

.pre-post__item p {
  margin: 20px 30px 0;
  font-size: 15px;
  line-height: 1.5;
  text-align: left;
}

@media (max-width: 768px) {
  .pre-post-wrap {
    display: block;
    flex: 0 0 auto;
    padding-block: 0;
  }
  .pre-post {
    display: block;
    width: 100%;
  }
  .pre-post__item {
    display: block;
    box-sizing: border-box;
    width: 100%;
    margin: 15px auto;
    padding: 20px 50px;
    background-color: #f7f7f7;
    font-size: 16px;
  }
  .pre-post__link {
    display: block;
    margin-bottom: 10px;
    font-size: 20px;
  }
  .pre-post__link :deep(svg) {
    width: 32px;
    height: 32px;
    margin: 0 8px 0 0;
    vertical-align: -8px;
  }
  .pre-post__item p {
    margin: 20px 0;
  }
  :global(html[data-theme="dark"]) .pre-post__item {
    background-color: #24292e;
  }
}

:global(html[data-theme="dark"]) .pre-post__link:hover,
:global(html[data-theme="dark"]) .pre-post__link:focus-visible {
  color: #79b8ff;
}
</style>
