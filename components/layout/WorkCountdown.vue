<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { message } from "@/components/feedback/message";
import {
  closeWorkCountdownSettings,
  openWorkCountdownSettings,
  workCountdownSettingsOpen,
} from "@/services/workCountdown";

const STORAGE_KEY = "count";

interface CountdownSettings {
  time: string;
  lunch: string;
  salary: string;
  startTime: string;
  status: "enabled" | "disabled";
  left?: number;
  top?: number;
}

interface CountdownDisplay {
  icon: string;
  time: string;
  salary: string;
}

const settings = reactive<CountdownSettings>({
  time: "1800",
  lunch: "1130",
  salary: "365",
  startTime: "0900",
  status: "enabled",
});
const display = reactive<CountdownDisplay>({ icon: "", time: "", salary: "" });
const form = reactive({
  status: "enabled",
  startTime: "09:00",
  time: "18:00",
  lunch: "11:30",
  salary: "365",
});
const floatElement = ref<HTMLElement | null>(null);
const defaultPosition = ref({ top: 78, right: 20 });

let timer: ReturnType<typeof setInterval> | undefined;
let lastInvokeTime = 0;
let dragState:
  | {
      startX: number;
      startY: number;
      originalLeft: number;
      originalTop: number;
      moved: boolean;
    }
  | undefined;

const visible = computed(() => settings.status !== "disabled");
const boxStyle = computed<Record<string, string>>(() => {
  if (Number.isFinite(settings.left) && Number.isFinite(settings.top)) {
    return {
      left: `${settings.left}px`,
      top: `${settings.top}px`,
    };
  }

  return {
    right: `${defaultPosition.value.right}px`,
    top: `${defaultPosition.value.top}px`,
  };
});

function toTimeInput(value: string): string {
  const parts = value.match(/\d{2}/g) || ["00", "00"];
  return `${parts[0] || "00"}:${parts[1] || "00"}`;
}

function getDefaultPosition() {
  const nav = document.querySelector<HTMLElement>(".nav");
  const navBottom = nav ? Math.ceil(nav.getBoundingClientRect().bottom) : 0;
  return {
    top: Math.max(20, navBottom + 12),
    right: 20,
  };
}

function persist() {
  const salary = settings.salary.trim();
  if (!/^\d+(\.\d+)?$/.test(salary)) settings.salary = "365";
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function loadSettings() {
  let stored: Partial<CountdownSettings> = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Partial<CountdownSettings>;
  } catch {
    // Keep the default settings when the stored value is malformed.
  }

  settings.time = stored.time || "1800";
  settings.lunch = stored.lunch || "1130";
  settings.salary = stored.salary || "365";
  settings.startTime = stored.startTime || "0900";
  settings.status = stored.status === "disabled" ? "disabled" : "enabled";

  if (
    Number.isFinite(stored.left) &&
    Number.isFinite(stored.top) &&
    Number(stored.left) >= 0 &&
    Number(stored.top) >= 0
  ) {
    settings.left = Number(stored.left);
    settings.top = Number(stored.top);
  } else {
    settings.left = undefined;
    settings.top = undefined;
  }

  persist();
}

function notify(type: number) {
  const now = Date.now();
  const remaining = 1000 - (now - lastInvokeTime);
  if (remaining > 0 && lastInvokeTime !== 0) return;
  lastInvokeTime = now;

  if (type === 1) message.success("中午咯，该吃饭啦～", { duration: 30_000 });
  if (type === 2) message.warning("马上就要下班啦，赶快收拾收拾吧～", { duration: 30_000 });
  if (type === 3) message.success("下班了！下班了！下班了！！！", { duration: 30_000 });
  if (type === 4) message.success(`下班啦！今天你赚了￥${settings.salary}！`, { duration: 30_000 });
}

function formatTime(hour: number, minute: number, second: number): string {
  return [hour, minute, second].map((value) => String(value).padStart(2, "0")).join(":");
}

function dateFromHHMM(value: string, dateString: string): Date {
  const parts = value.match(/\d{2}/g) || ["00", "00"];
  return new Date(`${dateString} ${parts[0]}:${parts[1]}:00`);
}

