<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { navigate } from "vike/client/router";
import { usePageContext } from "vike-vue/usePageContext";
import Avatar from "@/components/identity/Avatar.vue";
import Icon from "@/components/ui/Icon.vue";
import SiteLogo from "@/components/layout/SiteLogo.vue";
import AppLink from "@/components/ui/AppLink.vue";
import { message } from "@/components/feedback/message";
import { logout } from "@/services/auth";
import {
  getRealtimeConnection,
  getRealtimeNodeUrl,
  stopRealtimeConnection,
  type RealtimeTicket,
} from "@/services/realtime";
import {
  clearSearchHistory,
  loadSearchHistory,
  removeSearchHistory,
  saveSearchHistory,
} from "@/services/searchHistory";
import { currentAccount, setCurrentAccount } from "@/services/sessionState";
import { openWorkCountdownSettings } from "@/services/workCountdown";
import { bbsClient } from "@/utils/sdk";
import { applyTheme, defaultTheme, getStoredTheme, type Theme } from "@/utils/theme";

const pageContext = usePageContext();
const accountMenu = ref<HTMLDetailsElement>();
const searchBox = ref<HTMLElement>();
const theme = ref<Theme>(defaultTheme);
const unreadCount = ref(0);
const searchQuery = ref("");
const searchHistory = ref<string[]>([]);
const searchHistoryOpen = ref(false);
const guestCity = ref<string>();
const receivedNotificationIDs = new Set<string>();
let unsubscribeNotification: (() => void) | undefined;

const account = computed(() => {
  if (typeof window === "undefined") return pageContext.user;
  return pageContext.user || currentAccount.value;
});
const locationCity = computed(() => {
  if (account.value) return normalizeCity(account.value.location?.city);
  return normalizeCity(guestCity.value);
});
const menus = computed(() => [
  { name: "最新", path: "/recent", icon: "refresh" },
  { name: "最热", path: "/hot", icon: "fire" },
  { name: "清风明月", path: "/moonbreezes", icon: "moonbreezes" },
  ...(locationCity.value ? [{ name: locationCity.value, path: "/nearby", icon: "feed" }] : []),
  ...(account.value ? [{ name: "关注", path: "/following", icon: "userrole" }] : []),
]);

function normalizeCity(value?: string): string | undefined {
  const city = value?.trim();
  if (!city) return undefined;
  if (["0", "null", "undefined", "未知", "内网IP", "局域网", "本地", "保留地址", "N/A"].includes(city)) {
    return undefined;
  }
  return city;
}

function syncClientAccount() {
  // A rendering failure can yield an error page without its original page
  // context. Do not turn that missing context into a client-side logout: only
  // replace the cached account after the server has actually supplied one.
  if (pageContext.user) setCurrentAccount(pageContext.user);
}

function closeWhenClickingOutside(event: PointerEvent) {
  if (!accountMenu.value?.contains(event.target as Node)) accountMenu.value?.removeAttribute("open");
  if (!searchBox.value?.contains(event.target as Node)) searchHistoryOpen.value = false;
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  accountMenu.value?.removeAttribute("open");
  searchHistoryOpen.value = false;
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? defaultTheme : "dark";
  applyTheme(theme.value);
}

async function searchArticles() {
  const query = searchQuery.value.trim();
  if (!query) return;
  searchHistory.value = saveSearchHistory(query);
  searchHistoryOpen.value = false;
  await navigate(`/search?q=${encodeURIComponent(query)}`);
}

async function searchFromHistory(query: string) {
  searchQuery.value = query;
  await searchArticles();
}

function removeHistory(query: string) {
  searchHistory.value = removeSearchHistory(query);
}

function clearHistory() {
  clearSearchHistory();
  searchHistory.value = [];
}

async function signOut() {
  accountMenu.value?.removeAttribute("open");
  stopRealtimeConnection();
  try {
    await logout();
  } catch (error) {
    message.warning(error instanceof Error ? `${error.message}，但已在本设备退出。` : "已在本设备退出。");
  } finally {
    await navigate("/");
  }
}

async function refreshUnreadCount() {
  try {
    unreadCount.value = (await bbsClient.notification.countUnread({ body: {} })).count || 0;
  } catch {
    // Keep the last known count when a transient refresh fails.
  }
}

async function issueRealtimeTicket(): Promise<RealtimeTicket | undefined> {
  const response = await bbsClient.realtime.createTicket({ body: {} });
  if (!response.ticket || !response.path) return undefined;
  return { ticket: response.ticket, path: response.path };
}

async function connectRealtime() {
  if (!account.value) return;
  const realtimeNodeURL = await getRealtimeNodeUrl();
  if (!realtimeNodeURL || !account.value) return;
  const realtime = getRealtimeConnection({
    issueTicket: issueRealtimeTicket,
    resolveEndpoint: ({ path, ticket }) => `${realtimeNodeURL}${path}?ticket=${encodeURIComponent(ticket)}`,
  });

  unsubscribeNotification = realtime.subscribe("notification", (event) => {
    const notificationID = notificationIDFromEvent(event);
    if (!notificationID || receivedNotificationIDs.has(notificationID)) return;
    receivedNotificationIDs.add(notificationID);
    if (receivedNotificationIDs.size > 100) {
      const oldestNotificationID = receivedNotificationIDs.values().next().value;
      if (oldestNotificationID) receivedNotificationIDs.delete(oldestNotificationID);
    }
    unreadCount.value += 1;
    message.info("收到一条新通知", { id: `notification:${notificationID}` });
    void refreshUnreadCount();
  });
  realtime.start();
}

