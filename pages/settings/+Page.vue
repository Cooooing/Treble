<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from "vue";
import { sha256 as sha256Fallback } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { navigate } from "vike/client/router";
import { usePageContext } from "vike-vue/usePageContext";
import AppLink from "@/components/ui/AppLink.vue";
import Avatar from "@/components/identity/Avatar.vue";
import ProfileImageCropper from "@/components/profile/ProfileImageCropper.vue";
import { message } from "@/components/feedback/message";
import { logout } from "@/services/auth";
import { currentAccount, setCurrentAccount } from "@/services/sessionState";
import { ApiError, bbsClient } from "@/utils/sdk";

const pageContext = usePageContext();
const section = computed(() => pageContext.urlPathname.split("/")[2] || "profile");
const profile = reactive({ nickname: "", url: "", introduction: "", mbti: undefined as string | undefined });
const mbtiInput = ref("");
const mbtiTouched = ref(false);
const urlTouched = ref(false);
const privacy = reactive({
  publicArticles: true,
  publicComments: true,
  publicFollowing: true,
  publicFollowers: true,
  publicLocation: true,
  publicBreezemoons: true,
});
const location = reactive({ country: "", province: "", city: "" });
const backgroundUrl = ref("");
const uploadingPurpose = ref<"avatar" | "background">();
const password = reactive({ old: "", next: "", confirmation: "" });
const email = reactive({ value: "", code: "" });
const phone = reactive({ value: "", code: "" });
const totpEnabled = ref(false);
const totpCode = ref("");
const qrCode = ref("");
const deleting = ref(false);
const nav = [
  { key: "profile", href: "/settings", label: "资料" },
  { key: "account", href: "/settings/account", label: "账户与安全" },
  { key: "privacy", href: "/settings/privacy", label: "隐私" },
  { key: "cancel", href: "/settings/cancel", label: "注销" },
];
const privacyItems = [
  { key: "publicArticles", label: "公开帖子" },
  { key: "publicComments", label: "公开回帖" },
  { key: "publicFollowing", label: "公开关注" },
  { key: "publicFollowers", label: "公开粉丝" },
  { key: "publicBreezemoons", label: "公开明月清风" },
  { key: "publicLocation", label: "公开位置" },
] as const;
const mbtiRe = /^[EI][NS][TF][JP](?:-[AT])?$/;
const mbtiError = computed(() =>
  mbtiTouched.value && mbtiInput.value && !mbtiRe.test(mbtiInput.value) ? "请输入正确的 MBTI 格式。" : "",
);
const urlError = computed(() => {
  if (!urlTouched.value || !profile.url.trim()) return "";
  try {
    const url = new URL(profile.url.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? "" : "请输入以 http:// 或 https:// 开头的完整地址。";
  } catch {
    return "请输入以 http:// 或 https:// 开头的完整地址。";
  }
});
const mask = (value?: string) => (value ? `${value.slice(0, 2)}***${value.slice(-2)}` : "未绑定");
const validPassword = () =>
  password.next.length >= 6 &&
  password.next.length <= 64 &&
  /^[!-~]+$/.test(password.next) &&
  /[A-Za-z]/.test(password.next) &&
  /[0-9]/.test(password.next);
const locationText = computed(
  () => [location.country, location.province, location.city].filter(Boolean).join(" · ") || "暂未识别到位置",
);
const publicLocationLabel = computed(
  () => `公开位置（${locationText.value === "暂未识别到位置" ? "未知" : locationText.value}）`,
);

async function load() {
  const [account, settings, place, totp] = await Promise.all([
    bbsClient.account.getCurrent({ body: {} }),
    bbsClient.privacySetting.getCurrent({ body: {} }),
    bbsClient.location.getCurrent({ body: {} }),
    bbsClient.otp.getCurrentTotp({ body: {} }),
  ]);
  setCurrentAccount(account.account);
  Object.assign(profile, {
    nickname: account.account?.profile?.nickname || "",
    url: account.account?.profile?.url || "",
    introduction: account.account?.profile?.introduction || "",
    mbti: account.account?.profile?.mbti,
  });
  mbtiInput.value = profile.mbti || "";
  Object.assign(privacy, settings.privacySetting || {});
  Object.assign(location, place.location || {});
  totpEnabled.value = Boolean(totp.totp?.enable);
  if (account.account?.profile?.name) {
    try {
      const member = await bbsClient.account.getProfile({ getProfileReq: { name: account.account.profile.name } });
      backgroundUrl.value = member.profile?.backgroundUrl || "";
    } catch {
      /* 背景预览不可用不影响其他设置。 */
    }
  }
  if (section.value === "privacy") await detectLocation();
}
async function detectLocation() {
  try {
    const result = await bbsClient.location.detectCurrent({ body: {} });
    Object.assign(location, result.location || {});
  } catch {
    /* 保留已有位置；定位异常不阻断设置页。 */
  }
}
async function saveProfile() {
  mbtiTouched.value = true;
  urlTouched.value = true;
  if (mbtiError.value || urlError.value) return message.warning("请先修正资料中的输入。");
  profile.mbti = mbtiInput.value || "";
  profile.url = profile.url.trim();
  try {
    const result = await bbsClient.account.updateProfile({ updateProfileAccountReq: profile });
    if (currentAccount.value) setCurrentAccount({ ...currentAccount.value, profile: result.profile });
    message.success("资料已保存。");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "资料保存失败。");
  }
}
async function upload(
  purpose: "avatar" | "background",
  value: { content: Uint8Array; fileName: string; mimeType: string },
) {
  if (uploadingPurpose.value) return;
  uploadingPurpose.value = purpose;
  try {
    const hash = await sha256(value.content);
    const profileImagePurpose =
      purpose === "avatar" ? "PROFILE_IMAGE_PURPOSE_AVATAR" : "PROFILE_IMAGE_PURPOSE_BACKGROUND";
    const prepared = await bbsClient.account.prepareProfileImageUpload({
      prepareProfileImageUploadAccountReq: {
        purpose: profileImagePurpose,
        hash,
        mimeType: value.mimeType,
        size: value.content.byteLength.toString(),
      },
    });
    // assetId is optional: its absence means the browser must perform the
    // direct MinIO POST before the completed asset can be bound.
    if (prepared.assetId == null) {
      await postToObjectStorage(prepared.uploadUrl, prepared.formFields, value);
    }
    const result = await completeProfileImageUpload(profileImagePurpose, hash);
    if (currentAccount.value) setCurrentAccount({ ...currentAccount.value, profile: result.profile });
    if (purpose === "background") backgroundUrl.value = result.imageUrl || "";
    message.success("图片已更新。");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "图片上传失败。");
  } finally {
    uploadingPurpose.value = undefined;
  }
}

