<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import type { Profile } from "@bass/bbs-sdk-fetch/models/Profile";
import Avatar from "@/components/identity/Avatar.vue";
import AppLink from "@/components/ui/AppLink.vue";
import { message } from "@/components/feedback/message";
import { currentAccount } from "@/services/sessionState";
import { registerUserCardController, type UserCardController } from "@/services/userCard";
import { bbsClient } from "@/utils/sdk";
import { memberDisplayName } from "@/utils/member";

type CardState = "initial" | "show" | "hide";

const cardDelay = 200;
const triggerLeaveDelay = 100;
const cardExitDuration = 250;
const pageContext = usePageContext();
const profile = ref<Profile>();
const mounted = ref(false);
const visible = ref(false);
const state = ref<CardState>("initial");
const position = ref<Record<string, string>>({});
const card = ref<HTMLElement>();
const activeName = ref("");
const pendingName = ref("");
const pendingTrigger = ref<HTMLElement>();
const pendingFocus = ref(false);
const followPending = ref(false);
const profileCache = new Map<string, Promise<Profile | undefined>>();

let openTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;
let exitTimer: ReturnType<typeof setTimeout> | undefined;

const account = computed(() => pageContext.user || currentAccount.value);
const hasBackground = computed(() => Boolean(profile.value?.backgroundUrl));
const canFollow = computed(() => {
  const targetID = profile.value?.account?.id;
  const viewerID = account.value?.profile?.id;
  const relation = profile.value?.viewerRelation;
  return Boolean(targetID && viewerID && targetID !== viewerID && !relation?.blocking && !relation?.blockedBy);
});
const followLabel = computed(() => {
  if (!profile.value?.viewerRelation?.following) return "关注";
  return profile.value.viewerRelation.followedBy ? "互相关注" : "已关注";
});

function ClearTimer(timer: ReturnType<typeof setTimeout> | undefined) {
  if (timer) clearTimeout(timer);
}

function IsDesktop() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function CancelClose() {
  ClearTimer(closeTimer);
  ClearTimer(exitTimer);
  closeTimer = undefined;
  exitTimer = undefined;
  if (visible.value && state.value === "hide") state.value = "show";
}

function CloseImmediately() {
  ClearTimer(openTimer);
  ClearTimer(closeTimer);
  ClearTimer(exitTimer);
  openTimer = undefined;
  closeTimer = undefined;
  exitTimer = undefined;
  pendingName.value = "";
  pendingTrigger.value = undefined;
  pendingFocus.value = false;
  visible.value = false;
  activeName.value = "";
  state.value = "initial";
}

function BeginExit() {
  if (!visible.value) return;
  state.value = "hide";
  ClearTimer(exitTimer);
  exitTimer = setTimeout(CloseImmediately, cardExitDuration);
}

function ScheduleClose(delay = triggerLeaveDelay) {
  ClearTimer(openTimer);
  openTimer = undefined;
  ClearTimer(closeTimer);
  closeTimer = setTimeout(BeginExit, delay);
}

function PositionCard(trigger: HTMLElement) {
  const width = hasBackground.value ? 460 : 400;
  const padding = 12;
  const triggerBounds = trigger.getBoundingClientRect();
  let left = triggerBounds.left + 30;
  if (left + width > window.innerWidth - padding) left = triggerBounds.left - 350;
  left = Math.max(padding, Math.min(left, window.innerWidth - width - padding));

  const height = card.value?.getBoundingClientRect().height || 240;
  let top = triggerBounds.top - 110;
  if (top < 45) top = triggerBounds.top + 45;
  top = Math.max(padding, Math.min(top, window.innerHeight - height - padding));
  position.value = { left: `${Math.round(left)}px`, top: `${Math.round(top)}px` };
}

function LoadProfile(name: string) {
  const existing = profileCache.get(name);
  if (existing) return existing;
  const request = bbsClient.account
    .getProfile({ getProfileReq: { name } })
    .then((response) => response.profile)
    .catch(() => undefined);
  profileCache.set(name, request);
  return request;
}

async function Present(name: string, trigger: HTMLElement) {
  const loaded = await LoadProfile(name);
  if (!loaded || pendingName.value !== name || pendingTrigger.value !== trigger || !IsDesktop()) return;
  const changed = activeName.value !== name || !visible.value;
  profile.value = loaded;
  activeName.value = name;
  visible.value = true;
  await nextTick();
  PositionCard(trigger);
  if (changed) {
    state.value = "initial";
    requestAnimationFrame(() => {
      if (visible.value && activeName.value === name) state.value = "show";
    });
  } else {
    state.value = "show";
  }
  if (pendingFocus.value) {
    pendingFocus.value = false;
    await nextTick();
    card.value?.querySelector<HTMLElement>(".user-card__follow, .user-card__name")?.focus({ preventScroll: true });
  }
}

