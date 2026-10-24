<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import RichTextEditor from "@/components/content/RichTextEditor.vue";
import EmojiPicker from "@/components/content/EmojiPicker.vue";
import Avatar from "@/components/identity/Avatar.vue";
import MemberLink from "@/components/identity/MemberLink.vue";
import ClientOnly from "@/components/ui/ClientOnly.vue";
import Icon from "@/components/ui/Icon.vue";
import EmptyState from "@/components/feedback/EmptyState.vue";
import { message } from "@/components/feedback/message";
import { getRealtimeConnection, getRealtimeNodeUrl, type RealtimeTicket } from "@/services/realtime";
import { currentAccount } from "@/services/sessionState";
import { useChatTimeline } from "@/services/chatTimeline";
import { bbsClient } from "@/utils/sdk";
import { createClientIdentifier } from "@/utils/sdk/shared";
import { loadVditorAssets } from "@/utils/vditorAssets";

type GlobalMessage = {
  id?: string;
  senderId?: string;
  sender?: OnlineMember;
  content?: string;
  html?: string;
  bubbleStyle?: string;
  messageType?: string;
  revoked?: boolean;
  createdAt?: Date;
};
type OnlineMember = {
  userId?: string;
  name?: string;
  nickname?: string;
  avatarUrl?: string;
};
type GlobalChatMessageEvent = {
  message_id?: string;
  sender_id?: string;
  message_type?: string;
  content?: string;
  created_at?: string;
};
type GlobalChatBarrageEvent = {
  barrage_id?: string;
  user_id?: string;
  content?: string;
  created_at?: string;
};
type GlobalChatBarrage = {
  id: string;
  userId: string;
  content: string;
  sender?: OnlineMember;
  lane: number;
};

const rows = ref<GlobalMessage[]>([]);
const content = ref("");
const loading = ref(false);
const loadingOlder = ref(false);
const onlineMembers = ref<OnlineMember[]>([]);
const onlineTotal = ref("0");
const barrages = ref<GlobalChatBarrage[]>([]);
const hasOlder = ref(true);
const topic = ref("");
const pageContext = usePageContext();
const timeline = ref<HTMLElement>();
const timelineContent = ref<HTMLElement>();
const editor = ref<InstanceType<typeof RichTextEditor>>();
const emojiTrigger = ref<HTMLButtonElement>();
const emojiPickerOpen = ref(false);
let emojiCloseTimer: ReturnType<typeof setTimeout> | undefined;
let emojiDragging = false;
const isLoggedIn = computed(() => Boolean(pageContext.user || currentAccount.value));
let unsubscribe: (() => void) | undefined;
let unsubscribeBarrage: (() => void) | undefined;
let realtimeStarted = false;
let barrageLane = 0;
const barrageTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pageSize = 50;
const guestPageSize = 20;
const maximumLoadedMessages = 300;
const topicInputMarker = "\u00A0";
const sideWidth = ref(20);
const composerHeight = ref(28);
const sendShortcut = ref<"ctrl-enter" | "enter">("ctrl-enter");
const shortcutMenuOpen = ref(false);
const topicEditorOpen = ref(false);
const topicDraft = ref("");
const topicSaving = ref(false);
const barrageEditorOpen = ref(false);
const barrageDraft = ref("");
const barrageSending = ref(false);
const barrageInput = ref<HTMLInputElement>();
const barrageControl = ref<HTMLElement>();
const now = ref(new Date());
let clockTimer: ReturnType<typeof setInterval> | undefined;
let markdownConverter: Promise<typeof import("vditor").default> | undefined;
const {
  pendingMessages,
  handleScroll: handleTimelinePosition,
  prepareAppend,
  preserveHistoryPosition,
  recordPendingMessage,
  scrollToLatest,
  settleAppendedMessage,
  settleInitialRender,
} = useChatTimeline(timeline, timelineContent);

const chatStyle = computed(() => ({
  "--global-chat-side-width": `${sideWidth.value}%`,
  "--global-chat-composer-height": `${composerHeight.value}%`,
}));
const isCurfew = computed(() => {
  const hours = now.value.getHours();
  const minutes = now.value.getMinutes();
  return hours < 8 || hours > 19 || (hours === 19 && minutes >= 30);
});
const topicLabel = computed(() => topic.value || "暂未设置话题");

async function loadMessages(beforeId?: string) {
  const isOlderPage = Boolean(beforeId);
  if (isOlderPage) loadingOlder.value = true;
  else loading.value = true;

  const scrollHeight = timeline.value?.scrollHeight || 0;
  const scrollTop = timeline.value?.scrollTop || 0;
  try {
    const response = await bbsClient.globalChat.listGlobalChatMessages({
      listGlobalChatMessagesReq: {
        beforeId,
        page: { page: "1", size: isLoggedIn.value ? String(pageSize) : String(guestPageSize) },
      },
    });
    const nextRows = await renderMessages([...(response.rows || [])].reverse());
    if (isOlderPage) {
      const existingIDs = new Set(rows.value.map((row) => row.id));
      rows.value.unshift(...nextRows.filter((row) => row.id && !existingIDs.has(row.id)));
      hasOlder.value = nextRows.length === pageSize;
      await preserveHistoryPosition(scrollHeight, scrollTop);
    } else {
      rows.value = nextRows;
      hasOlder.value = nextRows.length === (isLoggedIn.value ? pageSize : guestPageSize);
      await settleInitialRender();
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : "聊天室消息加载失败");
  } finally {
    if (isOlderPage) loadingOlder.value = false;
    else loading.value = false;
  }
}

async function loadOnlineMembers() {
  try {
    const response = await bbsClient.globalChat.listGlobalChatOnlineMembers({
      body: {},
    });
    onlineMembers.value = response.rows || [];
    onlineTotal.value = String(onlineMembers.value.length);
  } catch (error) {
    message.error(error instanceof Error ? error.message : "在线成员加载失败");
  }
}

async function loadTopic() {
  try {
    const response = await bbsClient.globalChat.getGlobalChatTopic({ body: {} });
    topic.value = response.topic?.content?.trim() || "";
  } catch (error) {
    message.error(error instanceof Error ? error.message : "聊天室话题加载失败");
  }
}