async function sha256(content: Uint8Array) {
  // Web Crypto is only exposed in secure contexts. The pure-JS fallback keeps
  // direct uploads usable in an HTTP development or test environment.
  if (!globalThis.crypto?.subtle) return bytesToHex(sha256Fallback(content));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", content.slice().buffer);
  return bytesToHex(new Uint8Array(digest));
}

async function postToObjectStorage(
  uploadUrl: string | undefined,
  fields: Record<string, string> | undefined,
  value: { content: Uint8Array; fileName: string; mimeType: string },
) {
  if (!uploadUrl || !fields) throw new Error("上传凭证无效，请重试。");
  const form = new FormData();
  for (const [name, fieldValue] of Object.entries(fields)) form.append(name, fieldValue);
  form.append("file", new Blob([value.content.slice().buffer], { type: value.mimeType }), value.fileName);
  const response = await fetch(uploadUrl, { method: "POST", body: form });
  if (!response.ok) throw new Error("图片直传失败，请重试。");
}

async function completeProfileImageUpload(purpose: string, hash: string) {
  // MinIO event delivery is asynchronous. Poll only the precise not-found
  // state; validation, authorization and network failures surface at once.
  let lastError: unknown;
  const deadline = Date.now() + 30_000;
  let attempt = 0;
  while (Date.now() < deadline) {
    try {
      return await bbsClient.account.completeProfileImageUpload({
        completeProfileImageUploadAccountReq: { purpose, hash },
      });
    } catch (error) {
      lastError = error;
      // Only the asset-not-found response represents the asynchronous MinIO
      // callback race. Validation, permission and network failures should be
      // reported immediately instead of being disguised as a delayed upload.
      if (!(error instanceof ApiError) || error.status !== 404) throw error;
      const delay = Math.min(250 * 2 ** attempt, 2_000);
      attempt += 1;
      await new Promise((resolve) => window.setTimeout(resolve, delay));
    }
  }
  throw lastError || new Error("图片处理超时，请稍后重试。");
}
async function updatePassword() {
  if (!validPassword()) return message.warning("密码需 6–64 位可见 ASCII 字符，且含字母和数字。");
  if (password.next !== password.confirmation) return message.warning("两次密码不一致。");
  try {
    await bbsClient.account.updatePassword({
      updatePasswordAccountReq: { oldPassword: password.old, newPassword: password.next },
    });
    Object.assign(password, { old: "", next: "", confirmation: "" });
    message.success("密码已更新。");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "密码更新失败。");
  }
}
async function sendCode(kind: "email" | "phone") {
  try {
    if (kind === "email")
      await bbsClient.otp.sendEmailOtp({ sendEmailOtpReq: { email: email.value.trim().toLowerCase() } });
    else await bbsClient.otp.sendPhoneOtp({ sendPhoneOtpReq: { phone: phone.value.trim() } });
    message.success("验证码已发送。");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "验证码发送失败。");
  }
}
async function updateContact(kind: "email" | "phone") {
  try {
    if (kind === "email")
      await bbsClient.account.updateEmail({
        updateEmailAccountReq: { email: email.value.trim().toLowerCase(), code: email.code.trim() },
      });
    else
      await bbsClient.account.updatePhone({
        updatePhoneAccountReq: { phone: phone.value.trim(), code: phone.code.trim() },
      });
    await load();
    message.success("联系方式已更新。");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "更新失败。");
  }
}
async function beginTotp() {
  try {
    const result = await bbsClient.otp.beginEnableTotp({ body: {} });
    qrCode.value = `data:image/png;base64,${result.qrCode}`;
  } catch (error) {
    message.error(error instanceof Error ? error.message : "无法开始绑定。");
  }
}
async function toggleTotp() {
  try {
    if (totpEnabled.value) await bbsClient.otp.disableTotp({ disableTotpReq: { code: totpCode.value.trim() } });
    else await bbsClient.otp.confirmEnableTotp({ confirmEnableTotpReq: { code: totpCode.value.trim() } });
    await load();
    totpCode.value = "";
    qrCode.value = "";
    message.success("两步验证状态已更新。");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "操作失败。");
  }
}
async function savePrivacy() {
  try {
    await bbsClient.privacySetting.updateCurrent({ updateCurrentPrivacySettingReq: privacy });
    message.success("隐私设置已保存。");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "保存失败。");
  }
}
async function cancelAccount() {
  if (!password.old) return message.warning("请输入当前密码。");
  if (totpEnabled.value && !/^[A-Za-z0-9]{6}$/.test(totpCode.value.trim()))
    return message.warning("请输入 6 位 TOTP 验证码。");
  if (!confirm("注销不可恢复，确定继续吗？")) return;
  deleting.value = true;
  try {
    await bbsClient.auth.cancelAccount({
      cancelAccountReq: { password: password.old, code: totpCode.value.trim() || undefined },
    });
    await logout();
    await navigate("/");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "注销失败。");
  } finally {
    deleting.value = false;
  }
}
onMounted(() => void load().catch(() => message.error("设置加载失败，请刷新重试。")));
</script>