function Open(name: string, trigger: HTMLElement, focusCard = false) {
  if (!name || !IsDesktop()) return;
  CancelClose();
  ClearTimer(openTimer);
  pendingName.value = name;
  pendingTrigger.value = trigger;
  pendingFocus.value = focusCard;
  openTimer = setTimeout(() => void Present(name, trigger), cardDelay);
}

async function ToggleFollow() {
  const targetID = profile.value?.account?.id;
  if (!targetID || !canFollow.value || followPending.value) return;
  followPending.value = true;
  try {
    const following = Boolean(profile.value?.viewerRelation?.following);
    if (following) {
      await bbsClient.relation.unfollow({ unfollowRelationReq: { targetId: targetID } });
    } else {
      await bbsClient.relation.follow({ followRelationReq: { targetId: targetID } });
    }
    if (!profile.value) return;
    profile.value = {
      ...profile.value,
      viewerRelation: { ...profile.value.viewerRelation, following: !following },
    };
    profileCache.set(activeName.value, Promise.resolve(profile.value));
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "关注操作失败，请稍后重试。");
  } finally {
    followPending.value = false;
  }
}

function HandleCardLeave() {
  ScheduleClose(0);
}

function CloseOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") CloseImmediately();
}

const controller: UserCardController = { open: Open, close: () => ScheduleClose() };

onMounted(() => {
  mounted.value = true;
  registerUserCardController(controller);
  window.addEventListener("scroll", CloseImmediately, true);
  window.addEventListener("resize", CloseImmediately);
  window.addEventListener("keydown", CloseOnEscape);
});

onBeforeUnmount(() => {
  registerUserCardController();
  window.removeEventListener("scroll", CloseImmediately, true);
  window.removeEventListener("resize", CloseImmediately);
  window.removeEventListener("keydown", CloseOnEscape);
  ClearTimer(openTimer);
  ClearTimer(closeTimer);
  ClearTimer(exitTimer);
});

watch(
  () => pageContext.urlPathname,
  () => CloseImmediately(),
);
</script>

<template>
  <Teleport v-if="mounted" to="#teleported">
    <section
      v-if="visible && profile?.account"
      id="userCard"
      ref="card"
      :class="[`user-card--${state}`]"
      :style="position"
      aria-label="用户资料卡"
      @focusin="CancelClose"
      @focusout="HandleCardLeave"
      @pointerenter="CancelClose"
      @pointerleave="HandleCardLeave"
    >
      <article
        :class="{ 'user-card--bg': hasBackground }"
        :style="hasBackground ? { backgroundImage: `url(${profile.backgroundUrl})` } : undefined"
        class="user-card"
      >
        <div class="user-card__surface">
          <AppLink :href="`/member/${profile.account.name}`" class="user-card__avatar">
            <Avatar :name="profile.account.name" :size="76" :url="profile.account.avatarUrl" square />
          </AppLink>
          <div class="user-card__content">
            <header class="user-card__meta">
              <div class="user-card__name-wrapper">
                <AppLink :href="`/member/${profile.account.name}`" class="user-card__name">
                  {{ memberDisplayName(profile.account) }}
                </AppLink>
                <AppLink :href="`/member/${profile.account.name}`" class="user-card__account">{{
                  profile.account.name
                }}</AppLink>
              </div>
            </header>
            <div class="user-card__stats">
              <AppLink :href="`/member/${profile.account.name}/following`"
                >{{ profile.account.followCount || 0 }} 关注</AppLink
              >
              <AppLink :href="`/member/${profile.account.name}/followers`"
                >{{ profile.account.followerCount || 0 }} 粉丝</AppLink
              >
            </div>
            <p v-if="profile.account.introduction" class="user-card__intro">{{ profile.account.introduction }}</p>
          </div>
          <footer class="user-card__actions">
            <button
              v-if="canFollow"
              :disabled="followPending"
              class="user-card__follow"
              type="button"
              @click="ToggleFollow"
            >
              {{ followLabel }}
            </button>
            <AppLink
              v-if="profile.account?.id"
              :href="`/messages?peer=${profile.account.id}`"
              class="user-card__message"
              >私信</AppLink
            >
          </footer>
        </div>
      </article>
    </section>
  </Teleport>
</template>

