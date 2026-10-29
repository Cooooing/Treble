<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import type { GetCurrentHolidayResp } from "@bass/bbs-sdk-fetch/models/GetCurrentHolidayResp";
import { message } from "@/components/feedback/message";
import { currentAccount } from "@/services/sessionState";
import { bbsClient } from "@/utils/sdk";

const pageContext = usePageContext();
const account = computed(() => pageContext.user || currentAccount.value);
const holiday = ref<GetCurrentHolidayResp>();

onMounted(async () => {
  try {
    holiday.value = await bbsClient.holiday.getCurrent({ body: {} });
  } catch {
    holiday.value = undefined;
  }
  await loadLiveness();
});

const loadingLiveness = ref(false);
const liveness = ref(0);
const maxLiveness = ref(300);
const checkinScore = ref(30);
const rewardPoints = ref("0");
const claimingReward = ref(false);
const rewardFeedback = ref<"empty" | "success">();

const livenessPercent = computed(() => Math.min(100, Math.floor((liveness.value / maxLiveness.value) * 100)));
const checkinThreshold = computed(() => checkinScore.value);
const statusText = computed(() =>
  liveness.value >= checkinThreshold.value ? "已达到自动签到条件" : "今日未达到签到条件",
);
const progressStyle = computed(() => ({ width: `${livenessPercent.value}%` }));
const progressClass = computed(() => {
  if (livenessPercent.value >= 100) return "activity-hub__progress-done--complete";
  if (liveness.value >= checkinThreshold.value) return "activity-hub__progress-done--eligible";
  return "activity-hub__progress-done--pending";
});
const activityDesc = computed(() => {
  return "今日活跃度到达 10% 后\n系统将自动签到";
});
const rewardIcon = computed(() => {
  if (rewardFeedback.value === "success") return "https://file.fishpi.cn/2021/09/correct-1f5e3258.png";
  if (rewardFeedback.value === "empty") return "https://file.fishpi.cn/2025/12/notfound-d9c65204.png";
  return "https://file.fishpi.cn/2021/10/coin-2-70217cc1.png";
});
const rewardTitle = computed(() => {
  if (rewardFeedback.value === "success") return "昨日奖励已领取！";
  if (rewardFeedback.value === "empty") return "没有未领取奖励喔!";
  return "昨日活跃奖励";
});
const rewardDescription = computed(() => {
  if (rewardFeedback.value === "success") return `积分 +${rewardPoints.value}`;
  if (rewardFeedback.value === "empty") return "明天再来试试吧";
  return "一键领取·活跃积分";
});

const holidayLine1 = computed(() => {
  const info = holiday.value;
  if (!info?.type || info.type === "HOLIDAY_TYPE_UNSPECIFIED") return "距离放假还有 🎉";
  if (info.type === "HOLIDAY_TYPE_WORKDAY" || info.type === "HOLIDAY_TYPE_MAKEUP_WORKDAY") {
    if (info.daysToHoliday === 1) {
      return `今天提桶!<br>明天跑路!<br>${info.holidayName || "假期"}加载中...`;
    }
    if (info.type === "HOLIDAY_TYPE_MAKEUP_WORKDAY") {
      return `调休不摸🐟，天理难容！<br>距离${info.holidayName || "假期"}还有`;
    }
    return `摸 🐟 加油！<br>距离${info.holidayName || "假期"}还有`;
  }
  if (info.daysRemaining === 1) {
    return `😰 今天是${info.dayName || "假期"}<br><b>假期余额严重不足❗❗❗️</b>`;
  }
  return `${info.dayName || "假期"}快乐 🏖️<br><div>假期余额还有<b>${info.daysRemaining ?? 0}</b>天！</div>`;
});

const holidayLine2 = computed(() => {
  const info = holiday.value;
  if (!info?.type || info.type === "HOLIDAY_TYPE_UNSPECIFIED") {
    return '<span class="activity-hub__day">?</span><span class="activity-hub__day-unit">天</span>';
  }
  if (info.type === "HOLIDAY_TYPE_WORKDAY" || info.type === "HOLIDAY_TYPE_MAKEUP_WORKDAY") {
    if (info.daysToHoliday === 1) {
      return '<span style="font-size:20px;color:#0cc958;font-weight:bold;">🎉明天放假</span>';
    }
    return `<span class="activity-hub__day">${info.daysToHoliday ?? "?"}</span><span class="activity-hub__day-unit">天</span>`;
  }
  if (info.daysRemaining === 1) {
    return '<span style="font-size:19px;color:#c9320c;">明天上班 😭</span>';
  }
  return '<span style="font-size:19px;color:#63bf8a;">今日休息 ⛺️</span>';
});

