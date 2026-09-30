<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{
  disabled?: boolean;
  scheduled?: boolean;
}>();

const emit = defineEmits<{
  schedule: [scheduledAt: Date];
  cancel: [];
}>();

const open = ref(false);
const root = ref<HTMLElement>();
const year = ref("");
const month = ref("");
const day = ref("");
const hour = ref("");
const minute = ref("");
const confirmationValidationMessage = ref("");

function minimumAt(now: Date) {
  // 输入精度为分钟，因此向上取整，确保最小时间与当前时刻实际相隔不少于五分钟。
  return new Date(Math.ceil((now.getTime() + 5 * 60_000) / 60_000) * 60_000);
}

function maximumAt(now: Date) {
  const value = new Date(now);
  value.setMonth(value.getMonth() + 3);
  return value;
}

const selectedAt = computed(() => {
  const values = [year.value, month.value, day.value, hour.value, minute.value].map(Number);
  if (values.some((value) => !Number.isInteger(value))) return undefined;
  const [selectedYear, selectedMonth, selectedDay, selectedHour, selectedMinute] = values;
  if (
    selectedYear < 1 ||
    selectedYear > 9999 ||
    selectedMonth < 1 ||
    selectedMonth > 12 ||
    selectedDay < 1 ||
    selectedDay > daysInMonth(selectedYear, selectedMonth) ||
    selectedHour < 0 ||
    selectedHour > 23 ||
    selectedMinute < 0 ||
    selectedMinute > 59
  )
    return undefined;
  return createLocalDate(selectedYear, selectedMonth, selectedDay, selectedHour, selectedMinute);
});

// 只验证日历字段自身，不混入定时发布的业务时间窗口。
const dateValidationMessage = computed(() => (selectedAt.value ? "" : "请输入有效的日期和时间"));

// 每次业务校验均创建新的当前时间；不可复用打开面板时的时间基准。
function scheduleWindowMessage(value: Date | undefined) {
  if (!value) return "";
  const now = new Date();
  if (value < minimumAt(now)) return "发布时间需至少在 5 分钟后";
  if (value > maximumAt(now)) return "发布时间不能超过 3 个月";
  return "";
}

function validationMessageFor(value: Date | undefined) {
  if (!value) return "请输入有效的日期和时间";
  return scheduleWindowMessage(value);
}

const validationMessage = computed(() => dateValidationMessage.value || scheduleWindowMessage(selectedAt.value));
const displayValidationMessage = computed(() => confirmationValidationMessage.value || validationMessage.value);

