<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from "vue";
import { navigate } from "vike/client/router";
import type { RegisterReq } from "@bass/bbs-sdk-fetch/models/RegisterReq";
import { message } from "@/components/feedback/message";
import { bbsClient } from "@/utils/sdk";
import Icon from "@/components/ui/Icon.vue";
import "vditor/dist/index.css";

const account = reactive({ name: "", email: "", password: "", confirmation: "" });
const verificationCode = ref("");
const fieldErrors = reactive({ name: "", email: "", password: "", confirmation: "", code: "" });
const step = ref<1 | 2>(1);
const loading = ref(false);
const resendAfter = ref(0);
let resendTimer: ReturnType<typeof setInterval> | undefined;
let nameAvailabilityRequest = 0;
let emailAvailabilityRequest = 0;

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function validateName() {
  const name = normalizeName(account.name);
  if (Array.from(name).length < 4 || Array.from(name).length > 32 || !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(name)) {
    return "用户名需为 4–32 位小写字母、数字、- 或 _；分隔符不能位于首尾或连续出现。";
  }
  return "";
}

function validateEmail() {
  const email = normalizeEmail(account.email);
  if (!email || Array.from(email).length > 254 || !/^[^\s@]+@[^\s@]+$/.test(email)) return "请输入正确的邮箱。";
  return "";
}