async function resolveRealtimeSender(userID: string) {
  await loadOnlineMembers();
  return onlineMembers.value.find((member) => member.userId === userID);
}

function showBarrage(barrage: Omit<GlobalChatBarrage, "lane">) {
  if (barrages.value.some((item) => item.id === barrage.id)) return;
  const item = { ...barrage, lane: barrageLane++ % 6 };
  barrages.value.push(item);
  const timer = setTimeout(() => {
    barrages.value = barrages.value.filter((current) => current.id !== item.id);
    barrageTimers.delete(item.id);
  }, 16_000);
  barrageTimers.set(item.id, timer);
}

function displayName(member: OnlineMember) {
  return member.nickname?.trim() ? `${member.nickname}(${member.name})` : member.name || "未知用户";
}

function messageSender(row: GlobalMessage) {
  return (
    row.sender ||
    onlineMembers.value.find((member) => member.userId === row.senderId) || {
      userId: row.senderId,
      name: `用户 ${row.senderId}`,
    }
  );
}

function isOwnMessage(row: GlobalMessage) {
  const userID = pageContext.user?.profile?.id || currentAccount.value?.profile?.id;
  return userID !== undefined && String(userID) === row.senderId;
}

function loadOlderMessages() {
  const firstMessageID = rows.value[0]?.id;
  if (!isLoggedIn.value || !hasOlder.value || loadingOlder.value || !firstMessageID) return;
  void loadMessages(firstMessageID);
}

function handleTimelineScroll() {
  const element = timeline.value;
  if (!element) return;
  if (element.scrollTop <= 0) loadOlderMessages();
  handleTimelinePosition();
}

async function renderMessages(messages: GlobalMessage[]) {
  try {
    await loadVditorAssets();
    if (!markdownConverter) markdownConverter = import("vditor").then((module) => module.default);
    const vditor = await markdownConverter;
    return Promise.all(
      messages.map(async (row) => {
        if (!row.content || row.revoked || row.messageType === "IM_MESSAGE_TYPE_RED_PACKET") return row;
        return { ...row, html: await vditor.md2html(row.content, { anchor: 1 }) };
      }),
    );
  } catch {
    return messages;
  }
}

async function appendMessage(row: GlobalMessage, forceFollow = false) {
  if (!row.id) return;
  if (rows.value.some((item) => item.id === row.id)) {
    if (forceFollow) scrollToLatest();
    return;
  }
  const [renderedRow] = await renderMessages([row]);
  const followedLatest = prepareAppend(forceFollow);
  rows.value.push(renderedRow);
  if (rows.value.length > maximumLoadedMessages) rows.value.splice(0, rows.value.length - maximumLoadedMessages);
  if (followedLatest) {
    await settleAppendedMessage(true);
  } else {
    recordPendingMessage();
  }
}

async function send() {
  const value = (editor.value?.getValue() || content.value).replaceAll(topicInputMarker, "").trim();
  if (!value) {
    message.warning("请输入消息内容。");
    return;
  }
  if (value.length > 4096) {
    message.warning("消息不能超过 4096 个字符。");
    return;
  }
  editor.value?.setValue("");
  content.value = "";
  try {
    const response = await bbsClient.globalChat.sendGlobalChatMessage({
      sendGlobalChatMessageReq: { clientMessageId: createClientIdentifier(), content: value },
    });
    if (response.message) await appendMessage(response.message, true);
  } catch (error) {
    if (!(editor.value?.getValue() || content.value).trim()) {
      editor.value?.setValue(value);
      content.value = value;
    }
    message.error(error instanceof Error ? error.message : "消息发送失败");
  }
}

function unavailable(feature: string) {
  message.info(`${feature}功能正在接入。`);
}

async function toggleBarrageEditor() {
  barrageEditorOpen.value = !barrageEditorOpen.value;
  if (!barrageEditorOpen.value) return;
  barrageDraft.value = "";
  await nextTick();
  barrageInput.value?.focus();
}

function closeBarrageEditor() {
  barrageEditorOpen.value = false;
}

function closeBarrageEditorOnBlur(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && barrageControl.value?.contains(event.relatedTarget)) return;
  closeBarrageEditor();
}

async function sendBarrage() {
  const content = barrageDraft.value.trim();
  if (!content) {
    message.warning("请输入弹幕内容。");
    return;
  }
  if (Array.from(content).length > 32) {
    message.warning("弹幕不能超过 32 个字符。");
    return;
  }
  if (barrageSending.value) return;
  barrageSending.value = true;
  try {
    await bbsClient.globalChat.sendGlobalChatBarrage({
      sendGlobalChatBarrageReq: {
        clientRequestId: createClientIdentifier(),
        content,
      },
    });
    barrageDraft.value = "";
    barrageInput.value?.focus();
    message.success("弹幕已发射。");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "弹幕发送失败");
  } finally {
    barrageSending.value = false;
  }
}

function insertEmoji(markdown: string) {
  if (!markdown) return;
  const current = editor.value?.getValue() || content.value;
  const value = `${current}${current ? "\n" : ""}${markdown}`;
  content.value = value;
  editor.value?.setValue(value);
  editor.value?.focus();
}

function openEmojiPicker() {
  if (emojiCloseTimer) clearTimeout(emojiCloseTimer);
  emojiPickerOpen.value = true;
}

function closeEmojiPickerLater() {
  if (emojiDragging) return;
  if (emojiCloseTimer) clearTimeout(emojiCloseTimer);
  emojiCloseTimer = setTimeout(() => (emojiPickerOpen.value = false), 600);
}

function beginEmojiDrag() {
  emojiDragging = true;
  if (emojiCloseTimer) clearTimeout(emojiCloseTimer);
}

function endEmojiDrag() {
  emojiDragging = false;
  closeEmojiPickerLater();
}

function imageHashFromMessage(content?: string) {
  const match = content?.trim().match(/^!\[[^\]]*]\(([^\s)]+)(?:\s+"[^"]*")?\)$/);
  if (!match) return;
  try {
    return new URL(match[1]).pathname.match(/([a-f0-9]{64})$/i)?.[1]?.toLowerCase();
  } catch {
    return;
  }
}

