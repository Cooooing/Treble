<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import AppLink from "@/components/ui/AppLink.vue";
import Avatar from "@/components/identity/Avatar.vue";
import Icon from "@/components/ui/Icon.vue";
import { message } from "@/components/feedback/message";
import { currentAccount } from "@/services/sessionState";
import { fromNow } from "@/utils/date";
import { bbsClient } from "@/utils/sdk";
import type { Profile } from "@bass/bbs-sdk-fetch/models/Profile";

const props = defineProps<{
  profile: Profile;
  active: "articles" | "moonbreezes" | "comments" | "following" | "followers";
}>();
const pageContext = usePageContext();
const actionMenu = ref<HTMLElement>();
const blockCancelButton = ref<HTMLButtonElement>();
const actionMenuOpen = ref(false);
const actionPending = ref(false);
const blockConfirmOpen = ref(false);
const following = ref(Boolean(props.profile.viewerRelation?.following));
const followedBy = ref(Boolean(props.profile.viewerRelation?.followedBy));
const blocking = ref(Boolean(props.profile.viewerRelation?.blocking));
const blockedBy = ref(Boolean(props.profile.viewerRelation?.blockedBy));
const account = computed(() => pageContext.user || currentAccount.value);
const targetID = computed(() => props.profile.account?.id);
const viewerID = computed(() => account.value?.profile?.id);
const canManageRelation = computed(() =>
  Boolean(targetID.value && viewerID.value && targetID.value !== viewerID.value),
);
const canFollow = computed(() => canManageRelation.value && !blocking.value && !blockedBy.value);
const followLabel = computed(() => {
  if (!following.value) return "关注";
  return followedBy.value ? "互相关注" : "已关注";
});
const tabs = [
  { key: "articles", label: "帖子", suffix: "" },
  { key: "comments", label: "回帖", suffix: "/comments" },
  { key: "moonbreezes", label: "清风明月", suffix: "/moonbreezes" },
  { key: "following", label: "关注", suffix: "/following" },
  { key: "followers", label: "粉丝", suffix: "/followers" },
] as const;
const href = (suffix: string) => `/member/${props.profile.account?.name}${suffix}`;
const location = () =>
  [props.profile.location?.country, props.profile.location?.province, props.profile.location?.city]
    .filter(Boolean)
    .join(" · ");

function CloseActionMenuWhenClickingOutside(event: PointerEvent) {
  if (!actionMenu.value?.contains(event.target as Node)) actionMenuOpen.value = false;
}

function CloseActionMenuOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") actionMenuOpen.value = false;
}

async function RefreshRelationState() {
  const name = props.profile.account?.name;
  if (!name || !canManageRelation.value) return;
  try {
    const response = await bbsClient.account.getProfile({ getProfileReq: { name } });
    if (props.profile.account?.name !== name) return;
    const relation = response.profile?.viewerRelation;
    following.value = Boolean(relation?.following);
    followedBy.value = Boolean(relation?.followedBy);
    blocking.value = Boolean(relation?.blocking);
    blockedBy.value = Boolean(relation?.blockedBy);
  } catch {
    // The server-rendered relationship snapshot remains usable if this
    // best-effort client refresh cannot complete.
  }
}

async function ToggleFollow() {
  if (!targetID.value || !canFollow.value || actionPending.value) return;
  actionPending.value = true;
  try {
    if (following.value) {
      await bbsClient.relation.unfollow({ unfollowRelationReq: { targetId: targetID.value } });
    } else {
      await bbsClient.relation.follow({ followRelationReq: { targetId: targetID.value } });
    }
    following.value = !following.value;
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "关注操作失败，请稍后重试。");
  } finally {
    actionPending.value = false;
  }
}

async function ToggleBlock() {
  if (!targetID.value || !canManageRelation.value || actionPending.value) return;
  blockConfirmOpen.value = true;
  actionMenuOpen.value = false;
  await nextTick();
  blockCancelButton.value?.focus();
}

function CloseBlockConfirmation() {
  if (!actionPending.value) blockConfirmOpen.value = false;
}

async function ConfirmBlock() {
  if (!targetID.value || !canManageRelation.value || actionPending.value) return;
  const nextBlocking = !blocking.value;
  actionPending.value = true;
  try {
    if (nextBlocking) {
      await bbsClient.relation.block({ blockRelationReq: { targetId: targetID.value } });
      following.value = false;
    } else {
      await bbsClient.relation.unblock({ unblockRelationReq: { targetId: targetID.value } });
    }
    blocking.value = nextBlocking;
    actionMenuOpen.value = false;
    blockConfirmOpen.value = false;
    message.success(nextBlocking ? "已加入黑名单。" : "已移出黑名单。");
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "黑名单操作失败，请稍后重试。");
  } finally {
    actionPending.value = false;
  }
}