const selectedText = computed(() => {
  const value = selectedAt.value;
  if (!value || validationMessage.value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
});

function setDate(value: Date) {
  year.value = String(value.getFullYear());
  month.value = String(value.getMonth() + 1);
  day.value = String(value.getDate());
  hour.value = String(value.getHours());
  minute.value = String(value.getMinutes());
}

function daysInMonth(selectedYear: number, selectedMonth: number) {
  if (selectedMonth === 2)
    return selectedYear % 4 === 0 && (selectedYear % 100 !== 0 || selectedYear % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(selectedMonth) ? 30 : 31;
}

function createLocalDate(
  selectedYear: number,
  selectedMonth: number,
  selectedDay: number,
  selectedHour: number,
  selectedMinute: number,
) {
  const value = new Date(0);
  value.setFullYear(selectedYear, selectedMonth - 1, selectedDay);
  value.setHours(selectedHour, selectedMinute, 0, 0);
  return value;
}

type TimePart = "year" | "month" | "day" | "hour" | "minute";

function fieldValue(part: TimePart) {
  return { year, month, day, hour, minute }[part];
}

function fieldMaximum(part: TimePart) {
  switch (part) {
    case "year":
      return 9999;
    case "month":
      return 12;
    case "day": {
      const selectedYear = Number(year.value) || new Date().getFullYear();
      const selectedMonth = Number(month.value) || 1;
      return daysInMonth(selectedYear, selectedMonth);
    }
    case "hour":
      return 23;
    case "minute":
      return 59;
  }
}

function fieldMinimum(part: TimePart) {
  switch (part) {
    case "year":
    case "month":
    case "day":
      return 1;
    case "hour":
    case "minute":
      return 0;
  }
}

// 字段边界只保证时间格式合法；计划时间距当前时间的业务限制由 validationMessage 单独判断。
function limitField(part: TimePart, event?: Event) {
  confirmationValidationMessage.value = "";
  const target = fieldValue(part);
  const input = event?.target instanceof HTMLInputElement ? event.target : undefined;
  const digits = (input?.value ?? target.value).replace(/\D/g, "");
  if (!digits) {
    target.value = "";
    return;
  }
  target.value = String(Math.max(fieldMinimum(part), Math.min(Number(digits), fieldMaximum(part))));
  if (input) input.value = target.value;
  if (part === "year" || part === "month") limitField("day");
}

function openPicker() {
  confirmationValidationMessage.value = "";
  if (!selectedAt.value) setDate(minimumAt(new Date()));
  open.value = true;
}

function selectShortcut(minutes: number) {
  confirmationValidationMessage.value = "";
  const value = new Date(Date.now() + minutes * 60_000);
  value.setSeconds(0, 0);
  setDate(value);
}

function confirm() {
  const value = selectedAt.value;
  // 用户停留在面板期间，当前时间会持续变化；提交前必须以新时间再次校验。
  const message = validationMessageFor(value);
  if (!value || message) {
    confirmationValidationMessage.value = message;
    return;
  }
  emit("schedule", value);
  open.value = false;
}

function closeWhenClickOutside(event: MouseEvent) {
  if (open.value && root.value && event.target instanceof Node && !root.value.contains(event.target))
    open.value = false;
}

onMounted(() => document.addEventListener("mousedown", closeWhenClickOutside));
onBeforeUnmount(() => document.removeEventListener("mousedown", closeWhenClickOutside));
</script>

<template>
  <div ref="root" class="scheduled-publish">
    <button
      v-if="!scheduled"
      :aria-expanded="open"
      :disabled="disabled"
      aria-controls="scheduledPublishPanel"
      class="article-draft-action"
      type="button"
      @click="open ? (open = false) : openPicker()"
    >
      定时发布
    </button>
    <button v-else :disabled="disabled" class="article-draft-action" type="button" @click="openPicker">修改定时</button>
    <button v-if="scheduled" :disabled="disabled" class="article-draft-action" type="button" @click="emit('cancel')">
      取消定时
    </button>

    <section v-if="open" id="scheduledPublishPanel" aria-label="设置定时发布时间" class="scheduled-publish__panel">
      <div class="scheduled-publish__heading">
        <strong>定时发布</strong>
      </div>
      <p>文章会以当前草稿内容在指定时间公开发布。</p>
      <div aria-label="快捷时间" class="scheduled-publish__shortcuts">
        <button :disabled="disabled" type="button" @click="selectShortcut(30)">30 分钟后</button>
        <button :disabled="disabled" type="button" @click="selectShortcut(60)">1 小时后</button>
        <button :disabled="disabled" type="button" @click="selectShortcut(24 * 60)">明天此时</button>
      </div>
      <div aria-label="编辑定时发布时间" class="scheduled-publish__editor">
        <input
          :disabled="disabled"
          :value="year"
          aria-label="年份"
          inputmode="numeric"
          @blur="limitField('year', $event)"
          @input="limitField('year', $event)"
        />
        <span>年</span>
        <input
          :disabled="disabled"
          :value="month"
          aria-label="月份"
          inputmode="numeric"
          @blur="limitField('month', $event)"
          @input="limitField('month', $event)"
        />
        <span>月</span>
        <input
          :disabled="disabled"
          :value="day"
          aria-label="日期"
          inputmode="numeric"
          @blur="limitField('day', $event)"
          @input="limitField('day', $event)"
        />
        <span>日</span>
        <input
          :disabled="disabled"
          :value="hour"
          aria-label="小时"
          inputmode="numeric"
          @blur="limitField('hour', $event)"
          @input="limitField('hour', $event)"
        />
        <span>时</span>
        <input
          :disabled="disabled"
          :value="minute"
          aria-label="分钟"
          inputmode="numeric"
          @blur="limitField('minute', $event)"
          @input="limitField('minute', $event)"
        />
        <span>分</span>
      </div>
      <div class="scheduled-publish__footer">
        <p v-if="displayValidationMessage" class="scheduled-publish__validation" role="status">
          {{ displayValidationMessage }}
        </p>
        <p v-else-if="selectedText" class="scheduled-publish__summary">将于 {{ selectedText }} 发布</p>
        <button :disabled="disabled || Boolean(validationMessage)" class="green" type="button" @click="confirm">
          确认定时
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.scheduled-publish {
  position: relative;
  display: flex;
  gap: 8px;
}
.scheduled-publish__panel {
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: calc(100% + 10px);
  width: min(360px, calc(100vw - 32px));
  padding: 16px;
  border: 1px solid var(--layer-border-color);
  border-radius: 4px;
  background: var(--layer-background-color);
  color: var(--text-color);
}
.scheduled-publish__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.scheduled-publish__heading strong {
  font-size: 15px;
}
.scheduled-publish__panel p {
  margin: 8px 0 0;
  color: var(--text-fade-color);
  font-size: 13px;
  line-height: 1.55;
}
.scheduled-publish__shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
.scheduled-publish__shortcuts button {
  padding: 5px 8px;
  border: 1px solid var(--layer-border-color);
  border-radius: 3px;
  background: transparent;
  color: var(--text-fade-color);
  font-size: 12px;
}
.scheduled-publish__shortcuts button:not(:disabled):hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
}
.scheduled-publish__editor {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  margin-top: 16px;
  color: var(--text-fade-color);
  font-size: 13px;
}
.scheduled-publish__editor input {
  box-sizing: border-box;
  min-height: 34px;
  padding: 0 5px;
  border: 1px solid var(--layer-border-color);
  border-radius: 3px;
  background: var(--background-color);
  color: var(--text-color);
  text-align: center;
  font: inherit;
}
.scheduled-publish__editor input:nth-of-type(1) {
  width: 58px;
}
.scheduled-publish__editor input:nth-of-type(n + 2) {
  width: 38px;
}
.scheduled-publish__validation {
  color: var(--red-color, #c44747) !important;
}
.scheduled-publish__summary {
  color: var(--primary-color) !important;
}
.scheduled-publish__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
.scheduled-publish__footer button {
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 12px;
}
.scheduled-publish__footer p {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}
@media (max-width: 640px) {
  .scheduled-publish__panel {
    position: fixed;
    right: 16px;
    bottom: 16px;
    left: 16px;
    width: auto;
  }
}
</style>