async function addMessageEmoji(row: GlobalMessage) {
  const hash = imageHashFromMessage(row.content);
  if (!hash) return;
  try {
    const asset = await bbsClient.asset.completeMarkdownImageUpload({ completeMarkdownImageUploadReq: { hash } });
    if (!asset.assetId) throw new Error("图片资产不可用。");
    await bbsClient.emoji.addItem({ addEmojiItemReq: { assetId: asset.assetId, name: "" } });
    message.success("已添加到默认分组。");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "添加表情失败");
  }
}

function openTopicEditor() {
  topicDraft.value = topic.value;
  topicEditorOpen.value = true;
}

async function quoteTopic() {
  const quote = `\n\n*\`# ${topicLabel.value} #\`*  `;
  const history = content.value;
  const input = history || topicInputMarker;
  const value = `${input}${quote}`;
  content.value = value;
  await nextTick();
  editor.value?.setValueAndFocus(value, input.length);
}

async function submitTopicEditor() {
  const value = topicDraft.value.trim();
  if (!value) {
    message.warning("请输入话题内容。");
    return;
  }
  if (value.length > 64) {
    message.warning("话题不能超过 64 个字符。");
    return;
  }
  if (topicSaving.value) return;
  topicSaving.value = true;
  try {
    const response = await bbsClient.globalChat.setGlobalChatTopic({
      setGlobalChatTopicReq: { clientRequestId: createClientIdentifier(), content: value },
    });
    topic.value = response.topic?.content?.trim() || value;
    topicEditorOpen.value = false;
    message.success("话题设置成功。");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "聊天室话题设置失败");
  } finally {
    topicSaving.value = false;
  }
}

function focusComposer() {
  editor.value?.focus();
}

function startResize(event: PointerEvent, direction: "horizontal" | "vertical") {
  const panel = event.currentTarget as HTMLElement;
  const bounds = panel.parentElement?.getBoundingClientRect();
  if (!bounds) return;
  panel.setPointerCapture(event.pointerId);
  const move = (moveEvent: PointerEvent) => {
    if (direction === "horizontal") {
      sideWidth.value = Math.min(34, Math.max(16, ((bounds.right - moveEvent.clientX) / bounds.width) * 100));
      return;
    }
    composerHeight.value = Math.min(48, Math.max(20, ((bounds.bottom - moveEvent.clientY) / bounds.height) * 100));
  };
  const end = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end, { once: true });
}