async function loadLiveness() {
  if (!account.value) return;
  loadingLiveness.value = true;
  try {
    const response = await bbsClient.liveness.getLiveness();
    liveness.value = response.score ?? 0;
    maxLiveness.value = response.maxScore ?? 300;
    checkinScore.value = response.checkinScore ?? 30;
  } catch {
    message.error("活跃度加载失败，请稍后重试");
  } finally {
    loadingLiveness.value = false;
  }
}

async function claimYesterdayReward() {
  if (claimingReward.value || rewardFeedback.value) return;
  claimingReward.value = true;
  try {
    const response = await bbsClient.liveness.claimYesterdayReward({ body: {} });
    if (!response.claimed) {
      rewardFeedback.value = "empty";
      return;
    }
    rewardPoints.value = response.rewardPoints ?? "0";
    rewardFeedback.value = "success";
    message.success(`已领取昨日活跃奖励 ${rewardPoints.value} 积分`);
  } catch {
    rewardFeedback.value = "empty";
  } finally {
    claimingReward.value = false;
    window.setTimeout(() => {
      rewardFeedback.value = undefined;
    }, 2000);
  }
}
</script>

<template>
  <div v-if="account" class="home-module activity-hub-module" data-home-module="activity" data-home-title="活动">
    <div class="wrapper">
      <section aria-label="活动中心" class="activity-hub">
        <div class="activity-hub__left">
          <article class="activity-hub__card activity-hub__card--holiday">
            <div class="activity-hub__card-main">
              <div class="activity-hub__card-title" v-html="holidayLine1"></div>
            </div>
            <div class="activity-hub__card-main">
              <div class="activity-hub__card-subtitle" v-html="holidayLine2"></div>
            </div>
          </article>

          <article class="activity-hub__card activity-hub__card--liveness">
            <header class="activity-hub__card-header">
              <div :class="{ 'activity-hub__status--warn': liveness < checkinThreshold }" class="activity-hub__status">
                {{ statusText }}
              </div>
              <div class="activity-hub__status-tag">今日活跃进度</div>
            </header>
            <div class="activity-hub__progress-row">
              <div class="activity-hub__progress">
                <div :class="progressClass" :style="progressStyle" class="activity-hub__progress-done"></div>
              </div>
              <span class="activity-hub__progress-percent">{{ livenessPercent }}%</span>
            </div>
            <p class="activity-hub__desc">{{ activityDesc }}</p>
          </article>
        </div>

        <div class="activity-hub__right">
          <div class="activity-hub__actions">
            <button
              :class="{ 'activity-hub__pill--primary': !rewardFeedback }"
              :disabled="claimingReward"
              aria-label="领取昨日活跃奖励"
              class="activity-hub__pill"
              type="button"
              @click="claimYesterdayReward"
            >
              <div class="activity-hub__pill-icon">
                <img :class="{ cake: !rewardFeedback }" alt="昨日活跃奖励" :src="rewardIcon" />
              </div>
              <div class="activity-hub__pill-body">
                <div class="activity-hub__pill-title">{{ rewardTitle }}</div>
                <div class="activity-hub__pill-desc">{{ rewardDescription }}</div>
              </div>
            </button>

            <a class="activity-hub__pill" href="https://room.adventext.fun" rel="noopener" target="_blank">
              <div class="activity-hub__pill-icon">
                <img alt="摸鱼竞技大厅" src="https://file.fishpi.cn/2025/12/国际象棋游戏-56ff09e8.png" />
              </div>
              <div class="activity-hub__pill-body">
                <div class="activity-hub__pill-title">摸鱼竞技大厅</div>
                <div class="activity-hub__pill-desc">实时游戏房间·在线竞技</div>
              </div>
            </a>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.activity-hub-module {
  margin-top: 20px;
}

.activity-hub {
  display: flex;
  width: 100%;
  gap: 12px;
  align-items: stretch;
  padding: 6px 0;
  box-sizing: border-box;
}

.activity-hub__left {
  display: flex;
  flex: 1.2 1 0;
  gap: 12px;
  min-width: 0;
}

.activity-hub__right {
  display: flex;
  flex: 1.2 1 0;
  min-width: 0;
  align-items: stretch;
}

.activity-hub__card {
  position: relative;
  flex: 1 1 0;
  padding: 18px 28px 12px;
  overflow: hidden;
  border: 1px solid var(--color-border-strong);
  border-radius: 8px;
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-surface);
  box-sizing: border-box;
}

.activity-hub__card--holiday {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
}