function validatePassword() {
  const password = account.password;
  if (
    password.length < 6 ||
    password.length > 64 ||
    !/^[!-~]+$/.test(password) ||
    !/[A-Za-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    return "密码需 6–64 位可见 ASCII 字符，且含字母和数字。";
  }
  return "";
}

function validateConfirmation() {
  if (!account.confirmation) return "请再次输入密码。";
  return account.password === account.confirmation ? "" : "两次密码不一致。";
}

function validateCode() {
  return /^[A-Za-z0-9]{6}$/.test(verificationCode.value.trim()) ? "" : "请输入 6 位字母或数字。";
}

function validateField(field: keyof typeof fieldErrors) {
  const validators = {
    name: validateName,
    email: validateEmail,
    password: validatePassword,
    confirmation: validateConfirmation,
    code: validateCode,
  };
  fieldErrors[field] = validators[field]();
  return fieldErrors[field];
}

function validateAccount() {
  const fields: Array<keyof typeof fieldErrors> = ["name", "email", "password", "confirmation"];
  const firstInvalidField = fields.find((field) => validateField(field));
  return firstInvalidField ? fieldErrors[firstInvalidField] : "";
}

async function checkNameAvailability() {
  if (validateField("name")) return;
  const name = normalizeName(account.name);
  const requestID = ++nameAvailabilityRequest;
  try {
    const availability = await bbsClient.auth.checkRegistrationAvailability({ name });
    if (requestID !== nameAvailabilityRequest || name !== normalizeName(account.name)) return;
    fieldErrors.name = availability.nameAvailable === false ? "该用户名已被占用。" : "";
  } catch {
    if (requestID === nameAvailabilityRequest && name === normalizeName(account.name)) {
      fieldErrors.name = "暂时无法检查用户名，请稍后继续注册。";
    }
  }
}

async function checkEmailAvailability() {
  if (validateField("email")) return;
  const email = normalizeEmail(account.email);
  const requestID = ++emailAvailabilityRequest;
  try {
    const availability = await bbsClient.auth.checkRegistrationAvailability({ email });
    if (requestID !== emailAvailabilityRequest || email !== normalizeEmail(account.email)) return;
    fieldErrors.email = availability.emailCanRegister === false ? "当前邮箱暂不可注册。" : "";
  } catch {
    if (requestID === emailAvailabilityRequest && email === normalizeEmail(account.email)) {
      fieldErrors.email = "暂时无法检查邮箱，请稍后继续注册。";
    }
  }
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
    await bbsClient.otp.sendEmailOtp({ sendEmailOtpReq: { email: normalizeEmail(account.email) } });
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
  const validationError = validateAccount() || validateField("code");
  if (validationError) return void message.warning(validationError);
  const name = normalizeName(account.name);
  loading.value = true;
  try {
    await bbsClient.auth.register({
      registerReq: {
        type: "REGISTER_TYPE_EMAIL",
        name,
        nickname: name,
        password: account.password,
        emailCredential: { email: normalizeEmail(account.email), code: verificationCode.value.trim() },
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
            <div class="input-field" :class="{ 'input-field--invalid': fieldErrors.name }">
              <div class="input-wrap">
                <Icon name="userrole" /><label class="sr-only" for="register-name">用户名</label
                ><input
                  id="register-name"
                  v-model="account.name"
                  type="text"
                  name="username"
                  autocomplete="username"
                  aria-label="用户名"
                  placeholder="用户名（4–32 位）"
                  :disabled="loading"
                  :aria-invalid="Boolean(fieldErrors.name)"
                  @blur="checkNameAvailability"
                  required
                />
              </div>
              <p v-if="fieldErrors.name" class="field-error" role="alert">{{ fieldErrors.name }}</p>
            </div>
            <div class="input-field" :class="{ 'input-field--invalid': fieldErrors.email }">
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
                  :aria-invalid="Boolean(fieldErrors.email)"
                  @blur="checkEmailAvailability"
                  required
                />
              </div>
              <p v-if="fieldErrors.email" class="field-error" role="alert">{{ fieldErrors.email }}</p>
            </div>
            <div class="input-field" :class="{ 'input-field--invalid': fieldErrors.password }">
              <div class="input-wrap">
                <Icon name="locked" /><label class="sr-only" for="register-password">密码</label
                ><input
                  id="register-password"
                  v-model="account.password"
                  type="password"
                  name="new-password"
                  autocomplete="new-password"
                  aria-label="密码"
                  placeholder="密码（6–64 位）"
                  minlength="6"
                  maxlength="64"
                  :disabled="loading"
                  :aria-invalid="Boolean(fieldErrors.password)"
                  @blur="validateField('password')"
                  required
                />
              </div>
              <p v-if="fieldErrors.password" class="field-error" role="alert">{{ fieldErrors.password }}</p>
            </div>
            <div class="input-field" :class="{ 'input-field--invalid': fieldErrors.confirmation }">
              <div class="input-wrap">
                <Icon name="locked" /><label class="sr-only" for="register-confirmation">确认密码</label
                ><input
                  id="register-confirmation"
                  v-model="account.confirmation"
                  type="password"
                  autocomplete="new-password"
                  aria-label="确认密码"
                  placeholder="再次输入密码"
                  minlength="6"
                  maxlength="64"
                  :disabled="loading"
                  :aria-invalid="Boolean(fieldErrors.confirmation)"
                  @blur="validateField('confirmation')"
                  required
                />
              </div>
              <p v-if="fieldErrors.confirmation" class="field-error" role="alert">{{ fieldErrors.confirmation }}</p>
            </div>
            <button class="verify__action verify__action--primary" type="submit" :disabled="loading">
              {{ loading ? "正在发送..." : "发送邮箱验证码" }}
            </button>
          </template>
          <template v-else>
            <p class="tip">验证码已发送至 {{ account.email }}，请查收邮件。</p>
            <div class="input-field" :class="{ 'input-field--invalid': fieldErrors.code }">
              <div class="input-wrap">
                <Icon name="email" /><label class="sr-only" for="register-otp">邮箱验证码</label
                ><input
                  id="register-otp"
                  v-model="verificationCode"
                  type="text"
                  inputmode="text"
                  autocomplete="one-time-code"
                  aria-label="邮箱验证码"
                  placeholder="6 位验证码"
                  :disabled="loading"
                  :aria-invalid="Boolean(fieldErrors.code)"
                  @blur="validateField('code')"
                  required
                />
              </div>
              <p v-if="fieldErrors.code" class="field-error" role="alert">{{ fieldErrors.code }}</p>
            </div>
            <button class="verify__action verify__action--primary" type="submit" :disabled="loading">
              {{ loading ? "正在注册..." : "完成注册" }}
            </button>
            <button
              class="verify__action verify__action--secondary"
              type="button"
              :disabled="loading"
              @click="step = 1"
            >
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
        <p>
          在这里有为你准备的聊天室、鱼游、充满生活感的帖子，只要来到摸鱼派，你就是我们的家庭成员～这里以「友善」为第一守则，你可以完全放开自己，和鱼油们畅所欲言，邂逅各行各业的搬砖人，参与摸鱼派有趣的活动
          :)
        </p>
        <p>日常、闲聊、生活、吐槽、提问、技术、读书、游戏、兴趣 ... 都可以在摸鱼派中讨论。</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.verify .input-field {
  margin-top: 10px;
}

.verify .input-field .input-wrap {
  margin: 0;
}

.verify .input-field--invalid .input-wrap {
  border-color: #d9534f;
}

.verify .field-error {
  margin: 3px 0 0;
  color: #d9534f;
  font-size: 12px;
  line-height: 1.35;
}
</style>