function NotifyPrivateMessageUnavailable() {
  message.info("私信功能暂未开放。");
}

function NotifyReportUnavailable() {
  actionMenuOpen.value = false;
  message.info("举报功能暂未开放。");
}

onMounted(() => {
  window.addEventListener("pointerdown", CloseActionMenuWhenClickingOutside);
  window.addEventListener("keydown", CloseActionMenuOnEscape);
  void RefreshRelationState();
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", CloseActionMenuWhenClickingOutside);
  window.removeEventListener("keydown", CloseActionMenuOnEscape);
});

watch(
  () => props.profile,
  (profile) => {
    following.value = Boolean(profile.viewerRelation?.following);
    followedBy.value = Boolean(profile.viewerRelation?.followedBy);
    blocking.value = Boolean(profile.viewerRelation?.blocking);
    blockedBy.value = Boolean(profile.viewerRelation?.blockedBy);
    actionMenuOpen.value = false;
    blockConfirmOpen.value = false;
    void RefreshRelationState();
  },
);

watch(viewerID, () => void RefreshRelationState());
</script>

<template>
  <div class="main member-page">
    <div class="wrapper member-page__wrapper">
      <main class="content member-page__content">
        <section class="module member-page__module">
          <nav aria-label="个人主页栏目" class="member-tabs">
            <AppLink
              v-for="tab in tabs"
              :key="tab.key"
              :aria-current="active === tab.key ? 'page' : undefined"
              :class="{ current: active === tab.key }"
              :href="href(tab.suffix)"
              >{{ tab.label }}</AppLink
            >
          </nav>
          <div class="module-panel member-page__panel"><slot /></div>
        </section>
      </main>
      <aside class="side member-profile">
        <section class="module member-profile__card">
          <div
            :style="profile.backgroundUrl ? { backgroundImage: `url(${profile.backgroundUrl})` } : undefined"
            aria-hidden="true"
            class="member-profile__cover"
          />
          <div class="member-profile__identity">
            <Avatar :name="profile.account?.name" :size="120" :url="profile.account?.avatarUrl" />
            <h1 v-if="profile.account?.nickname || profile.account?.name">
              {{ profile.account?.nickname || profile.account?.name }}
            </h1>
            <p v-if="profile.account?.name" class="member-profile__name">{{ profile.account.name }}</p>
            <p
              v-if="profile.online !== undefined"
              :class="profile.online ? 'member-profile__status--online' : 'member-profile__status--offline'"
              class="member-profile__status"
            >
              <span aria-hidden="true" class="member-profile__status-dot" />
              {{ profile.online ? "在线" : "离线" }}
            </p>
            <span v-if="profile.account?.mbti" class="member-profile__mbti">{{ profile.account.mbti }}</span>
          </div>
          <div v-if="canManageRelation" class="member-profile__actions">
            <button
              v-if="canFollow"
              :disabled="actionPending || !canFollow"
              class="member-profile__action member-profile__action--follow"
              type="button"
              @click="ToggleFollow"
            >
              {{ followLabel }}
            </button>
            <button class="member-profile__action" type="button" @click="NotifyPrivateMessageUnavailable">私信</button>
            <div ref="actionMenu" class="member-profile__action-menu">
              <button
                :aria-expanded="actionMenuOpen"
                aria-controls="member-profile-more-menu"
                aria-label="更多用户操作"
                class="member-profile__action member-profile__action--more"
                type="button"
                @click="actionMenuOpen = !actionMenuOpen"
              >
                <Icon name="more" />
              </button>
              <div v-if="actionMenuOpen" id="member-profile-more-menu" class="member-profile__menu" role="menu">
                <button :disabled="actionPending" role="menuitem" type="button" @click="ToggleBlock">
                  {{ blocking ? "取消拉黑" : "加入黑名单" }}
                </button>
                <button role="menuitem" type="button" @click="NotifyReportUnavailable">举报</button>
              </div>
            </div>
          </div>
          <div class="member-profile__details">
            <p v-if="profile.account?.introduction" class="member-profile__intro">{{ profile.account.introduction }}</p>
            <p v-if="profile.account?.url" class="member-profile__line">
              <a :href="profile.account.url" rel="noopener noreferrer" target="_blank">{{ profile.account.url }}</a>
            </p>
            <p v-if="location()" class="member-profile__line"><span>位置</span>{{ location() }}</p>
            <p v-if="profile.account?.createdAt" class="member-profile__line">
              <span>加入时间</span>{{ fromNow(profile.account.createdAt) }}
            </p>
            <p v-if="profile.lastSuccessLoginAt" class="member-profile__line">
              <span>最后登录</span>{{ fromNow(profile.lastSuccessLoginAt) }}
            </p>
          </div>
          <div
            v-if="profile.account?.followCount !== undefined || profile.account?.followerCount !== undefined"
            class="member-profile__stats"
          >
            <AppLink v-if="profile.account?.followCount !== undefined" :href="href('/following')"
              ><strong>{{ profile.account?.followCount || 0 }}</strong
              ><span>关注</span></AppLink
            ><AppLink v-if="profile.account?.followerCount !== undefined" :href="href('/followers')"
              ><strong>{{ profile.account?.followerCount || 0 }}</strong
              ><span>粉丝</span></AppLink
            >
          </div>
        </section>
      </aside>
    </div>
  </div>
  <Transition name="member-block-confirm">
    <section
      v-if="blockConfirmOpen"
      aria-labelledby="member-block-confirm-title"
      aria-modal="true"
      class="member-block-confirm"
      role="dialog"
      @keydown.esc="CloseBlockConfirmation"
    >
      <button
        aria-label="关闭黑名单确认"
        class="member-block-confirm__backdrop"
        type="button"
        @click="CloseBlockConfirmation"
      />
      <div class="member-block-confirm__panel">
        <h2 id="member-block-confirm-title">{{ blocking ? "取消拉黑" : "加入黑名单" }}</h2>
        <p>
          {{
            blocking
              ? "移出后可再次查看对方的公开内容，但不会恢复之前的关注关系。"
              : "加入后，双方将无法查看彼此内容或进行互动；此前的双向关注也会解除。"
          }}
        </p>
        <footer>
          <button ref="blockCancelButton" :disabled="actionPending" type="button" @click="CloseBlockConfirmation">
            取消
          </button>
          <button :disabled="actionPending" class="member-block-confirm__submit" type="button" @click="ConfirmBlock">
            {{ actionPending ? "正在处理..." : blocking ? "确认取消拉黑" : "确认加入" }}
          </button>
        </footer>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