.activity-hub__card--holiday::before {
  content: "";
  position: absolute;
  top: 0;
  left: -20%;
  width: 140%;
  height: 3px;
  background: linear-gradient(90deg, #e59230, #f97316, #fde68a);
  opacity: 0.85;
}

.activity-hub__card-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.activity-hub__card-title {
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
}

.activity-hub__card-subtitle {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.activity-hub__day {
  color: var(--color-text-strong);
  font-size: 33px;
  font-weight: 700;
  line-height: 1;
}

.activity-hub__day-unit {
  color: var(--color-text-muted);
  font-size: 14px;
}

.activity-hub__card--liveness {
  display: grid;
  min-height: 60px;
}

.activity-hub__card--liveness::before {
  content: "";
  position: absolute;
  top: 0;
  left: -25%;
  width: 150%;
  height: 3px;
  background: linear-gradient(90deg, #22c55e, #0ea5e9);
  opacity: 0.8;
}

.activity-hub__card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.activity-hub__status {
  color: var(--color-success);
  font-size: 13px;
  font-weight: 600;
}

.activity-hub__status--warn {
  color: var(--color-warning);
}

.activity-hub__status-tag {
  padding: 2px 8px;
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  background: var(--color-bg-muted);
  color: var(--color-text-muted);
  font-size: 11px;
}

.activity-hub__progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity-hub__progress {
  position: relative;
  flex: 1;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-bg-muted);
}

.activity-hub__progress-done {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #f11616, #d71212);
  transition: width 0.4s ease-out;
}

.activity-hub__progress-done--eligible {
  background: linear-gradient(90deg, #24b0b7, #1dacb3);
}

.activity-hub__progress-done--complete {
  background: linear-gradient(90deg, #29d120, #3caf36);
}

.activity-hub__progress-percent {
  min-width: 32px;
  color: var(--color-text-strong);
  font-size: 12px;
  text-align: right;
}

.activity-hub__desc {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-size: 11px;
  line-height: 1.4;
  white-space: pre-line;
}

.activity-hub__actions {
  display: flex;
  flex: 1 1 auto;
  width: 100%;
  gap: 10px;
  align-items: stretch;
  box-sizing: border-box;
}

.activity-hub__pill {
  position: relative;
  display: inline-flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--color-border-strong);
  border-radius: 10px;
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-surface);
  color: var(--color-text-strong);
  text-decoration: none;
  cursor: pointer;
  box-sizing: border-box;
  transition:
    background-color 0.16s ease-out,
    box-shadow 0.16s ease-out,
    transform 0.12s ease-out,
    border-color 0.16s ease-out;
}

.activity-hub__pill:focus {
  outline: none;
}

.activity-hub__pill:hover {
  border-color: var(--color-accent);
  background: var(--color-bg-hover);
  box-shadow: var(--shadow-overlay);
  transform: translateY(-1px);
}

.activity-hub__pill:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.activity-hub__pill:disabled:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-surface);
  transform: none;
}

.activity-hub__pill--primary {
  border-color: rgba(234, 179, 8, 0.75);
  background: linear-gradient(90deg, #fefce8, #fffbeb);
  opacity: 1;
}

.activity-hub__pill--primary:hover {
  border-color: rgba(234, 179, 8, 0.75);
  background: linear-gradient(90deg, #fef9c3, #fef3c7);
}

.activity-hub__pill-icon {
  display: flex;
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-bg-muted);
}

.activity-hub__pill-icon img {
  width: 22px;
  height: 22px;
  object-fit: cover;
}

.activity-hub__pill-icon img.cake {
  animation: activity-reward-swing 3s ease-in-out infinite;
  transform-origin: bottom;
}

@keyframes activity-reward-swing {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(9deg);
  }
  75% {
    transform: rotate(-9deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .activity-hub__progress-done,
  .activity-hub__pill,
  .activity-hub__pill-icon img.cake {
    animation: none;
    transition: none;
  }
}

.activity-hub__pill-body {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.activity-hub__pill-title {
  overflow: hidden;
  color: var(--color-text-strong);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-hub__pill-desc {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 11px;
  line-height: 1.3;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .activity-hub {
    flex-direction: column;
    gap: 10px;
  }
  .activity-hub__left,
  .activity-hub__right {
    flex: 1 1 auto;
  }
  .activity-hub__left {
    padding-left: 0;
  }
  .activity-hub__actions {
    justify-content: flex-start;
  }
  .activity-hub__pill {
    flex: 1 1 46%;
  }
}

@media (max-width: 720px) {
  .activity-hub__pill {
    flex: 1 1 100%;
  }
}
</style>