function generate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;

  const endDate = dateFromHHMM(settings.time, dateString);
  const startDate = dateFromHHMM(settings.startTime, dateString);
  const lunchDate = dateFromHHMM(settings.lunch, dateString);

  const lunchMs = lunchDate.getTime() - now.getTime();
  const lunchHour = Math.floor((lunchMs / 3_600_000) % 24);
  const lunchMinute = Math.floor((lunchMs / 60_000) % 60);
  const lunchSecond = Math.floor((lunchMs / 1000) % 60);

  const workMs = endDate.getTime() - now.getTime();
  const workHour = Math.floor((workMs / 3_600_000) % 24);
  const workMinute = Math.floor((workMs / 60_000) % 60);
  const workSecond = Math.floor((workMs / 1000) % 60);

  const salary = Number(settings.salary);
  const totalWorkMs = endDate.getTime() - startDate.getTime();
  const totalWorkSeconds = Math.floor(totalWorkMs / 1000);
  const salaryPerMs = totalWorkSeconds > 0 ? salary / totalWorkSeconds / 1000 : 0;
  const earned = ((now.getTime() - startDate.getTime()) * salaryPerMs).toFixed(3);

  if (lunchHour === 0 && lunchMinute >= 0 && lunchSecond >= 0) {
    display.icon = "🍲";
    display.time = formatTime(lunchHour, lunchMinute, lunchSecond);
    display.salary = "";
    if (lunchHour === 0 && lunchMinute === 0 && lunchSecond === 0) notify(1);
    return;
  }

  if (workHour >= 0 && workMinute >= 0 && workSecond >= 0) {
    display.icon = "🧑‍💻💭";
    display.time = formatTime(workHour, workMinute, workSecond);
    display.salary = salary > 0 ? `💰 ${earned}` : "";

    if (workHour === 0 && workMinute === 2 && workSecond === 0) notify(2);
    if (workHour === 0 && workMinute === 0 && workSecond === 0) {
      notify(salary <= 0 ? 3 : 4);
    }
    return;
  }

  if (lunchHour < 0 && lunchMinute < 0 && lunchSecond < 0) {
    display.icon = "🎉";
    display.time = salary > 0 ? "今日收入" : "下班时间到";
    display.salary = salary > 0 ? `￥${salary}` : "";
    stopTimer();
  }
}

function startTimer() {
  generate();
  timer = setInterval(generate, 100);
}

function stopTimer() {
  if (!timer) return;
  clearInterval(timer);
  timer = undefined;
}

function openSettings() {
  form.status = settings.status;
  form.startTime = toTimeInput(settings.startTime);
  form.time = toTimeInput(settings.time);
  form.lunch = toTimeInput(settings.lunch);
  form.salary = settings.salary;
}

function saveSettings() {
  settings.startTime = form.startTime.replace(":", "");
  settings.time = form.time.replace(":", "");
  settings.lunch = form.lunch.replace(":", "");
  settings.salary = form.salary;
  settings.status = form.status === "disabled" ? "disabled" : "enabled";
  persist();
  closeWorkCountdownSettings();
  stopTimer();
  if (settings.status !== "disabled") startTimer();
}

function onBoxMouseDown(event: MouseEvent) {
  if (event.button !== 0 || !floatElement.value) return;

  const rect = floatElement.value.getBoundingClientRect();
  dragState = {
    startX: event.clientX,
    startY: event.clientY,
    originalLeft: rect.left,
    originalTop: rect.top,
    moved: false,
  };
  document.addEventListener("mousemove", onBoxMouseMove);
  document.addEventListener("mouseup", onBoxMouseUp);
  event.preventDefault();
}

function onBoxMouseMove(event: MouseEvent) {
  if (!dragState || !floatElement.value) return;

  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;
  if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) dragState.moved = true;

  const maxLeft = Math.max(0, window.innerWidth - floatElement.value.offsetWidth);
  const maxTop = Math.max(0, window.innerHeight - floatElement.value.offsetHeight);
  settings.left = Math.max(0, Math.min(maxLeft, dragState.originalLeft + deltaX));
  settings.top = Math.max(0, Math.min(maxTop, dragState.originalTop + deltaY));
  persist();
}

function onBoxMouseUp() {
  document.removeEventListener("mousemove", onBoxMouseMove);
  document.removeEventListener("mouseup", onBoxMouseUp);
  const wasClick = dragState && !dragState.moved;
  dragState = undefined;
  if (wasClick) openWorkCountdownSettings();
}

watch(workCountdownSettingsOpen, (open) => {
  if (open) openSettings();
});

onMounted(() => {
  loadSettings();
  defaultPosition.value = getDefaultPosition();
  if (settings.status !== "disabled") startTimer();
});

