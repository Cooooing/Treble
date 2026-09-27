<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import Avatar from "@/components/Avatar";
import Icon from "@/components/community/Icon.vue";
import BrandMark from "@/components/BrandMark.vue";
import { message } from "@/components/Message";
import { logout } from "@/services/auth";
import { currentAccount, setCurrentAccount } from "@/utils/auth/state";
import { bbsClient } from "@/utils/sdk";
import { applyTheme, defaultTheme, getStoredTheme, type Theme } from "@/utils/theme";

const pageContext = usePageContext();
const accountMenu = ref<HTMLDetailsElement>();
const theme = ref<Theme>(defaultTheme);
const unreadCount = ref(0);
const menus = [
  { name: "最新", path: "/recent", icon: "refresh" },
  { name: "最热", path: "/hot", icon: "fire" },
];

watch(
  () => pageContext.user,
  (account) => {
    if (account) setCurrentAccount(account);
  },
  { immediate: true },
);

function closeWhenClickingOutside(event: PointerEvent) {
  if (!accountMenu.value?.contains(event.target as Node)) accountMenu.value?.removeAttribute("open");
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") accountMenu.value?.removeAttribute("open");
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? defaultTheme : "dark";
  applyTheme(theme.value);
}

async function signOut() {
  accountMenu.value?.removeAttribute("open");
  try {
    await logout();
  } catch (error) {
    message.warning(error instanceof Error ? `${error.message}，但已在本设备退出。` : "已在本设备退出。");
  } finally {
    window.location.assign("/");
  }
}

onMounted(async () => {
  document.addEventListener("pointerdown", closeWhenClickingOutside);
  document.addEventListener("keydown", closeOnEscape);
  theme.value = getStoredTheme();
  if (currentAccount.value) {
    try {
      unreadCount.value = (await bbsClient.notification.countUnread({ body: {} })).count || 0;
    } catch {
      unreadCount.value = 0;
    }
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", closeWhenClickingOutside);
  document.removeEventListener("keydown", closeOnEscape);
});
</script>

<template>
  <header class="nav">
    <h1 aria-label="摸鱼派" class="tooltipped tooltipped-s">
      <a href="/" aria-label="摸鱼派首页"><BrandMark /></a>
    </h1>
    <nav class="nav-tabs" aria-label="主导航">
      <a
        v-for="menu in menus"
        :key="menu.path"
        :href="menu.path"
        :class="{ current: pageContext.urlPathname === menu.path }"
        :aria-current="pageContext.urlPathname === menu.path ? 'page' : undefined"
        ><Icon :name="menu.icon" /> {{ menu.name }}</a
      >
    </nav>
    <section class="user-nav" aria-label="账户操作">
      <button
        class="theme-toggle"
        type="button"
        :aria-label="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
        @click="toggleTheme"
      >
        <Icon :name="theme === 'dark' ? 'color-moon' : 'color-sun'" />
      </button>
      <template v-if="currentAccount">
        <a href="/notifications" class="no-msg" aria-label="通知中心"
          ><Icon name="notification" />&nbsp;{{ unreadCount }}</a
        >
        <a href="/pre-post" class="pre-post"><Icon name="addpost" />&nbsp;发帖</a>
        <details ref="accountMenu" class="account-menu">
          <summary class="account-menu__trigger" aria-label="打开账户菜单">
            <Avatar :url="currentAccount.profile?.avatarUrl" :name="currentAccount.profile?.name" :size="32" />
          </summary>
          <nav id="account-menu-panel" class="person-list show account-menu__panel" aria-label="账户菜单">
            <ul>
              <li><a href="/home">个人主页</a></li>
              <li><a href="/settings">设置</a></li>
              <li><a href="/help">帮助</a></li>
              <li><button type="button" @click="signOut">退出登录</button></li>
            </ul>
          </nav>
        </details>
      </template>
      <template v-else>
        <a href="/login" class="nav-auth-link">登录</a>
        <a href="/register" class="nav-auth-link">注册</a>
      </template>
    </section>
  </header>
</template>

<style scoped>
.account-menu {
  position: relative;
  display: inline-flex;
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
  background: #fff7ec;
  color: #e59230;
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
}
.account-menu__panel ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.account-menu__panel button {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.account-menu__panel button:hover,
.account-menu__panel button:focus-visible {
  background: rgba(248, 250, 252, 0.9);
  outline: none;
}
.nav-auth-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0 2px;
  padding: 0 12px;
  border: 0;
  border-radius: 6px;
  color: #3b3e43;
  font-size: 14px;
  font-weight: 500;
  line-height: normal;
  text-decoration: none;
  transition:
    color 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-auth-link::after {
  position: absolute;
  right: 20%;
  bottom: 0;
  left: 20%;
  height: 2px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e59230 0%, #ffb86c 100%);
  content: "";
  opacity: 0;
  transform: scaleX(0.6);
  transition:
    opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-auth-link:hover,
.nav-auth-link:focus-visible {
  background: #fff7ec;
  color: #e59230;
}
.nav-auth-link:hover::after,
.nav-auth-link:focus-visible::after {
  opacity: 1;
  transform: scaleX(1);
}
.nav-auth-link:focus-visible {
  outline: 2px solid #e59230;
  outline-offset: -2px;
}
:global(html[data-theme="dark"]) .theme-toggle:hover,
:global(html[data-theme="dark"]) .theme-toggle:focus-visible,
:global(html[data-theme="dark"]) .account-menu__trigger:hover,
:global(html[data-theme="dark"]) .account-menu__trigger:focus-visible,
:global(html[data-theme="dark"]) .account-menu[open] .account-menu__trigger {
  background: #444d56;
  color: #79b8ff;
}
:global(html[data-theme="dark"]) .account-menu__panel button:hover,
:global(html[data-theme="dark"]) .account-menu__panel button:focus-visible {
  background: #3a444d;
}
:global(html[data-theme="dark"]) .nav-auth-link {
  color: #d7dde5;
}
:global(html[data-theme="dark"]) .nav-auth-link:hover,
:global(html[data-theme="dark"]) .nav-auth-link:focus-visible {
  background: #444d56;
  color: #ffb86c;
}
:global(html[data-theme="dark"]) .nav-auth-link:focus-visible {
  outline-color: #ffb86c;
}
</style>
