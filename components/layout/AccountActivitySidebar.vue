<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import AppLink from "@/components/ui/AppLink.vue";
import Icon from "@/components/ui/Icon.vue";
import { currentAccount } from "@/services/sessionState";
import { bbsClient } from "@/utils/sdk";

const pageContext = usePageContext();
const account = computed(() => currentAccount.value || pageContext.user);
const followingCount = computed(() => account.value?.profile?.followCount || 0);
const username = computed(() => account.value?.profile?.name || "");
const liveness = ref(0);
const maximumLiveness = ref(300);
const collectedCount = ref(0);
const balance = ref("0");

const livenessPercent = computed(() => {
  if (maximumLiveness.value <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((liveness.value / maximumLiveness.value) * 100)));
});
const livenessStyle = computed(() => ({ "--account-activity-wave-top": `${20 - livenessPercent.value / 2}px` }));
const livenessLabel = computed(
  () => `今日活跃度 ${liveness.value}/${maximumLiveness.value}，${livenessPercent.value}%`,
);

function reset() {
  liveness.value = 0;
  maximumLiveness.value = 300;
  collectedCount.value = 0;
  balance.value = "0";
}

async function load() {
  if (!account.value) {
    reset();
    return;
  }
  const [livenessResponse, collectedResponse, economyResponse] = await Promise.all([
    bbsClient.liveness.getLiveness().catch(() => undefined),
    bbsClient.article.countCollected({ body: {} }).catch(() => undefined),
    bbsClient.account.getEconomyAccount({ body: {} }).catch(() => undefined),
  ]);
  if (livenessResponse) {
    liveness.value = livenessResponse.score ?? 0;
    maximumLiveness.value = livenessResponse.maxScore ?? 300;
  }
  if (collectedResponse) collectedCount.value = collectedResponse.count ?? 0;
  if (economyResponse) balance.value = economyResponse.balance ?? "0";
}

onMounted(() => {
  watch(account, () => void load(), { immediate: true });
});
</script>

<template>
  <section v-if="account" aria-label="个人社区数据" class="module person-info account-activity">
    <div class="module-panel">
      <ul class="status account-activity__metrics">
        <li>
          <AppLink :href="username ? `/member/${username}/following` : '/following'" class="account-activity__metric">
            <strong>{{ followingCount }}</strong>
            <span class="ft-gray">关注用户</span>
          </AppLink>
        </li>
        <li>
          <AppLink class="account-activity__metric" href="/collections">
            <strong>{{ collectedCount }}</strong>
            <span class="ft-gray">收藏帖子</span>
          </AppLink>
        </li>
        <li class="account-activity__liveness-cell" :aria-label="livenessLabel" :style="livenessStyle" role="img">
          <span class="account-activity__meter" aria-hidden="true">
            <span aria-hidden="true" class="account-activity__wave">
              <span class="account-activity__wave-layer account-activity__wave-layer--before"></span>
              <span class="account-activity__wave-layer account-activity__wave-layer--after"></span>
              <span class="account-activity__percent">{{ livenessPercent }}%</span>
            </span>
          </span>
        </li>
      </ul>
      <div class="account-activity__footer">
        <AppLink aria-label="快捷转账" class="account-activity__points" href="/settings/account">
          <Icon name="coin" />
          {{ balance }}
        </AppLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.account-activity__metrics {
  display: flex;
  margin: 0;
  padding: 0 0 0.8125rem;
  list-style: none;
}
.account-activity__metrics > li {
  flex: 1 1 0;
  overflow: hidden;
  min-width: 0;
  text-align: center;
}
.account-activity__metric {
  display: block;
  color: var(--text-color);
  text-align: center;
  text-decoration: none;
}
.account-activity__metric:hover,
.account-activity__metric:focus-visible {
  text-decoration: none;
}
.account-activity__metric:hover span,
.account-activity__metric:focus-visible span {
  color: var(--text-color);
}
.account-activity__metric:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
.account-activity__metric strong,
.account-activity__percent {
  font-variant-numeric: tabular-nums;
}
.account-activity__metric strong {
  font-size: 1.25rem;
}
.account-activity__metric span {
  display: block;
}
.account-activity__liveness-cell {
  display: flex;
  justify-content: center;
  padding-top: 0.375rem;
}
.account-activity__meter {
  position: relative;
  display: block;
  box-sizing: content-box;
  width: 3.125rem;
  height: 3.125rem;
  padding: 0.125rem;
  overflow: hidden;
  border: 0.125rem solid rgb(118 218 255);
  border-radius: 50%;
}
.account-activity__wave {
  position: absolute;
  display: block;
  width: 3.125rem;
  height: 3.125rem;
  overflow: hidden;
  border-radius: 42%;
  background: rgb(118 218 255);
  color: var(--text-color);
}
.account-activity__wave-layer {
  position: absolute;
  top: var(--account-activity-wave-top);
  left: 50%;
  width: 6.25rem;
  height: 6.25rem;
  border-radius: 35%;
  background: rgb(255 255 255 / 40%);
  transform: translate(-50%, -70%) rotate(0deg);
  animation: account-activity-wave 6s linear infinite;
  transition: top 1s;
}
.account-activity__wave-layer--after {
  border-radius: 45%;
  background: rgb(255 255 255 / 90%);
  animation-delay: -5s;
  animation-duration: 10s;
}
.account-activity__percent {
  position: relative;
  z-index: 1;
  display: flex;
  width: 3.125rem;
  height: 3.125rem;
  align-items: center;
  justify-content: center;
  color: rgb(118 218 255);
  text-shadow:
    0 1px #fff,
    1px 0 #fff,
    -1px 0 #fff,
    0 -1px #fff;
}
.account-activity__footer {
  display: flow-root;
}
.account-activity__points {
  float: right;
  color: var(--text-fade-color);
  line-height: 1.25rem;
  text-decoration: none;
}
.account-activity__points:hover,
.account-activity__points:focus-visible {
  color: var(--text-color);
  text-decoration: none;
}
.account-activity__points :deep(.icon) {
  width: 0.875rem;
  height: 0.875rem;
  color: currentcolor;
  vertical-align: -0.125rem;
}
@keyframes account-activity-wave {
  50% {
    transform: translate(-50%, -73%) rotate(180deg);
  }
  to {
    transform: translate(-50%, -70%) rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .account-activity__wave-layer {
    animation: none;
  }
}
</style>
