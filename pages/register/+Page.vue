<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from "vue";
import { navigate } from "vike/client/router";
import type { RegisterReq } from "@bass/bbs-sdk-fetch/models/RegisterReq";
import { message } from "@/components/Message";
import { bbsClient } from "@/utils/sdk";
import BrandMark from "@/components/BrandMark.vue";
import Icon from "@/components/community/Icon.vue";

const account = reactive({ name: "", nickname: "", email: "", password: "", confirmation: "" });
const verificationCode = ref("");
const step = ref<1 | 2>(1);
const loading = ref(false);
const resendAfter = ref(0);
let resendTimer: ReturnType<typeof setInterval> | undefined;

function validateAccount() {
  if (!account.name.trim()) return "请输入用户名。";
  if (!account.nickname.trim()) return "请输入昵称。";
  if (!/^\S+@\S+\.\S+$/.test(account.email)) return "请输入正确的邮箱格式。";
  if (account.password.length < 6 || account.password.length > 30) return "密码长度应为 6 到 30 个字符。";
  if (account.password !== account.confirmation) return "两次输入的密码不一致。";
  return "";
}

function startResendCountdown(seconds = 60) {
  resendAfter.value = seconds;
  if (resendTimer) clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    resendAfter.value -= 1;
    if (resendAfter.value <= 0 && resendTimer) {
      clearInterval(resendTimer);
      resendTimer = undefined;
    }
  }, 1000);
}

async function sendOtp() {
  const validationError = validateAccount();
  if (validationError) return void message.warning(validationError);
  loading.value = true;
  try {
    await bbsClient.otp.sendEmailOtp({ sendEmailOtpReq: { email: account.email.trim() } });
    step.value = 2;
    verificationCode.value = "";
    startResendCountdown();
    message.success("验证码已发送，请查收邮箱。");
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "验证码发送失败，请稍后重试。");
  } finally {
    loading.value = false;
  }
}

async function register() {
  if (!verificationCode.value.trim()) return void message.warning("请输入邮箱验证码。");
  loading.value = true;
  try {
    await bbsClient.auth.register({
      registerReq: {
        type: "REGISTER_TYPE_EMAIL",
        name: account.name.trim(),
        nickname: account.nickname.trim(),
        password: account.password,
        emailCredential: { email: account.email.trim(), code: verificationCode.value.trim() },
      } satisfies RegisterReq,
    });
    message.success("注册成功，请使用新账号登录。");
    await navigate("/login");
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "注册失败，请检查验证码后重试。");
  } finally {
    loading.value = false;
  }
}

onBeforeUnmount(() => {
  if (resendTimer) clearInterval(resendTimer);
});
</script>

<template>
  <div class="main">
    <div class="wrapper verify">
      <div class="verify-wrap">
        <form class="form" novalidate @submit.prevent="step === 1 ? sendOtp() : register()">
          <h2 class="verify__title">加入摸鱼派</h2>
          <p class="verify__subtitle">创建账号，和鱼油们一起摸鱼</p>
          <template v-if="step === 1">
            <div class="input-wrap">
              <Icon name="userrole" /><label class="sr-only" for="register-name">用户名</label
              ><input
                id="register-name"
                v-model="account.name"
                type="text"
                name="username"
                autocomplete="username"
                aria-label="用户名"
                placeholder="用户名"
                :disabled="loading"
                required
              />
            </div>
            <div class="input-wrap">
              <Icon name="userrole" /><label class="sr-only" for="register-nickname">昵称</label
              ><input
                id="register-nickname"
                v-model="account.nickname"
                type="text"
                name="nickname"
                autocomplete="nickname"
                aria-label="昵称"
                placeholder="昵称"
                :disabled="loading"
                required
              />
            </div>
            <div class="input-wrap">
              <Icon name="email" /><label class="sr-only" for="register-email">邮箱</label
              ><input
                id="register-email"
                v-model="account.email"
                type="email"
                name="email"
                autocomplete="email"
                aria-label="邮箱"
                placeholder="邮箱"
                :disabled="loading"
                required
              />
            </div>
            <div class="input-wrap">
              <Icon name="locked" /><label class="sr-only" for="register-password">密码</label
              ><input
                id="register-password"
                v-model="account.password"
                type="password"
                name="new-password"
                autocomplete="new-password"
                aria-label="密码"
                placeholder="密码（6 至 30 个字符）"
                minlength="6"
                maxlength="30"
                :disabled="loading"
                required
              />
            </div>
            <div class="input-wrap">
              <Icon name="locked" /><label class="sr-only" for="register-confirmation">确认密码</label
              ><input
                id="register-confirmation"
                v-model="account.confirmation"
                type="password"
                autocomplete="new-password"
                aria-label="确认密码"
                placeholder="确认密码"
                minlength="6"
                maxlength="30"
                :disabled="loading"
                required
              />
            </div>
            <button class="verify__action verify__action--primary" type="submit" :disabled="loading">
              {{ loading ? "正在发送..." : "发送邮箱验证码" }}
            </button>
          </template>
          <template v-else>
            <p class="tip">验证码已发送至 {{ account.email }}，请查收邮件。</p>
            <div class="input-wrap">
              <Icon name="email" /><label class="sr-only" for="register-otp">邮箱验证码</label
              ><input
                id="register-otp"
                v-model="verificationCode"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                aria-label="邮箱验证码"
                placeholder="邮箱验证码"
                :disabled="loading"
                required
              />
            </div>
            <button class="verify__action verify__action--primary" type="submit" :disabled="loading">
              {{ loading ? "正在注册..." : "完成注册" }}
            </button>
            <button class="verify__action verify__action--secondary" type="button" :disabled="loading" @click="step = 1">
              返回修改资料
            </button>
            <button
              class="verify__action verify__action--secondary"
              type="button"
              :disabled="loading || resendAfter > 0"
              @click="sendOtp"
            >
              {{ resendAfter > 0 ? `${resendAfter} 秒后可重发` : "重新发送验证码" }}
            </button>
          </template>
        </form>
      </div>
      <aside class="intro community-welcome vditor-reset" aria-labelledby="community-welcome-title">
        <h2 id="community-welcome-title">🐟 鱼油，欢迎来到摸鱼派！</h2>
        <p>如果你也是奋斗在一线、热爱工作的苦逼青年，期待与众多鱼油聚集起来，那就加入友好的摸鱼派社区吧！❤️</p>
        <p>在这里有为你准备的聊天室、鱼游、充满生活感的帖子，只要来到摸鱼派，你就是我们的家庭成员～这里以「友善」为第一守则，你可以完全放开自己，和鱼油们畅所欲言，邂逅各行各业的搬砖人，参与摸鱼派有趣的活动 :)</p>
        <p>日常、闲聊、生活、吐槽、提问、技术、读书、游戏、兴趣 ... 都可以在摸鱼派中讨论。</p>
      </aside>
    </div>
  </div>
</template>