onBeforeUnmount(() => {
  stopTimer();
  document.removeEventListener("mousemove", onBoxMouseMove);
  document.removeEventListener("mouseup", onBoxMouseUp);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" id="timeContent" ref="floatElement" class="countdown-float" :style="boxStyle">
      <a id="countRemainBox" class="countdown-box" @mousedown="onBoxMouseDown">
        <span v-if="display.icon" class="count-icons">{{ display.icon }}</span>
        <span v-if="display.time" class="count-time">{{ display.time }}</span>
        <span v-if="display.salary" class="count-salary">{{ display.salary }}</span>
      </a>
    </div>

    <div
      v-if="workCountdownSettingsOpen"
      class="count-settings-backdrop"
      role="presentation"
      @mousedown.self="closeWorkCountdownSettings"
    >
      <section aria-label="下班倒计时设置" aria-modal="true" class="count-settings-modal" role="dialog">
        <h2>下班倒计时设置</h2>
        <label>
          <span class="label-title">状态</span>
          <select v-model="form.status">
            <option value="enabled">开启</option>
            <option value="disabled">关闭</option>
          </select>
        </label>
        <label>
          <span class="label-title">上班时间 (用于计算日薪)</span>
          <input v-model="form.startTime" type="time" />
        </label>
        <label>
          <span class="label-title">下班时间</span>
          <input v-model="form.time" type="time" />
        </label>
        <label>
          <span class="label-title">午饭时间</span>
          <input v-model="form.lunch" type="time" />
        </label>
        <label>
          <span class="label-title">你的日薪 (设置为0则不显示)</span>
          <input v-model="form.salary" min="0" step="0.01" type="number" />
        </label>
        <div class="modal-actions">
          <button type="button" @click="saveSettings">保存</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.countdown-float {
  position: fixed;
  z-index: 31;
  pointer-events: auto;
}

.countdown-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 110px;
  height: 80px;
  background: rgba(248, 250, 252, 0.1);
  border-radius: 16px;
  box-shadow:
    0 6px 24px rgba(60, 80, 120, 0.12),
    0 1.5px 6px rgba(60, 80, 120, 0.08);
  font-family: "Segoe UI", "PingFang SC", "Arial", sans-serif;
  color: #222;
  transition:
    box-shadow 0.3s,
    transform 0.2s;
  cursor: grab;
  user-select: none;
  overflow: hidden;
  border: 1px solid #e0e7ef;
  backdrop-filter: blur(8px);
  position: relative;
  text-decoration: none !important;
  box-sizing: border-box;
}

.countdown-box:hover {
  box-shadow:
    0 12px 32px rgba(60, 80, 120, 0.16),
    0 2px 8px rgba(60, 80, 120, 0.1);
  transform: translateY(-2px) scale(1.04);
  text-decoration: none !important;
}

.countdown-box * {
  text-decoration: none !important;
}

.count-icons {
  font-size: 1em;
  line-height: 1;
  letter-spacing: 2px;
}

.count-time {
  margin-top: 3px;
  font-size: 1.18em;
  font-weight: 600;
  color: #222;
  text-shadow: 0 1px 2px rgba(60, 80, 120, 0.08);
  line-height: 1.2;
}

.count-salary {
  margin-top: 5px;
  font-size: 1.15em;
  font-weight: 600;
  color: #22c55e;
  text-shadow: 0 1px 2px rgba(34, 197, 94, 0.08);
  line-height: 1.2;
}

.count-settings-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.28);
  box-sizing: border-box;
}

.count-settings-modal {
  width: min(500px, 100%);
  background: rgba(255, 255, 255, 0.88);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 32px 24px;
  font-family: "Segoe UI", "PingFang SC", "Arial", sans-serif;
  animation: modalFadeIn 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  box-sizing: border-box;
  backdrop-filter: blur(12px);
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.count-settings-modal h2 {
  margin: 0 0 18px;
  color: #222;
  font-size: 1.3em;
  font-weight: 600;
  text-align: center;
  letter-spacing: 1px;
}

.count-settings-modal label {
  display: block;
  margin-bottom: 18px;
  color: #555;
  font-size: 1em;
}

.count-settings-modal .label-title {
  display: block;
  margin-bottom: 6px;
  color: #888;
  font-size: 0.98em;
}

.count-settings-modal input,
.count-settings-modal select {
  width: 100%;
  margin-bottom: 2px;
  padding: 8px 14px;
  border: 1px solid #e0e7ef;
  border-radius: 8px;
  box-sizing: border-box;
  background: #f8fafc;
  font-size: 1em;
  transition: border-color 0.2s;
}

.count-settings-modal input:focus,
.count-settings-modal select:focus {
  border-color: #22c55e;
  outline: none;
}

.count-settings-modal .modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.count-settings-modal button {
  padding: 10px 24px;
  border: 1px solid #22c55e;
  border-radius: 8px;
  background: #22c55e;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.08);
  color: #fff;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s;
}

.count-settings-modal button:hover {
  border-color: #16a34a;
  background: #16a34a;
}
</style>