<style scoped>
#userCard {
  position: fixed;
  z-index: 130;
  background: transparent;
  opacity: 1;
  pointer-events: auto;
  transform: translateZ(0);
  transition: opacity 0.2s ease;
  will-change: opacity, transform;
}
.user-card {
  width: 400px;
  min-height: 50px;
  overflow: hidden;
  border-top: 1px solid transparent;
  border-radius: 3px;
  background: var(--color-bg-surface);
  background-position: center;
  background-size: cover;
  box-shadow: var(--shadow-surface);
  box-sizing: border-box;
  color: var(--color-text);
  font-size: 14px;
  opacity: 1;
  transform: scale(0.92) translateY(8px);
}
.user-card--bg {
  width: 460px;
}
.user-card__surface {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 0 14px;
  position: relative;
  min-height: 150px;
  margin: 0 !important;
  padding: 18px;
  border-radius: 3px;
}
.user-card--bg .user-card__surface {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-bg-surface) 54%, transparent),
    color-mix(in srgb, var(--color-bg-surface) 74%, transparent)
  );
}
.user-card--initial .user-card {
  opacity: 0;
}
.user-card--show .user-card {
  opacity: 1;
  transform: scale(1) translateY(0);
  transition:
    opacity 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.user-card--hide {
  opacity: 0;
}
.user-card--hide .user-card {
  opacity: 0;
  transform: scale(0.95) translateY(6px);
  transition:
    opacity 0.18s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}
.user-card__avatar {
  grid-column: 1;
  grid-row: 1;
  display: block;
  width: 76px;
  height: 76px;
  border: 0;
  text-decoration: none;
  animation: user-card-avatar-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) 0.06s both;
}
.user-card__avatar :deep(.avatar) {
  display: block;
  margin: 0;
  border: 1px solid rgb(255 255 255 / 80%);
  background-color: var(--color-bg-muted);
  box-shadow: 0 1px 2px rgb(27 31 35 / 18%);
}
.user-card__content {
  grid-column: 2;
  min-width: 0;
}
.user-card__name-wrapper {
  min-width: 0;
  animation: user-card-slide-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both;
}
.user-card__name,
.user-card__account {
  display: inline;
  overflow-wrap: anywhere;
  text-decoration: none;
}
.user-card__name {
  margin-left: 0 !important;
  color: var(--color-text-strong);
  font-size: 18px;
  font-weight: 700;
  line-height: 22px;
}
.user-card__account {
  margin-left: 8px;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
}
.user-card__intro {
  margin: 10px 0 0;
  color: var(--color-text);
  font-size: 14px;
  line-height: 18px;
  overflow-wrap: anywhere;
  animation: user-card-slide-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both;
}
.user-card__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 18px;
  animation: user-card-slide-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) 0.16s both;
}
.user-card__stats a {
  color: var(--color-text-muted);
  text-decoration: none;
}
.user-card__stats a:hover,
.user-card__stats a:focus-visible {
  color: var(--color-link-hover);
  text-decoration: underline;
}
.user-card__actions {
  grid-column: 2;
  align-self: end;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  animation: user-card-slide-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
}
.user-card__follow {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  justify-content: center;
  padding: 0 11px;
  border: 1px solid var(--color-accent);
  border-radius: 4px;
  background: var(--color-accent);
  color: var(--color-text-inverse);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  line-height: 1;
  text-decoration: none;
}
.user-card__follow:hover:not(:disabled),
.user-card__follow:focus-visible:not(:disabled) {
  border-color: var(--color-accent-hover);
  background: var(--color-accent-hover);
  color: var(--color-text-inverse);
  outline: 0;
}
.user-card__follow {
  min-width: 88px;
}
.user-card__follow:disabled {
  cursor: wait;
  opacity: 0.65;
}
.user-card__message {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  justify-content: center;
  padding: 0 11px;
  border: 1px solid var(--color-border-strong);
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-bg-surface) 82%, transparent);
  color: var(--color-text-subtle);
  cursor: pointer;
  text-decoration: none;
  font: inherit;
  font-size: 13px;
  line-height: 1;
}
@keyframes user-card-avatar-in {
  from {
    opacity: 0;
    transform: scale(0.88);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes user-card-slide-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (hover: none), (pointer: coarse) {
  #userCard {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .user-card,
  .user-card--show .user-card,
  .user-card--hide .user-card,
  .user-card__avatar,
  .user-card__name-wrapper,
  .user-card__intro,
  .user-card__stats,
  .user-card__actions {
    animation: none;
    transition: none;
  }
}
</style>