function disconnectRealtime() {
  unsubscribeNotification?.();
  unsubscribeNotification = undefined;
}

function notificationIDFromEvent(event: MessageEvent<string>) {
  try {
    const payload = JSON.parse(event.data) as { notification_id?: string | number };
    const notificationID = String(payload.notification_id || "").trim();
    return notificationID && notificationID !== "0" ? notificationID : undefined;
  } catch {
    return undefined;
  }
}

onMounted(async () => {
  document.addEventListener("pointerdown", closeWhenClickingOutside);
  document.addEventListener("keydown", closeOnEscape);
  theme.value = getStoredTheme();
  searchHistory.value = loadSearchHistory();
  syncClientAccount();
  if (!account.value) {
    try {
      guestCity.value = normalizeCity((await bbsClient.location.getCurrent({ body: {} })).location?.city);
    } catch {
      guestCity.value = undefined;
    }
  }
  if (account.value) {
    await refreshUnreadCount();
    void connectRealtime();
  }
});

onBeforeUnmount(() => {
  disconnectRealtime();
  document.removeEventListener("pointerdown", closeWhenClickingOutside);
  document.removeEventListener("keydown", closeOnEscape);
});

watch(
  () => pageContext.user,
  (nextAccount) => {
    if (typeof window === "undefined") return;
    if (nextAccount) setCurrentAccount(nextAccount);
  },
);

watch(
  () => pageContext.urlPathname,
  () => {
    accountMenu.value?.removeAttribute("open");
    searchHistoryOpen.value = false;
  },
);
</script>

<template>
  <header class="nav">
    <h1 aria-label="摸鱼派" class="tooltipped tooltipped-s">
      <AppLink aria-label="摸鱼派首页" href="/"><SiteLogo /></AppLink>
    </h1>
    <nav aria-label="主导航" class="nav-tabs">
      <AppLink
        v-for="menu in menus"
        :key="menu.path"
        :aria-current="pageContext.urlPathname === menu.path ? 'page' : undefined"
        :class="{ current: pageContext.urlPathname === menu.path }"
        :href="menu.path"
        ><Icon :name="menu.icon" /> {{ menu.name }}</AppLink
      >
    </nav>
    <form ref="searchBox" aria-label="搜索文章" class="nav-search" role="search" @submit.prevent="searchArticles">
      <label class="fn-none" for="site-search">搜索文章</label>
      <Icon name="search" />
      <input
        id="site-search"
        v-model="searchQuery"
        aria-controls="site-search-history"
        :aria-expanded="searchHistoryOpen"
        autocomplete="off"
        maxlength="128"
        placeholder="搜索文章"
        type="search"
        @focus="searchHistoryOpen = true"
      />
      <section v-if="searchHistoryOpen" id="site-search-history" aria-label="搜索历史" class="search-history">
        <header class="search-history__header">
          <strong>搜索历史</strong>
          <button v-if="searchHistory.length" type="button" @click="clearHistory">清空</button>
        </header>
        <p v-if="!searchHistory.length" class="search-history__empty">暂无搜索历史</p>
        <ul v-else class="search-history__list">
          <li v-for="item in searchHistory" :key="item">
            <button class="search-history__query" type="button" @click="searchFromHistory(item)">{{ item }}</button>
            <button
              :aria-label="`删除搜索历史：${item}`"
              class="search-history__remove"
              type="button"
              @click="removeHistory(item)"
            >
              ×
            </button>
          </li>
        </ul>
      </section>
    </form>
    <section aria-label="账户操作" class="user-nav">
      <button
        :aria-label="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
        class="theme-toggle"
        type="button"
        @click="toggleTheme"
      >
        <Icon :name="theme === 'dark' ? 'color-moon' : 'color-sun'" />
      </button>
      <template v-if="account">
        <AppLink aria-label="通知中心" class="no-msg" href="/notifications"
          ><Icon name="notification" />&nbsp;{{ unreadCount }}</AppLink
        >
        <AppLink class="pre-post" href="/pre-post"><Icon name="addpost" />&nbsp;发帖</AppLink>
        <details ref="accountMenu" class="account-menu">
          <summary aria-label="打开账户菜单" class="account-menu__trigger">
            <Avatar :name="account.profile?.name" :size="32" :url="account.profile?.avatarUrl" />
          </summary>
          <nav id="account-menu-panel" aria-label="账户菜单" class="person-list show account-menu__panel">
            <ul>
              <li>
                <AppLink :href="account.profile?.name ? `/member/${account.profile.name}` : '/home'">个人主页</AppLink>
              </li>
              <li><AppLink href="/settings">设置</AppLink></li>
              <li><button type="button" @click="openWorkCountdownSettings()">下班倒计时</button></li>
              <li><AppLink href="/help">帮助</AppLink></li>
              <li><button type="button" @click="signOut">退出登录</button></li>
            </ul>
          </nav>
        </details>
      </template>
      <template v-else>
        <AppLink class="nav-auth-link" href="/login">登录</AppLink>
        <AppLink class="nav-auth-link" href="/register">注册</AppLink>
      </template>
    </section>
  </header>