<template>
  <div class="main settings">
    <div class="wrapper settings__layout">
      <main class="content">
        <section v-if="section === 'profile'" class="module">
          <header class="module-header fn-clear">
            <AppLink v-if="currentAccount?.profile?.name" :href="`/member/${currentAccount.profile.name}`">{{
              currentAccount.profile.name
            }}</AppLink>
            <h2>资料</h2>
          </header>
          <div class="module-panel form settings__profile">
            <p class="settings__account">账号名：{{ currentAccount?.profile?.name }} <span>账号名不可修改</span></p>
            <label>昵称</label><input v-model="profile.nickname" type="text" /><label for="settings-profile-url"
              >个人主页 URL</label
            ><input
              id="settings-profile-url"
              v-model="profile.url"
              :aria-invalid="Boolean(urlError)"
              aria-describedby="settings-profile-url-error"
              type="url"
              @blur="urlTouched = true"
            />
            <p v-if="urlError" id="settings-profile-url-error" class="settings__field-error" role="status">
              {{ urlError }}
            </p>
            <label>个人简介</label><textarea v-model="profile.introduction" maxlength="512" /><label
              for="settings-profile-mbti"
              >MBTI</label
            ><input
              id="settings-profile-mbti"
              v-model.trim="mbtiInput"
              :aria-invalid="Boolean(mbtiError)"
              aria-describedby="settings-profile-mbti-hint"
              maxlength="6"
              placeholder="例如 ENTP-A"
              type="text"
              @blur="mbtiTouched = true"
              @input="mbtiInput = mbtiInput.toUpperCase()"
            />
            <p id="settings-profile-mbti-hint" class="settings__hint">
              正确示例：<b>ENTP ENFP-A ENTP-T ISTJ ISFJ-A ISTJ-T</b><br />如果不知道你的MBTI或者不知道MBTI是什么，请<a
                href="https://www.16personalities.com/ch"
                rel="noopener noreferrer"
                target="_blank"
                >点击这里</a
              ><span v-if="mbtiError" class="settings__field-error" role="status"> · {{ mbtiError }}</span>
            </p>
            <section aria-labelledby="settings-avatar-title" class="settings__images">
              <h3 id="settings-avatar-title">头像</h3>
              <div class="settings__avatar-editor">
                <div class="settings__avatar-preview">
                  <Avatar
                    :name="currentAccount?.profile?.name"
                    :size="140"
                    :url="currentAccount?.profile?.avatarUrl"
                    square
                  />
                  <p>当前头像</p>
                </div>
                <div class="settings__image-editor">
                  <ProfileImageCropper
                    :uploading="uploadingPurpose === 'avatar'"
                    purpose="avatar"
                    @ready="upload('avatar', $event)"
                  />
                </div>
              </div>
            </section>
            <section aria-labelledby="settings-background-title" class="settings__images">
              <h3 id="settings-background-title">背景图</h3>
              <div
                :class="{ 'settings__background-preview--empty': !backgroundUrl }"
                :style="backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined"
                class="settings__background-preview"
              >
                <span v-if="!backgroundUrl">暂无背景图</span>
              </div>
              <p class="settings__image-caption">当前背景图预览</p>
              <div class="settings__image-editor">
                <ProfileImageCropper
                  :uploading="uploadingPurpose === 'background'"
                  purpose="background"
                  @ready="upload('background', $event)"
                />
              </div>
            </section>
            <button :disabled="Boolean(mbtiError || urlError)" class="green fn-right" @click="saveProfile">保存</button>
          </div>
        </section>
        <template v-else-if="section === 'account'">
          <section class="module">
            <header class="module-header"><h2>密码</h2></header>
            <div class="module-panel form">
              <label>当前密码</label
              ><input v-model="password.old" autocomplete="current-password" type="password" /><label>新密码</label
              ><input v-model="password.next" autocomplete="new-password" type="password" /><label>确认新密码</label
              ><input v-model="password.confirmation" autocomplete="new-password" type="password" /><button
                class="green fn-right"
                @click="updatePassword"
              >
                保存
              </button>
            </div>
          </section>
          <section class="module">
            <header class="module-header"><h2>绑定邮箱</h2></header>
            <div class="module-panel form">
              <p class="settings__current">当前：{{ mask(currentAccount?.contact?.email) }}</p>
              <label>新邮箱</label><input v-model="email.value" type="email" /><label>验证码</label
              ><input v-model="email.code" type="text" /><button type="button" @click="sendCode('email')">
                发送验证码</button
              ><button class="green fn-right" @click="updateContact('email')">保存</button>
            </div>
          </section>
          <section class="module">
            <header class="module-header"><h2>绑定手机</h2></header>
            <div class="module-panel form">
              <p class="settings__current">当前：{{ mask(currentAccount?.contact?.phone) }}</p>
              <label>新手机号</label><input v-model="phone.value" inputmode="numeric" type="text" /><label>验证码</label
              ><input v-model="phone.code" type="text" /><button type="button" @click="sendCode('phone')">
                发送验证码</button
              ><button class="green fn-right" @click="updateContact('phone')">保存</button>
            </div>
          </section>
          <section class="module">
            <header class="module-header"><h2>两步验证</h2></header>
            <div class="module-panel form">
              <p class="settings__current">{{ totpEnabled ? "已启用两步验证。" : "尚未启用两步验证。" }}</p>
              <button v-if="!totpEnabled && !qrCode" type="button" @click="beginTotp">开始绑定</button
              ><img
                v-if="qrCode"
                :src="qrCode"
                alt="TOTP 二维码"
                class="settings__qr"
                height="160"
                width="160"
              /><template v-if="totpEnabled || qrCode"
                ><label>TOTP 验证码</label><input v-model="totpCode" placeholder="6 位验证码" type="text" /><button
                  class="green fn-right"
                  @click="toggleTotp"
                >
                  {{ totpEnabled ? "关闭两步验证" : "确认启用" }}
                </button></template
              >
            </div>
          </section>
        </template>
        <template v-else-if="section === 'privacy'">
          <section class="module">
            <header class="module-header"><h2>隐私</h2></header>
            <div class="module-panel form settings__privacy">
              <p class="settings__description">我们会尊重和保护你的隐私。</p>
              <div class="settings__privacy-grid">
                <label v-for="item in privacyItems" :key="item.key" class="settings__switch"
                  ><input v-model="privacy[item.key]" type="checkbox" />{{
                    item.key === "publicLocation" ? publicLocationLabel : item.label
                  }}</label
                >
              </div>
              <button class="green fn-right" @click="savePrivacy">保存</button>
            </div>
          </section>
        </template>
        <section v-else class="module settings__danger">
          <header class="module-header"><h2>注销账号</h2></header>
          <div class="module-panel form">
            <p>注销后账号无法恢复，所有会话会立即失效。</p>
            <label>当前密码</label><input v-model="password.old" type="password" /><template v-if="totpEnabled"
              ><label>TOTP 验证码</label><input v-model="totpCode" placeholder="6 位验证码" type="text" /></template
            ><button :disabled="deleting" class="fn-right" @click="cancelAccount">
              {{ deleting ? "正在注销..." : "注销账号" }}
            </button>
          </div>
        </section>
      </main>
      <aside class="side">
        <section class="module">
          <div class="module-panel fn-oh">
            <nav aria-label="设置菜单" class="home-menu">
              <AppLink
                v-for="item in nav"
                :key="item.key"
                :class="{ current: section === item.key }"
                :href="item.href"
                >{{ item.label }}</AppLink
              >
            </nav>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.settings {
  padding-top: 20px;
}
.settings .module-header {
  display: flex;
  align-items: center;
  gap: 14px;
}
.settings .module-header h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 19px;
}
.settings .module-header > a {
  font-size: 14px;
  line-height: 19px;
}
.settings .module-panel.form {
  display: flow-root;
  padding: 15px;
}
.settings .form label {
  display: block;
  float: none;
  margin: 12px 0 6px;
}
.settings .form input,
.settings .form textarea,
.settings .form select {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
}
.settings .form textarea {
  min-height: 100px;
  resize: vertical;
}
.settings .form button {
  margin-top: 14px;
}
.settings__hint,
.settings__field-error {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 20px;
}
.settings__hint {
  color: var(--text-fade-color);
}
.settings__hint a {
  text-decoration: underline;
}
.settings__field-error {
  color: #b94646;
}
.settings__hint .settings__field-error {
  display: inline;
  margin-left: 0;
}
.settings__account,
.settings__current,
.settings__description {
  color: var(--text-gray-color);
  line-height: 20px;
}
.settings__account span {
  margin-left: 8px;
  color: var(--text-fade-color);
  font-size: 12px;
}
.settings__images {
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid var(--layer-border-color);
}
.settings__images h3 {
  margin: 0 0 12px;
  color: var(--text-color);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}