.member-page {
  padding-top: 20px;
}
.member-page__wrapper {
  align-items: flex-start;
}
.member-page__content {
  min-width: 0;
}
.member-page__module {
  overflow: hidden;
}
.member-page__panel {
  min-height: 180px;
}
.member-tabs {
  display: flex;
  overflow-x: auto;
  border-bottom: 1px solid var(--layer-border-color);
  background: var(--layer-background-color);
}
.member-tabs a {
  position: relative;
  flex: 1 0 auto;
  padding: 9px 14px 7px;
  border-bottom: 2px solid transparent;
  color: var(--text-gray-color);
  font-size: 14px;
  line-height: 18px;
  text-align: center;
  text-decoration: none;
}
.member-tabs a:hover {
  background: var(--background-secondary-color);
  color: var(--text-color);
}
.member-tabs a.current {
  border-bottom-color: #e59230;
  color: var(--text-color);
  font-weight: 600;
}
.member-profile__card {
  overflow: hidden;
  background: var(--layer-background-color);
}
.member-profile__cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #d6e6f5 0%, #edf2f7 50%, #f3dfc7 100%);
  background-position: center;
  background-size: cover;
}
.member-profile__identity {
  margin-top: -40px;
  padding: 0 15px 18px;
  text-align: center;
}
.member-profile__identity :deep(.avatar) {
  border: 3px solid var(--layer-background-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
}
.member-profile__identity h1 {
  margin: 14px 0 2px;
  color: var(--text-color);
  font-size: 26px;
  font-weight: 600;
  line-height: 30px;
  overflow-wrap: anywhere;
}
.member-profile__name {
  margin: 0;
  color: var(--text-gray-color);
  font-size: 14px;
  line-height: 22px;
}
.member-profile__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 20px;
  margin: 6px 0 0;
  padding: 0 7px;
  border-radius: 3px;
  color: var(--color-text-inverse);
  font-size: 12px;
  line-height: 20px;
}
.member-profile__status--online {
  background: #2e9b56;
}
.member-profile__status--offline {
  background: var(--text-fade-color);
}
.member-profile__status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}
.member-profile__mbti {
  display: inline-block;
  height: 20px;
  margin-top: 7px;
  padding: 0 6px;
  border-radius: 3px;
  background: #b2b1ff;
  color: #fff;
  font-size: 12px;
  line-height: 20px;
}
.member-profile__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 15px 16px;
}
.member-profile__action {
  display: inline-flex;
  min-width: 0;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 19px;
}
.member-profile__action--follow,
.member-profile__action:not(.member-profile__action--more) {
  flex: 1 1 0;
}
.member-profile__action:disabled {
  cursor: not-allowed;
  opacity: 0.56;
}
.member-profile__action--follow {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-text-inverse);
}
.member-profile__action--follow:hover:not(:disabled),
.member-profile__action--follow:focus-visible:not(:disabled) {
  border-color: var(--color-accent-hover);
  background: var(--color-accent-hover);
  color: var(--color-text-inverse);
  outline: 2px solid color-mix(in srgb, var(--color-accent) 35%, transparent);
  outline-offset: 1px;
}
.member-profile__action--more {
  flex: 0 0 36px;
  width: 36px;
  padding: 0 8px;
}
.member-profile__action--more :deep(.icon) {
  width: 16px;
  height: 16px;
}
.member-profile__action-menu {
  position: relative;
}
.member-profile__menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  right: 0;
  width: 136px;
  padding: 4px;
  border: 1px solid var(--layer-border-color);
  border-radius: 3px;
  background: var(--layer-background-color);
  box-shadow: var(--shadow-overlay);
}
.member-profile__menu button {
  display: block;
  width: 100%;
  min-height: 32px;
  padding: 0 9px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--text-gray-color);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  text-align: left;
}
.member-profile__menu button:hover:not(:disabled),
.member-profile__menu button:focus-visible:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-accent-hover);
  outline: 0;
}
.member-profile__menu button:disabled {
  cursor: wait;
  opacity: 0.56;
}
.member-block-confirm {
  position: fixed;
  z-index: 160;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  box-sizing: border-box;
}
.member-block-confirm__backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: rgb(0 0 0 / 38%);
  cursor: default;
}
.member-block-confirm__panel {
  position: relative;
  z-index: 1;
  width: min(100%, 360px);
  padding: 20px;
  border: 1px solid var(--color-border-strong);
  border-radius: 4px;
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-overlay);
  box-sizing: border-box;
}
.member-block-confirm__panel h2 {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
}
.member-block-confirm__panel p {
  margin: 10px 0 0;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 22px;
}
.member-block-confirm__panel footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}
.member-block-confirm__panel footer button {
  min-height: 36px;
  padding: 0 13px;
}
.member-block-confirm__submit {
  border-color: var(--color-danger) !important;
  background: var(--color-danger) !important;
  color: var(--color-text-inverse) !important;
}
.member-block-confirm__submit:hover:not(:disabled),
.member-block-confirm__submit:focus-visible:not(:disabled) {
  filter: brightness(0.92);
  outline: 2px solid color-mix(in srgb, var(--color-danger) 35%, transparent);
  outline-offset: 1px;
}
.member-block-confirm-enter-active,
.member-block-confirm-leave-active {
  transition: opacity 0.18s ease;
}
.member-block-confirm-enter-active .member-block-confirm__panel,
.member-block-confirm-leave-active .member-block-confirm__panel {
  transition: transform 0.2s ease;
}
.member-block-confirm-enter-from,
.member-block-confirm-leave-to {
  opacity: 0;
}
.member-block-confirm-enter-from .member-block-confirm__panel,
.member-block-confirm-leave-to .member-block-confirm__panel {
  transform: translateY(8px) scale(0.98);
}
.member-profile__details {
  margin: 0 15px;
  padding: 0 0 12px;
  border-bottom: 1px solid var(--layer-border-color);
  text-align: center;
}
.member-profile__intro {
  margin: 0 0 8px;
  color: var(--text-color);
  font-size: 14px;
  line-height: 24px;
  overflow-wrap: anywhere;
}
.member-profile__line {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 0;
  color: var(--text-gray-color);
  font-size: 12px;
  line-height: 24px;
  overflow-wrap: anywhere;
}
.member-profile__line span {
  color: var(--text-fade-color);
}
.member-profile__line a {
  min-width: 0;
  color: var(--link-color);
  overflow-wrap: anywhere;
}
.member-profile__stats {
  display: flex;
  padding: 0 8px;
}
.member-profile__stats a {
  display: grid;
  flex: 1;
  gap: 2px;
  padding: 13px 4px;
  color: var(--text-gray-color);
  text-align: center;
  text-decoration: none;
}
.member-profile__stats a:hover {
  background: var(--background-secondary-color);
  color: var(--text-color);
}
.member-profile__stats strong {
  color: var(--text-color);
  font-size: 16px;
  line-height: 20px;
}
.member-profile__stats span {
  font-size: 12px;
  line-height: 18px;
}
@media (max-width: 768px) {
  .member-page {
    padding-top: 8px;
  }
  .member-page__wrapper {
    display: flex;
    flex-direction: column;
  }
  .member-profile {
    order: -1;
    width: 100%;
    margin: 0 0 12px;
  }
  .member-profile__identity :deep(.avatar) {
    width: 92px !important;
    height: 92px !important;
  }
  .member-page__content {
    width: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .member-block-confirm,
  .member-block-confirm__panel {
    transition: none !important;
  }
}
</style>