function handleComposerKeydown(event: KeyboardEvent) {
  if (hasActiveMentionHint()) return;
  if (event.isComposing || sendShortcut.value !== "enter" || event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  event.stopPropagation();
  void send();
}

function hasActiveMentionHint() {
  const hint = document.querySelector("#global-chat-content .vditor-hint") as HTMLElement | null;
  return hint?.style.display !== "none" && hint?.querySelector("button") !== null;
}

function setSendShortcut(shortcut: "ctrl-enter" | "enter") {
  sendShortcut.value = shortcut;
  shortcutMenuOpen.value = false;
  localStorage.setItem("treble.global-chat.send-shortcut", shortcut);
}

async function issueTicket(): Promise<RealtimeTicket | undefined> {
  const response = await bbsClient.realtime.createTicket({ body: {} });
  return response.ticket && response.path ? { ticket: response.ticket, path: response.path } : undefined;
}

async function startRealtime() {
  if (realtimeStarted || !isLoggedIn.value) return;
  realtimeStarted = true;
  const nodeURL = await getRealtimeNodeUrl();
  if (!nodeURL) return;
  const realtime = getRealtimeConnection({
    issueTicket,
    resolveEndpoint: ({ path, ticket }) => `${nodeURL}${path}?ticket=${encodeURIComponent(ticket)}`,
  });
  unsubscribe = realtime.subscribe("global_chat_message", (event) => {
    try {
      const payload = JSON.parse(event.data) as GlobalChatMessageEvent;
      const messageID = String(payload.message_id || "");
      if (!messageID || !payload.sender_id || !payload.message_type || rows.value.some((row) => row.id === messageID))
        return;
      void resolveRealtimeSender(String(payload.sender_id)).then((sender) => {
        const messageRow = {
          id: messageID,
          senderId: String(payload.sender_id),
          sender,
          messageType: payload.message_type,
          content: payload.content,
          createdAt: payload.created_at ? new Date(payload.created_at) : undefined,
        };
        if (!sender) void loadMessages();
        return appendMessage(messageRow);
      });
    } catch {
      void loadMessages();
    }
  });
  unsubscribeBarrage = realtime.subscribe("global_chat_barrage", (event) => {
    try {
      const payload = JSON.parse(event.data) as GlobalChatBarrageEvent;
      const barrageID = String(payload.barrage_id || "");
      const userID = String(payload.user_id || "");
      const content = payload.content?.trim() || "";
      if (!barrageID || !userID || !content) return;
      void resolveRealtimeSender(userID).then((sender) => {
        showBarrage({ id: barrageID, userId: userID, content, sender });
      });
    } catch {
      // A malformed transient SSE frame must not affect the chat timeline.
    }
  });
  realtime.start();
}

onMounted(async () => {
  const savedShortcut = localStorage.getItem("treble.global-chat.send-shortcut");
  if (savedShortcut === "enter" || savedShortcut === "ctrl-enter") sendShortcut.value = savedShortcut;
  clockTimer = setInterval(() => (now.value = new Date()), 30_000);
  await loadMessages();
  await loadTopic();
  await loadOnlineMembers();
  await startRealtime();
});

watch(isLoggedIn, async (loggedIn, wasLoggedIn) => {
  if (!loggedIn || wasLoggedIn) return;
  await loadMessages();
  await startRealtime();
});

onBeforeUnmount(() => {
  unsubscribe?.();
  unsubscribeBarrage?.();
  for (const timer of barrageTimers.values()) clearTimeout(timer);
  if (clockTimer) clearInterval(clockTimer);
});
</script>

<template>
  <div class="main global-chat-page">
    <div aria-live="off" class="global-chat__barrage-layer">
      <a
        v-for="barrage in barrages"
        :key="barrage.id"
        :href="`/member/${barrage.sender?.name || ''}`"
        :style="{ '--global-chat-barrage-lane': barrage.lane }"
        class="global-chat__barrage"
      >
        <Avatar :name="barrage.sender?.name" :size="32" :url="barrage.sender?.avatarUrl" />
        <span
          >{{ displayName(barrage.sender || { userId: barrage.userId, name: `用户 ${barrage.userId}` }) }}：{{
            barrage.content
          }}</span
        >
      </a>
    </div>
    <div class="wrapper">
      <section :style="chatStyle" class="content module global-chat">
        <section class="global-chat__main">
          <main ref="timeline" aria-live="polite" class="global-chat__timeline" @scroll.passive="handleTimelineScroll">
            <div ref="timelineContent" class="global-chat__timeline-content">
              <p v-if="loadingOlder" class="global-chat__history-status">正在加载更早消息…</p>
              <p v-else-if="isLoggedIn && !hasOlder && rows.length" class="global-chat__history-status">
                已显示全部历史消息
              </p>
              <EmptyState v-if="!loading && !rows.length" />
              <article
                v-for="row in rows"
                :key="row.id"
                :class="{ 'global-chat__message--own': isOwnMessage(row) }"
                :data-bubble-style="row.bubbleStyle || 'default'"
                class="global-chat__message"
              >
                <MemberLink
                  :avatar="messageSender(row).avatarUrl"
                  :size="38"
                  :username="messageSender(row).name || ''"
                  square
                >
                  <Avatar :name="messageSender(row).name" :size="38" :url="messageSender(row).avatarUrl" square />
                </MemberLink>
                <section class="global-chat__bubble">
                  <header>
                    <strong>{{ displayName(messageSender(row)) }}</strong>
                  </header>
                  <p v-if="row.revoked" class="global-chat__revoked">这条消息已撤回</p>
                  <p v-else-if="row.messageType === 'IM_MESSAGE_TYPE_RED_PACKET'" class="global-chat__red-packet">
                    红包消息：{{ row.content }}
                  </p>
                  <!-- Vditor sanitizes the Markdown before this content is assigned. -->
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <div v-else-if="row.html" class="global-chat__content vditor-reset" v-html="row.html"></div>
                  <p v-else class="global-chat__content">{{ row.content }}</p>
                  <footer>
                    <time v-if="row.createdAt">{{ row.createdAt.toLocaleString() }}</time>
                    <details class="global-chat__message-actions">
                      <summary aria-label="消息操作"><Icon name="more" /></summary>
                      <menu>
                        <li v-if="imageHashFromMessage(row.content)">
                          <button type="button" @click="addMessageEmoji(row)">添加到表情</button>
                        </li>
                      </menu>
                    </details>
                  </footer>
                </section>
              </article>
              <button v-if="pendingMessages" class="global-chat__new-messages" type="button" @click="scrollToLatest">
                新消息（{{ pendingMessages }} 条）
              </button>
            </div>
          </main>
          <button
            aria-label="调整消息区与输入区高度"
            class="global-chat__splitter global-chat__splitter--horizontal"
            type="button"
            @pointerdown.prevent="startResize($event, 'vertical')"
          />
          <form v-if="isLoggedIn" class="global-chat__composer" @click="focusComposer" @submit.prevent="send">
            <label class="fn-none" for="global-chat-content">输入聊天室消息</label>
            <div aria-label="聊天室工具" class="global-chat__composer-tools">
              <button aria-label="发送红包" type="button" @click.stop="unavailable('红包')">
                <Icon name="red-packet" />
              </button>
              <button
                ref="emojiTrigger"
                aria-label="插入表情"
                type="button"
                @focus="openEmojiPicker"
                @pointerenter="openEmojiPicker"
                @pointerleave="closeEmojiPickerLater"
                @click.stop
              >
                <Icon name="emoji" />
              </button>
              <div ref="barrageControl" class="global-chat__barrage-control" @focusout="closeBarrageEditorOnBlur">
                <button
                  :aria-expanded="barrageEditorOpen"
                  aria-controls="global-chat-barrage-input"
                  aria-label="发送弹幕"
                  type="button"
                  @click.stop="toggleBarrageEditor"
                >
                  <Icon name="barrage" />
                </button>
                <Transition name="global-chat-barrage-editor">
                  <div
                    v-if="barrageEditorOpen"
                    class="global-chat__barrage-editor"
                    role="group"
                    @click.stop
                    @pointerdown.stop
                    @keydown.enter.prevent="sendBarrage"
                    @keydown.esc.prevent.stop="closeBarrageEditor"
                  >
                    <label class="fn-none" for="global-chat-barrage-input">弹幕内容</label>
                    <input
                      id="global-chat-barrage-input"
                      ref="barrageInput"
                      v-model="barrageDraft"
                      maxlength="32"
                      placeholder="友善弹幕，最多 32 字"
                    />
                    <button :disabled="barrageSending" type="button" @click="sendBarrage" @pointerdown.prevent>
                      {{ barrageSending ? "发射中…" : "发射" }}
                    </button>
                  </div>
                </Transition>
              </div>
            </div>
            <ClientOnly>
              <RichTextEditor
                id="global-chat-content"
                ref="editor"
                v-model="content"
                :options="{
                  cache: { enable: false },
                  placeholder: '说点什么吧，友善第一。',
                  preview: { mode: 'editor' },
                  resize: { enable: false },
                  toolbar: [],
                  ctrlEnter: () => {
                    if (sendShortcut === 'ctrl-enter' && !hasActiveMentionHint()) void send();
                  },
                }"
                height="100%"
                mention
                @keydown.capture="handleComposerKeydown"
              />
            </ClientOnly>
            <footer class="global-chat__composer-footer">
              <p v-if="isCurfew" class="global-chat__curfew">
                <span aria-hidden="true">💤</span>
                现在是聊天室宵禁时间（19:30–08:00），您发送的消息将不会产生活跃度，请早点下班休息 :)
              </p>
              <div class="global-chat__send-control">
                <button class="global-chat__send" type="submit">发送</button>
                <button
                  aria-label="选择发送快捷键"
                  class="global-chat__send-menu"
                  type="button"
                  @click="shortcutMenuOpen = !shortcutMenuOpen"
                ></button>
                <div v-if="shortcutMenuOpen" class="global-chat__shortcut-menu">
                  <button
                    :class="{ 'global-chat__shortcut-option--selected': sendShortcut === 'enter' }"
                    type="button"
                    @click="setSendShortcut('enter')"
                  >
                    按 Enter 键发送消息
                  </button>
                  <button
                    :class="{ 'global-chat__shortcut-option--selected': sendShortcut === 'ctrl-enter' }"
                    type="button"
                    @click="setSendShortcut('ctrl-enter')"
                  >
                    按 Ctrl+Enter 键发送消息
                  </button>
                </div>
              </div>
            </footer>
            <EmojiPicker
              v-if="emojiPickerOpen && emojiTrigger"
              :anchor="emojiTrigger"
              @close="emojiPickerOpen = false"
              @dragend="endEmojiDrag"
              @dragstart="beginEmojiDrag"
              @pointerenter="openEmojiPicker"
              @pointerleave="closeEmojiPickerLater"
              @select="insertEmoji"
            />
          </form>
          <section v-else aria-label="登录后参与聊天室" class="global-chat__login">
            <p>登录后查看更多消息并参与讨论</p>
            <a href="/login?next=%2Fchat">登录后参与讨论</a>
          </section>
        </section>
        <button
          aria-label="调整聊天区与侧栏宽度"
          class="global-chat__splitter global-chat__splitter--vertical"
          type="button"
          @pointerdown.prevent="startResize($event, 'horizontal')"
        />
        <aside aria-label="聊天室信息" class="global-chat__side">
          <section class="global-chat__side-section">
            <h2>当前话题</h2>
            <p><Icon name="topic" /># {{ topicLabel }} #</p>
            <div class="global-chat__topic-actions">
              <button aria-label="编辑话题" type="button" @click="openTopicEditor"><Icon name="topic-edit" /></button>
              <button aria-label="引用话题" type="button" @click="quoteTopic"><Icon name="topic-quote" /></button>
            </div>
          </section>
          <section class="global-chat__side-section global-chat__members">
            <h2>
              当前在线 <span>{{ onlineTotal }}</span>
            </h2>
            <div v-if="onlineMembers.length" class="global-chat__member-list">
              <MemberLink
                v-for="member in onlineMembers"
                :key="member.userId"
                :avatar="member.avatarUrl"
                :size="28"
                :username="member.name || ''"
                class="global-chat__member"
                square
              >
                <Avatar :name="member.name" :size="28" :url="member.avatarUrl" square />
                <span>{{ displayName(member) }}</span>
              </MemberLink>
            </div>
            <p v-else class="global-chat__members-empty">暂无在线成员。</p>
          </section>
        </aside>
      </section>
    </div>
    <div
      v-if="topicEditorOpen"
      class="global-chat__topic-dialog"
      role="presentation"
      @click.self="topicEditorOpen = false"
    >
      <section
        aria-labelledby="global-chat-topic-dialog-title"
        aria-modal="true"
        class="global-chat__topic-dialog-panel"
        role="dialog"
      >
        <header>
          <h2 id="global-chat-topic-dialog-title">设置话题</h2>
          <button aria-label="关闭" type="button" @click="topicEditorOpen = false">×</button>
        </header>
        <p>修改话题需要 16 积分，将自动从账户中扣除；<br />最大长度 64 字符，不合法字符将被自动过滤。</p>
        <form @submit.prevent="submitTopicEditor">
          <label class="fn-none" for="global-chat-topic-input">话题内容</label>
          <input id="global-chat-topic-input" v-model="topicDraft" autofocus maxlength="64" />
          <footer>
            <button type="button" @click="topicEditorOpen = false">取消</button>
            <button :disabled="topicSaving" type="submit">{{ topicSaving ? "设置中…" : "设置" }}</button>
          </footer>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.global-chat-page {
  box-sizing: border-box;
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  padding-block: clamp(0.75rem, 2.5vh, 1.25rem);
}
.global-chat__barrage-layer {
  position: fixed;
  z-index: 30;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  pointer-events: none;
}
.global-chat__barrage {
  position: absolute;
  top: calc(14% + (var(--global-chat-barrage-lane) * 11%));
  right: -24rem;
  display: inline-flex;
  align-items: center;
  max-width: min(50rem, calc(100vw - 2rem));
  height: 2.5rem;
  padding: 0 0.5rem 0 0.25rem;
  border-radius: 1.5625rem;
  background: rgb(0 0 0 / 20%);
  color: #fff;
  font-size: 0.875rem;
  text-decoration: none;
  white-space: nowrap;
  pointer-events: auto;
  animation: global-chat-barrage-move 16s linear forwards;
}
.global-chat__barrage :deep(.avatar) {
  flex: 0 0 2rem;
  border-radius: 50%;
}
.global-chat__barrage span {
  overflow: hidden;
  margin: 0 0.5rem;
  text-overflow: ellipsis;
}
.global-chat__barrage:hover {
  animation-play-state: paused;
  text-decoration: underline;
}
@keyframes global-chat-barrage-move {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-100vw - 28rem));
  }
}
@media (prefers-reduced-motion: reduce) {
  .global-chat__barrage {
    right: 1rem;
    animation: none;
  }
}
.global-chat-page > .wrapper {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
}
.global-chat-page .content {
  min-height: 0;
  width: 100%;
  margin-right: 0;
}
.global-chat {
  display: grid;
  flex: 1 1 0;
  max-height: 100%;
  margin-bottom: 0;
  min-height: 0;
  grid-template-columns: minmax(0, 1fr) 0.375rem minmax(13rem, var(--global-chat-side-width));
  overflow: hidden;
}
.global-chat__main {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: minmax(0, 1fr) 0.375rem minmax(20%, var(--global-chat-composer-height));
}
.global-chat__timeline {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: clamp(1rem, 2.4vh, 1.5rem) clamp(1.25rem, 2.8vw, 2rem);
  overflow-y: auto;
  scrollbar-gutter: stable;
}
.global-chat__timeline-content {
  display: flex;
  flex-direction: column;
  gap: clamp(0.6rem, 1.4vh, 0.9rem);
  min-width: 0;
}
.global-chat__history-status {
  align-self: center;
  margin: 0;
  color: var(--text-fade-color);
  font-size: 0.75rem;
}
.global-chat__new-messages {
  position: sticky;
  z-index: 1;
  right: 0;
  bottom: 0.25rem;
  align-self: flex-end;
  margin-top: auto;
  border: 0;
  border-radius: 999px;
  background: var(--color-accent);
  color: #fff;
  cursor: pointer;
  font-size: 0.75rem;
  line-height: 1.75rem;
  padding: 0 0.75rem;
}
.global-chat__message {
  --global-chat-bubble-background: var(--background-secondary-color);

  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-inline: 0.25rem;
  max-width: min(70ch, 94%);
  overflow-wrap: anywhere;
}
.global-chat__message :deep(.avatar) {
  flex: 0 0 2.375rem;
}
.global-chat__message--own {
  align-self: flex-end;
  flex-direction: row-reverse;
}
.global-chat__message--own .global-chat__bubble header,
.global-chat__message--own .global-chat__bubble footer {
  justify-content: flex-end;
}
.global-chat__message--own .global-chat__bubble header {
  text-align: right;
}
.global-chat__bubble {
  min-width: min(18rem, calc(100% - 3.125rem));
  max-width: min(42.5rem, calc(100% - 3.125rem));
  padding: 0.55rem 0.875rem 0.5rem;
  border-radius: 0.25rem;
  background: var(--global-chat-bubble-background);
}
.global-chat__bubble header {
  display: flex;
  align-items: center;
  min-height: 1.25rem;
  padding-bottom: 0.2rem;
  border-bottom: 1px solid var(--layer-border-color);
  color: var(--text-fade-color);
  font-size: 0.75rem;
}
.global-chat__bubble strong {
  color: var(--text-color);
  font-size: 0.8125rem;
}
.global-chat__bubble footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 1.125rem;
  margin-top: 0.4rem;
  color: var(--text-fade-color);
  font-size: 0.6875rem;
}
.global-chat__bubble footer button {
  display: grid;
  width: 1.25rem;
  height: 1.25rem;
  margin-left: 0.5rem;
  padding: 0;
  border: 0;
  place-items: center;
  background: transparent;
  color: var(--text-fade-color);
  cursor: pointer;
}
.global-chat__bubble footer :deep(.icon) {
  width: 0.875rem;
  height: 0.875rem;
}
.global-chat__message-actions {
  position: relative;
  margin-left: 0.5rem;
}
.global-chat__message-actions summary {
  display: grid;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  list-style: none;
  place-items: center;
  color: var(--text-fade-color);
  cursor: pointer;
}
.global-chat__message-actions summary::-webkit-details-marker {
  display: none;
}
.global-chat__message-actions summary:hover,
.global-chat__message-actions summary:focus-visible {
  color: var(--color-accent);
  outline: 0;
}
.global-chat__message-actions menu {
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: calc(100% + 0.25rem);
  min-width: 7rem;
  margin: 0;
  padding: 0.25rem;
  border: 1px solid var(--layer-border-color);
  background: var(--layer-background-color);
  list-style: none;
}
.global-chat__message-actions menu button {
  width: 100%;
  min-height: 1.875rem;
  padding: 0 0.5rem;
  border: 0;
  background: transparent;
  box-shadow: none !important;
  color: var(--text-color);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transform: none !important;
  transition: none !important;
}
.global-chat__message-actions menu button:hover,
.global-chat__message-actions menu button:focus-visible {
  background: transparent;
  box-shadow: none !important;
  color: var(--color-accent);
  outline: 0;
  transform: none !important;
}
.global-chat__content {
  margin-top: 0.375rem;
  color: var(--text-color);
  font-size: 0.875rem;
  line-height: 1.65;
}
.global-chat__revoked {
  margin: 0.375rem 0 0;
  color: var(--text-fade-color);
  font-size: 0.8125rem;
  font-style: italic;
}
.global-chat__red-packet {
  margin: 0.375rem 0 0;
  padding: 0.5625rem 0.75rem;
  border-radius: 0.1875rem;
  background: #fff2ef;
  color: #db5a45;
  font-size: 0.8125rem;
}
.global-chat__composer {
  display: grid;
  gap: 0;
  min-height: 0;
  overflow: hidden;
  padding: 0 0.875rem 0.625rem;
  border: 0;
  background: var(--layer-background-color);
  grid-template-rows: auto minmax(0, 1fr) auto auto;
}
.global-chat__side {
  display: grid;
  min-height: 0;
  border-left: 0;
  grid-template-rows: auto minmax(0, 1fr);
}
.global-chat__side-section {
  padding: 0.875rem;
  border-bottom: 1px solid var(--layer-border-color);
}
.global-chat__side-section h2 {
  margin: 0 0 0.625rem;
  color: var(--text-color);
  font-size: 0.8125rem;
  font-weight: 600;
}
.global-chat__side-section h2 span {
  float: right;
  color: var(--text-color);
  font-variant-numeric: tabular-nums;
}
.global-chat__side-section p {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0;
  color: var(--link-color);
  font-size: 0.75rem;
  overflow-wrap: anywhere;
}
.global-chat__side-section :deep(.icon) {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-accent);
}
.global-chat__topic-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.375rem;
  margin-top: 0.625rem;
}
.global-chat__topic-actions button {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: 0;
  place-items: center;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
}
.global-chat__topic-actions button:hover,
.global-chat__topic-actions button:focus-visible {
  color: var(--color-accent);
  box-shadow: none;
  outline: 0;
  transform: none;
}
.global-chat__topic-actions :deep(.icon) {
  width: 1.25rem;
  height: 1.25rem;
  color: currentColor;
}
.global-chat__members {
  min-height: 0;
  overflow-y: auto;
}
.global-chat__members .global-chat__members-empty {
  color: var(--text-fade-color);
}
.global-chat__member-list {
  display: grid;
  gap: 0.125rem;
}
.global-chat__member {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  min-height: 2.125rem;
  color: var(--text-color);
  font-size: 0.75rem;
  text-decoration: none;
}
.global-chat__member:hover,
.global-chat__member:focus-visible {
  color: var(--link-color);
  outline: 0;
}
.global-chat__member span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.global-chat__login {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: clamp(4rem, 10vh, 6rem);
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--layer-border-color);
  background: var(--layer-background-color);
  color: var(--text-fade-color);
  font-size: 0.875rem;
}
.global-chat__login p {
  margin: 0;
}
.global-chat__login a {
  color: var(--link-color);
}
.global-chat__topic {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.25rem;
  padding: 0 1.125rem;
  border-bottom: 1px solid var(--layer-border-color);
  background: var(--background-secondary-color);
  color: var(--text-fade-color);
  font-size: 0.75rem;
}
.global-chat__topic :deep(.icon) {
  width: 0.9375rem;
  height: 0.9375rem;
  color: var(--color-accent);
}
.global-chat__topic strong {
  min-width: 0;
  overflow: hidden;
  color: var(--link-color);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.global-chat__topic button {
  display: grid;
  width: 1.875rem;
  height: 1.875rem;
  margin-left: auto;
  padding: 0;
  border: 0;
  place-items: center;
  background: transparent;
  color: var(--text-fade-color);
  cursor: pointer;
}
.global-chat__topic button:hover,
.global-chat__topic button:focus-visible {
  color: var(--color-accent);
  outline: 0;
}
.global-chat__composer :deep(.editor-shell) {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  box-shadow: none !important;
}
.global-chat__composer :deep(.vditor--focus) {
  border-color: #51a7e8;
  box-shadow: none !important;
}
.global-chat__composer :deep(.vditor--focus .vditor-content),
.global-chat__composer :deep(.vditor--focus .vditor-ir),
.global-chat__composer :deep(.vditor--focus .vditor-wysiwyg),
.global-chat__composer :deep(.vditor--focus .vditor-sv) {
  box-shadow: none !important;
}
.global-chat__composer :deep(.editor-shell *),
.global-chat__composer :deep(.editor-shell *:focus) {
  box-shadow: none !important;
  filter: none !important;
  outline: none !important;
}
.global-chat__composer :deep(.vditor-wysiwyg pre.vditor-reset:focus),
.global-chat__composer :deep(.vditor-ir pre.vditor-reset:focus),
.global-chat__composer :deep(.vditor-sv:focus) {
  background: var(--layer-background-color) !important;
}
.global-chat__composer :deep(.vditor) {
  height: 100% !important;
  max-height: none;
}
.global-chat__composer :deep(.vditor-content) {
  min-height: 0;
  height: 100%;
  overflow: hidden;
}
.global-chat__composer :deep(.vditor-wysiwyg),
.global-chat__composer :deep(.vditor-ir),
.global-chat__composer :deep(.vditor-sv) {
  min-height: 0;
  height: 100%;
}
.global-chat__composer :deep(.vditor-wysiwyg),
.global-chat__composer :deep(.vditor-ir pre),
.global-chat__composer :deep(.vditor-sv) {
  box-sizing: border-box;
  padding: 0 !important;
}
.global-chat__composer :deep(.vditor-ir pre) {
  min-height: 100%;
}
.global-chat__composer :deep(.vditor-wysiwyg),
.global-chat__composer :deep(.vditor-ir),
.global-chat__composer :deep(.vditor-sv) {
  overflow-y: auto !important;
}
.global-chat__composer :deep(.vditor-toolbar) {
  display: none;
}
.global-chat__composer-footer {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 1.875rem;
  padding-top: 0.125rem;
  border: 0;
  background: var(--layer-background-color);
  color: var(--text-fade-color);
  font-size: 0.75rem;
}
.global-chat__composer-tools {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 2.5rem;
}
.global-chat__composer-tools > button,
.global-chat__barrage-control > button {
  display: grid;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  place-items: center;
  background: transparent;
  cursor: pointer;
  transition: none;
}
.global-chat__composer-tools > button:hover,
.global-chat__composer-tools > button:focus-visible,
.global-chat__barrage-control > button:hover,
.global-chat__barrage-control > button:focus-visible {
  background: transparent;
  box-shadow: none;
  outline: 0;
}
.global-chat__barrage-control {
  position: relative;
  display: flex;
}
.global-chat__barrage-editor {
  position: absolute;
  z-index: 5;
  top: 50%;
  left: calc(100% + 0.375rem);
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-width: min(20rem, calc(100vw - 6rem));
  padding: 0.375rem;
  border: 1px solid var(--layer-border-color);
  border-radius: 0.25rem;
  background: var(--layer-background-color);
  box-shadow: var(--shadow-card);
  transform: translateY(-50%);
}
.global-chat__barrage-editor input {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 1.875rem;
  padding: 0 0.5rem;
  border: 1px solid var(--layer-border-color);
  border-radius: 0.1875rem;
  background: var(--background-secondary-color);
  color: var(--text-color);
  font: inherit;
  font-size: 0.75rem;
}
.global-chat__barrage-editor input:focus {
  border-color: var(--color-accent);
  outline: 0;
}
.global-chat__barrage-editor button {
  min-width: 3.25rem;
  min-height: 1.875rem;
  padding: 0 0.625rem;
  border: 0;
  border-radius: 0.1875rem;
  background: var(--color-accent);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
}
.global-chat__barrage-editor button:hover,
.global-chat__barrage-editor button:focus-visible {
  background: color-mix(in srgb, var(--color-accent) 88%, #000);
  box-shadow: none;
  outline: 0;
  transform: none;
}
.global-chat__barrage-editor button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.global-chat-barrage-editor-enter-active,
.global-chat-barrage-editor-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}
.global-chat-barrage-editor-enter-from,
.global-chat-barrage-editor-leave-to {
  opacity: 0;
  transform: translate(-0.375rem, -50%);
}
.global-chat__composer-tools :deep(.icon) {
  width: 1.375rem;
  height: 1.375rem;
}
.global-chat__curfew {
  min-width: 0;
  margin: 0;
  color: var(--text-fade-color);
  font-size: 0.75rem;
  line-height: 1.5;
}
.global-chat__curfew span {
  margin-right: 0.25rem;
}
.global-chat__send {
  min-width: 3.5rem;
  min-height: 1.75rem;
  border: 0;
  border-radius: 0.1875rem 0 0 0.1875rem;
  background: var(--color-accent);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
}
.global-chat__send-control {
  position: relative;
  display: flex;
  margin-left: auto;
}
.global-chat__send-menu {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.625rem;
  min-height: 1.75rem;
  padding: 0;
  border: 0;
  border-left: 1px solid rgb(255 255 255 / 35%);
  border-radius: 0 0.1875rem 0.1875rem 0;
  background: var(--color-accent);
  color: #fff;
  cursor: pointer;
  box-shadow: none;
  transition: none;
}
.global-chat__send-menu::before {
  width: 0.375rem;
  height: 0.375rem;
  border-right: 0.09375rem solid currentColor;
  border-bottom: 0.09375rem solid currentColor;
  content: "";
  transform: translateY(-0.09375rem) rotate(45deg);
}
.global-chat__send:hover,
.global-chat__send:focus-visible,
.global-chat__send-menu:hover,
.global-chat__send-menu:focus-visible {
  box-shadow: none;
  transform: none;
}
.global-chat__shortcut-menu {
  position: absolute;
  z-index: 3;
  right: 0;
  bottom: calc(100% + 0.375rem);
  display: grid;
  min-width: 13rem;
  padding: 0.375rem 0;
  border: 1px solid var(--layer-border-color);
  background: var(--layer-background-color);
  box-shadow: var(--shadow-card);
}
.global-chat__shortcut-menu button {
  min-height: 2.25rem;
  padding: 0 0.875rem 0 2rem;
  border: 0;
  background: transparent;
  color: var(--text-color);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.global-chat__shortcut-menu button:hover,
.global-chat__shortcut-option--selected {
  background: var(--background-secondary-color) !important;
}
.global-chat__shortcut-option--selected::before {
  position: absolute;
  margin-left: -1.125rem;
  content: "✓";
}
.global-chat__splitter {
  z-index: 2;
  border: 0;
  padding: 0;
  background: var(--layer-border-color);
  opacity: 0.65;
  transition:
    background-color 0.15s ease,
    opacity 0.15s ease;
}
.global-chat__splitter:hover,
.global-chat__splitter:focus-visible {
  background: var(--color-accent);
  opacity: 1;
  outline: 0;
}
.global-chat__splitter--vertical {
  cursor: col-resize;
}
.global-chat__splitter--horizontal {
  cursor: row-resize;
}
.global-chat__send:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.global-chat__topic-dialog {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(0 0 0 / 35%);
}
.global-chat__topic-dialog-panel {
  width: min(100%, 26rem);
  padding: 1rem;
  border: 1px solid var(--layer-border-color);
  border-radius: 0.25rem;
  background: var(--layer-background-color);
  box-shadow: var(--shadow-overlay);
}
.global-chat__topic-dialog-panel > header,
.global-chat__topic-dialog-panel footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.global-chat__topic-dialog-panel h2,
.global-chat__topic-dialog-panel p {
  margin: 0;
}
.global-chat__topic-dialog-panel h2 {
  font-size: 1rem;
}
.global-chat__topic-dialog-panel > header > button,
.global-chat__topic-dialog-panel footer button {
  border: 0;
  background: transparent;
  color: var(--text-fade-color);
  cursor: pointer;
  font: inherit;
}
.global-chat__topic-dialog-panel > header > button {
  width: 1.75rem;
  height: 1.75rem;
  font-size: 1.5rem;
  line-height: 1;
}
.global-chat__topic-dialog-panel p {
  margin-top: 1rem;
  color: var(--text-fade-color);
  font-size: 0.75rem;
  line-height: 1.5;
}
.global-chat__topic-dialog-panel input {
  box-sizing: border-box;
  width: 100%;
  min-height: 2.25rem;
  margin-top: 0.625rem;
  padding: 0 0.625rem;
  border: 1px solid var(--layer-border-color);
  border-radius: 0.1875rem;
  background: var(--background-secondary-color);
  color: var(--text-color);
  font: inherit;
}
.global-chat__topic-dialog-panel input:focus {
  border-color: var(--color-accent);
  outline: 0;
}
.global-chat__topic-dialog-panel footer {
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}
.global-chat__topic-dialog-panel footer button:last-child {
  min-height: 1.875rem;
  padding: 0 0.75rem;
  border-radius: 0.1875rem;
  background: var(--color-accent);
  color: #fff;
}
@media (max-width: 48rem) {
  .global-chat-page {
    padding-block: clamp(0.625rem, 2.5vh, 0.875rem);
  }
  .global-chat {
    grid-template-columns: 1fr;
  }
  .global-chat__side {
    display: none;
  }
  .global-chat__splitter--vertical {
    display: none;
  }
  .global-chat__timeline {
    padding: 0.75rem 0.875rem 0.3rem;
  }
  .global-chat__topic {
    padding-right: 0.875rem;
    padding-left: 0.875rem;
  }
  .global-chat__bubble {
    min-width: 0;
    max-width: calc(100% - 3.125rem);
  }
  .global-chat__send {
    min-height: 2.25rem;
  }
  .global-chat__barrage-editor {
    position: fixed;
    top: auto;
    right: 0.75rem;
    bottom: 0.75rem;
    left: 0.75rem;
    min-width: 0;
    transform: none;
  }
  .global-chat-barrage-editor-enter-from,
  .global-chat-barrage-editor-leave-to {
    transform: translateY(0.375rem);
  }
  .global-chat__login {
    flex-direction: column;
    gap: 0.375rem;
  }
}
</style>
