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
});

// TODO: 签到与活跃度后端接口尚未实现，先保持静态展示。
const checkedIn = ref(false);
const liveness = ref(0);

const statusText = computed(() => (checkedIn.value ? "今日已签到" : "今日未签到"));
const progressStyle = computed(() => ({ width: `${liveness.value}%` }));
const activityDesc = computed(() => {
  if (liveness.value < 10 && !checkedIn.value) return "今日活跃度到达 10% 后\n系统将自动签到";
  if (liveness.value < 10 && checkedIn.value) return "您的免签卡今日已生效";
  if (liveness.value >= 10 && !checkedIn.value) return "已提交自动签到至系统\n请稍候查看签到状态";
  if (liveness.value < 100) return "今日活跃度到达 100%\n可获免签卡&明日天降红包资格";
  return "礼物已放入背包，并获得明日天降红包资格！明天在线时如有新人注册，将获得天降红包";
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

function notifyRewardUnavailable() {
  message.info("昨日活跃奖励暂未开放");
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
              <div :class="{ 'activity-hub__status--warn': !checkedIn }" class="activity-hub__status">
                {{ statusText }}
              </div>
              <div class="activity-hub__status-tag">今日活跃进度</div>
            </header>
            <div class="activity-hub__progress-row">
              <div class="activity-hub__progress">
                <div :style="progressStyle" class="activity-hub__progress-done"></div>
              </div>
              <span class="activity-hub__progress-percent">{{ liveness }}%</span>
            </div>
            <p class="activity-hub__desc">{{ activityDesc }}</p>
          </article>
        </div>

        <div class="activity-hub__right">
          <div class="activity-hub__actions">
            <!-- TODO: 昨日活跃奖励后端接口尚未实现，先保留入口。 -->
            <button class="activity-hub__pill" type="button" @click="notifyRewardUnavailable">
              <div class="activity-hub__pill-icon">
                <img alt="昨日活跃奖励" src="https://file.fishpi.cn/2021/10/coin-2-70217cc1.png" />
              </div>
              <div class="activity-hub__pill-body">
                <div class="activity-hub__pill-title">昨日活跃奖励</div>
                <div class="activity-hub__pill-desc">一键领取·活跃积分</div>
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