</template>

<style scoped>
.account-menu {
  position: relative;
  display: inline-flex;
}
.nav-search {
  position: relative;
  display: inline-flex;
  flex: 0 1 220px;
  align-items: center;
  min-width: 130px;
  height: 34px;
  margin: 0 12px;
  padding: 0 9px;
  border: 1px solid var(--layer-border-color);
  border-radius: 6px;
  background: var(--background-secondary-color);
  color: var(--text-fade-color);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;
}
.nav-search:focus-within {
  border-color: var(--color-accent);
  background: var(--layer-background-color);
  box-shadow: 0 0 0 3px var(--color-accent-soft);
}
.nav-search :deep(svg) {
  width: 15px;
  height: 15px;
}
.nav-search input {
  width: 100%;
  min-width: 0;
  height: 100%;
  margin-left: 6px;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-color);
  font: inherit;
  font-size: 13px;
}
.search-history {
  position: absolute;
  top: calc(100% + 9px);
  left: 0;
  z-index: 1003;
  width: max(300px, 100%);
  padding: 16px;
  border: 1px solid var(--layer-border-color);
  border-radius: 8px;
  background: var(--layer-background-color);
  box-shadow: 0 14px 36px rgba(17, 58, 93, 0.17);
  box-sizing: border-box;
}
.search-history__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-color);
  font-size: 15px;
}
.search-history__header button {
  padding: 3px 0;
  border: 0;
  background: transparent;
  color: var(--text-fade-color);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.search-history__header button:hover,
.search-history__header button:focus-visible {
  color: var(--color-accent);
  outline: none;
}
.search-history__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 13px 0 0;
  padding: 0;
  list-style: none;
}
.search-history__list li {
  display: flex;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  border-radius: 5px;
  background: var(--background-secondary-color);
}
.search-history__query,
.search-history__remove {
  border: 0;
  background: transparent;
  color: var(--text-color);
  font: inherit;
  cursor: pointer;
}
.search-history__query {
  min-width: 0;
  max-width: 210px;
  padding: 7px 5px 7px 10px;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-history__remove {
  display: grid;
  width: 26px;
  place-items: center;
  padding: 0;
  color: var(--text-fade-color);
  font-size: 18px;
  line-height: 1;
}
.search-history__list li:hover .search-history__remove,
.search-history__remove:focus-visible {
  color: var(--color-accent);
  outline: none;
}
.search-history__empty {
  margin: 13px 0 1px;
  color: var(--text-fade-color);
  font-size: 13px;
}
@media (max-width: 760px) {
  .nav-search {
    flex: 0 1 150px;
    margin-left: auto;
    margin-right: 52px;
  }
  .search-history {
    right: 0;
    left: auto;
    width: min(360px, calc(100vw - 20px));
  }
}
.theme-toggle,
.account-menu__trigger {
  display: inline-grid;
  width: 36px;
  height: 36px;
  place-items: center;
  margin: 8px 5px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.account-menu__trigger {
  list-style: none;
}
.account-menu__trigger::-webkit-details-marker {
  display: none;
}
.account-menu:not([open]) .account-menu__panel {
  display: none !important;
}
.theme-toggle:hover,
.theme-toggle:focus-visible,
.account-menu__trigger:hover,
.account-menu__trigger:focus-visible,
.account-menu[open] .account-menu__trigger {
  background: var(--color-accent-soft);
  color: var(--color-accent);
  outline: none;
}
.theme-toggle :deep(svg) {
  width: 18px;
  height: 18px;
}
.account-menu__trigger :deep(.avatar) {
  margin: 0;
}
.account-menu__panel {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  z-index: 1002;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
.account-menu__panel ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.account-menu__panel li {
  overflow: hidden;
}
.account-menu__panel :is(a, button) {
  display: block;
  width: 100%;
  min-height: 36px;
  padding: 8px 10px;
  border: 0;
  border-radius: 0;
  box-sizing: border-box;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  outline: none;
  transform: none !important;
  box-shadow: none !important;
  transition: none !important;
  will-change: auto !important;
}
.account-menu__panel :is(a, button):hover,
.account-menu__panel :is(a, button):focus-visible {
  background: var(--color-bg-hover);
  color: var(--color-accent);
  outline: none;
  transform: none !important;
  box-shadow: none !important;
}
.nav-auth-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 52px;
  width: 52px;
  min-height: 36px;
  margin: 8px 3px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  box-sizing: border-box;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  line-height: normal;
  text-decoration: none;
}
.nav-auth-link:visited {
  color: var(--color-text);
}
.nav-auth-link:hover,
.nav-auth-link:focus-visible {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}
.nav-auth-link:focus-visible {
  outline: 0;
}
</style>