.settings__avatar-editor {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  align-items: start;
  gap: 20px;
}
.settings__avatar-preview {
  display: grid;
  justify-items: center;
  gap: 8px;
}
.settings__avatar-preview > p,
.settings__image-caption {
  margin: 0 0 8px;
  color: var(--text-gray-color);
  font-size: 13px;
  line-height: 20px;
}
.settings__avatar-preview > .avatar {
  display: block;
  border: 1px solid var(--layer-border-color);
}
.settings__image-editor {
  min-width: 0;
}
.settings__background-preview {
  display: grid;
  place-items: center;
  aspect-ratio: 3;
  width: 100%;
  margin-bottom: 10px;
  overflow: hidden;
  border: 1px solid var(--layer-border-color);
  border-radius: 3px;
  background-position: center;
  background-size: cover;
  color: var(--text-fade-color);
  font-size: 12px;
  line-height: 18px;
}
.settings__background-preview--empty {
  background-color: var(--background-secondary-color);
}
.settings__privacy-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
  margin-top: 10px;
}
.settings__switch {
  display: flex !important;
  align-items: center;
  min-height: 38px;
  margin: 0 !important;
  padding: 0 !important;
}
.settings__switch input {
  width: 16px !important;
  height: 16px;
  margin: 0 8px 0 0 !important;
  accent-color: #569e3d;
}
.settings__qr {
  display: block;
  margin: 12px 0;
}
.settings__danger .module-header,
.settings__danger .module-panel {
  color: #b94646;
}
.settings__danger button {
  border-color: #b94646;
  color: #b94646;
}
.settings .home-menu {
  margin: 0;
  list-style: none;
  background-color: var(--layer-background-color);
}
.settings .home-menu a {
  position: relative;
  display: block;
  padding: 10px 15px;
  border-bottom: 1px solid var(--layer-border-color);
  color: var(--layer-color);
  line-height: 20px;
  text-decoration: none;
}
.settings .home-menu a:last-child {
  border-bottom: 0;
}
.settings .home-menu a:hover {
  background: var(--background-secondary-color);
  text-decoration: none;
}
.settings .home-menu a.current {
  font-weight: bold;
  color: var(--text-color);
  cursor: default;
  background: var(--layer-background-color);
}
.settings .home-menu a.current::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  content: "";
  background-color: #e59230;
}
@media (max-width: 768px) {
  .settings {
    padding-top: 8px;
  }
  .settings__layout {
    display: flex;
    flex-direction: column;
  }
  .content,
  .side {
    width: 100%;
  }
  .side {
    order: -1;
    margin-top: 0 !important;
    margin-bottom: 10px;
  }
  .settings .home-menu {
    display: flex;
    overflow-x: auto;
  }
  .settings .home-menu a {
    flex: 0 0 auto;
  }
  .settings__avatar-editor,
  .settings__privacy-grid {
    grid-template-columns: 1fr;
  }
  .settings .module-header {
    gap: 10px;
  }
  .settings .module-panel.form {
    padding: 15px;
  }
}
</style>
