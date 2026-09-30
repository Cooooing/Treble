<script lang="ts" setup>
import { ref } from "vue";
import { navigate } from "vike/client/router";
import { message } from "@/components/feedback/message";
import { loginByPassword } from "@/services/auth";
import Icon from "@/components/ui/Icon.vue";
import AppLink from "@/components/ui/AppLink.vue";
import "vditor/dist/index.css";

const account = ref("");
const password = ref("");
const loading = ref(false);

async function submit() {
  if (!account.value.trim()) return void message.warning("请输入用户名或邮箱。");
  if (!password.value) return void message.warning("请输入密码。");
  loading.value = true;
  try {
    await loginByPassword(account.value.trim(), password.value);
    await navigate("/");
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "登录失败，请稍后重试。");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="main">
    <div class="wrapper verify">
      <div class="verify-wrap">
        <form class="form" method="post" novalidate @submit.prevent="submit">
          <h2 class="verify__title">登录摸鱼派</h2>
          <p class="verify__subtitle">继续交流、分享与发现</p>
          <div class="input-wrap">
            <Icon name="userrole" />
            <label class="sr-only" for="login-account">用户名或邮箱</label>
            <input
              id="login-account"
              v-model="account"
              :disabled="loading"
              aria-label="用户名或邮箱"
              autocomplete="username"
              name="username"
              placeholder="用户名或邮箱"
              required
              type="text"
            />
          </div>
          <div class="input-wrap">
            <Icon name="locked" />
            <label class="sr-only" for="login-password">密码</label>
            <input
              id="login-password"
              v-model="password"
              :disabled="loading"
              aria-label="密码"
              autocomplete="current-password"
              name="password"
              placeholder="密码"
              required
              type="password"
            />
          </div>
          <button :disabled="loading" class="verify__action verify__action--primary" type="submit">
            {{ loading ? "正在登录..." : "登录" }}
          </button>
          <AppLink class="verify__action verify__action--secondary" href="/register">注册</AppLink>
        </form>
      </div>
      <aside aria-labelledby="community-welcome-title" class="intro community-welcome vditor-reset">
        <h2 id="community-welcome-title">🐟 鱼油，欢迎来到摸鱼派！</h2>
        <p>如果你也是奋斗在一线、热爱工作的苦逼青年，期待与众多鱼油聚集起来，那就加入友好的摸鱼派社区吧！❤️</p>
        <p>
          在这里有为你准备的聊天室、鱼游、充满生活感的帖子，只要来到摸鱼派，你就是我们的家庭成员～这里以「友善」为第一守则，你可以完全放开自己，和鱼油们畅所欲言，邂逅各行各业的搬砖人，参与摸鱼派有趣的活动
          :)
        </p>
        <p>日常、闲聊、生活、吐槽、提问、技术、读书、游戏、兴趣 ... 都可以在摸鱼派中讨论。</p>
      </aside>
    </div>
  </div>
</template>
