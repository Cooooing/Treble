<script lang="ts" setup>
import AppLink from "@/components/ui/AppLink.vue";
import Avatar from "@/components/identity/Avatar.vue";
import { fromNow } from "@/utils/date";
import type { Profile } from "@bass/bbs-sdk-fetch/models/Profile";

const props = defineProps<{
  profile: Profile;
  active: "articles" | "moonbreezes" | "comments" | "following" | "followers";
}>();
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
            <span v-if="profile.account?.mbti" class="member-profile__mbti">{{ profile.account.mbti }}</span>
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
  height: 60px;
  background: linear-gradient(135deg, #d6e6f5 0%, #edf2f7 50%, #f3dfc7 100%);
  background-position: center;
  background-size: cover;
}
.member-profile__identity {
  margin-top: -38px;
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
  .member-profile__cover {
    height: 70px;
  }
  .member-profile__identity {
    margin-top: -46px;
  }
  .member-profile__identity :deep(.avatar) {
    width: 92px !important;
    height: 92px !important;
  }
  .member-page__content {
    width: 100%;
  }
}
</style>
