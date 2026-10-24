<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import RichTextEditor from "@/components/content/RichTextEditor.vue";
import EmojiPicker from "@/components/content/EmojiPicker.vue";
import ClientOnly from "@/components/ui/ClientOnly.vue";
import Avatar from "@/components/identity/Avatar.vue";
import EmptyState from "@/components/feedback/EmptyState.vue";
import { message } from "@/components/feedback/message";
import Icon from "@/components/ui/Icon.vue";
import { notifyPrivateChatRead } from "@/services/privateChatState";
import { getRealtimeConnection, getRealtimeNodeUrl, type RealtimeTicket } from "@/services/realtime";
import { useChatTimeline } from "@/services/chatTimeline";
import { bbsClient } from "@/utils/sdk";
import { createClientIdentifier } from "@/utils/sdk/shared";
import { memberDisplayName } from "@/utils/member";

type Session = {
  peerUserId?: string;
  unreadCount?: number;
  pinned?: boolean;
  muted?: boolean;
  peer?: { userId?: string; name?: string; nickname?: string; avatarUrl?: string; online?: boolean };
  lastMessage?: { content?: string; revoked?: boolean };
  lastMessageAt?: Date;
};
type PrivateMessage = {
  id?: string;
  senderId?: string;
  receiverId?: string;
  content?: string;
  messageType?: string;
  revoked?: boolean;
  createdAt?: Date;
  html?: string;
};
type PrivateChatMessageEvent = {
  message_id?: string;
  sender_id?: string;
  receiver_id?: string;
  message_type?: string;
  content?: string;
  created_at?: string;
};

const sessions = ref<Session[]>([]);
const pageContext = usePageContext();
const rows = ref<PrivateMessage[]>([]);
const selectedPeerID = ref<string>();
const selectedPeer = ref<Session["peer"]>();
const chatWithName = ref("");
const content = ref("");
const editor = ref<InstanceType<typeof RichTextEditor>>();
const emojiTrigger = ref<HTMLButtonElement>();
const emojiPickerOpen = ref(false);
let emojiCloseTimer: ReturnType<typeof setTimeout> | undefined;
let emojiDragging = false;
const loading = ref(false);
const sending = ref(false);
const starting = ref(false);
const sideWidth = ref(24);
const composerHeight = ref(28);
const sendShortcut = ref<"ctrl-enter" | "enter">("ctrl-enter");
const shortcutMenuOpen = ref(false);
const maximumLoadedMessages = 300;
const selectedConversation = computed(() =>
  selectedPeerID.value
    ? selectedPeer.value || sessions.value.find((session) => session.peerUserId === selectedPeerID.value)?.peer
    : undefined,
);
const currentUserID = computed(() => {
  const userID = pageContext.user?.profile?.id;
  return userID === undefined ? undefined : String(userID);
});
const privateChatStyle = computed(() => ({
  "--private-chat-side-width": `${sideWidth.value}%`,
  "--private-chat-composer-height": `${composerHeight.value}%`,
}));
let unsubscribe: (() => void) | undefined;
let markdownConverter: Promise<typeof import("vditor").default> | undefined;
const timeline = ref<HTMLElement>();
const timelineContent = ref<HTMLElement>();
const {
  pendingMessages,
  handleScroll: handleTimelinePosition,
  prepareAppend,
  recordPendingMessage,
  scrollToLatest,
  settleAppendedMessage,
  settleInitialRender,
} = useChatTimeline(timeline, timelineContent);

async function loadSessions() {
  const response = await bbsClient.im.listPrivateChatSessions({ pagePage: "1", pageSize: "50" });
  sessions.value = response.rows || [];
}

async function selectSession(peerUserId?: string) {
  if (!peerUserId) return;
  selectedPeerID.value = peerUserId;
  selectedPeer.value = sessions.value.find((session) => session.peerUserId === peerUserId)?.peer;
  loading.value = true;
  try {
    const response = await bbsClient.im.listPrivateChatMessages({
      listPrivateChatMessagesReq: { peerUserId, page: { page: "1", size: "50" } },
    });
    rows.value = await renderMessages([...(response.rows || [])].reverse());
    await settleInitialRender();
    const latest = rows.value.at(-1);
    if (latest?.id) {
      await bbsClient.im.markPrivateChatSessionRead({
        markPrivateChatSessionReadReq: { peerUserId, messageId: latest.id },
      });
      await loadSessions();
      notifyPrivateChatRead();
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : "私聊消息加载失败");
  } finally {
    loading.value = false;
  }
}

async function startConversation() {
  const name = chatWithName.value.trim();
  if (!name || starting.value) return;
  starting.value = true;
  try {
    const response = await bbsClient.account.getProfile({ getProfileReq: { name } });
    const peer = response.profile?.account;
    if (!peer?.id || !peer.name) {
      message.warning("未找到该用户。");
      return;
    }
    if (String(peer.id) === currentUserID.value) {
      message.warning("不能向自己发起私聊。");
      return;
    }
    const peerUserID = String(peer.id);
    if (sessions.value.some((session) => session.peerUserId === peerUserID)) {
      await selectSession(peerUserID);
    } else {
      selectedPeerID.value = peerUserID;
      selectedPeer.value = { userId: peerUserID, name: peer.name, nickname: peer.nickname, avatarUrl: peer.avatarUrl };
      rows.value = [];
    }
    chatWithName.value = "";
  } catch (error) {
    message.error(error instanceof Error ? error.message : "发起私聊失败。");
  } finally {
    starting.value = false;
  }
}

async function send() {
  const peerUserId = selectedPeerID.value;
  const value = (editor.value?.getValue() || content.value).trim();
  if (!peerUserId || !value || sending.value) return;
  sending.value = true;
  try {
    const response = await bbsClient.im.sendPrivateChatMessage({
      sendPrivateChatMessageReq: { receiverId: peerUserId, clientMessageId: createClientIdentifier(), content: value },
    });
    editor.value?.setValue("");
    content.value = "";
    if (response.message) await appendRealtimeMessage(response.message, true);
    await loadSessions();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "消息发送失败");
  } finally {
    sending.value = false;
  }
}

async function renderMessages(messages: PrivateMessage[]) {
  try {
    markdownConverter ??= import("vditor").then((module) => module.default);
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

function handleTimelineScroll() {
  handleTimelinePosition();
}

async function appendRealtimeMessage(messageRow: PrivateMessage, forceFollow = false) {
  if (!messageRow.id) return;
  if (rows.value.some((row) => row.id === messageRow.id)) {
    if (forceFollow) scrollToLatest();
    return;
  }
  const [renderedRow] = await renderMessages([messageRow]);
  const followedLatest = prepareAppend(forceFollow);
  rows.value.push(renderedRow);
  if (rows.value.length > maximumLoadedMessages) rows.value.splice(0, rows.value.length - maximumLoadedMessages);
  if (followedLatest) {
    await settleAppendedMessage(true);
    return;
  }
  recordPendingMessage();
}

function focusComposer() {
  editor.value?.focus();
}

function unavailable(feature: string) {
  message.info(`${feature}功能正在接入。`);
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

async function addMessageEmoji(row: PrivateMessage) {
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

function handleComposerKeydown(event: KeyboardEvent) {
  if (hasActiveMentionHint()) return;
  if (event.isComposing || sendShortcut.value !== "enter" || event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  event.stopPropagation();
  void send();
}

function hasActiveMentionHint() {
  const hint = document.querySelector("#private-chat-content .vditor-hint") as HTMLElement | null;
  return hint?.style.display !== "none" && hint?.querySelector("button") !== null;
}

function setSendShortcut(shortcut: "ctrl-enter" | "enter") {
  sendShortcut.value = shortcut;
  shortcutMenuOpen.value = false;
  localStorage.setItem("treble.global-chat.send-shortcut", shortcut);
}

function startResize(event: PointerEvent, direction: "horizontal" | "vertical") {
  const panel = event.currentTarget as HTMLElement;
  const bounds = panel.parentElement?.getBoundingClientRect();
  if (!bounds) return;
  panel.setPointerCapture(event.pointerId);
  const move = (moveEvent: PointerEvent) => {
    if (direction === "horizontal") {
      sideWidth.value = Math.min(34, Math.max(16, ((bounds.left - moveEvent.clientX) / bounds.width) * -100));
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

async function issueTicket(): Promise<RealtimeTicket | undefined> {
  const response = await bbsClient.realtime.createTicket({ body: {} });
  return response.ticket && response.path ? { ticket: response.ticket, path: response.path } : undefined;
}

onMounted(async () => {
  const savedShortcut = localStorage.getItem("treble.global-chat.send-shortcut");
  if (savedShortcut === "enter" || savedShortcut === "ctrl-enter") sendShortcut.value = savedShortcut;
  try {
    await loadSessions();
    const peerUserId = new URLSearchParams(pageContext.urlParsed.searchOriginal).get("peer") || undefined;
    if (peerUserId) await selectSession(peerUserId);
  } catch (error) {
    message.error(error instanceof Error ? error.message : "私聊会话加载失败");
  }
  const nodeURL = await getRealtimeNodeUrl();
  if (!nodeURL) return;
  const realtime = getRealtimeConnection({
    issueTicket,
    resolveEndpoint: ({ path, ticket }) => `${nodeURL}${path}?ticket=${encodeURIComponent(ticket)}`,
  });
  unsubscribe = realtime.subscribe("private_chat_message", async (event) => {
    try {
      const payload = JSON.parse(event.data) as PrivateChatMessageEvent;
      const messageID = String(payload.message_id || "");
      const senderID = String(payload.sender_id || "");
      const receiverID = String(payload.receiver_id || "");
      if (!messageID || !senderID || !receiverID || !payload.message_type) return;
      const peerUserId = senderID === currentUserID.value ? receiverID : senderID;
      if (!selectedPeerID.value || selectedPeerID.value !== peerUserId) {
        await loadSessions();
        return;
      }
      const createdAt = payload.created_at ? new Date(payload.created_at) : new Date();
      await appendRealtimeMessage({
        id: messageID,
        senderId: senderID,
        receiverId: receiverID,
        messageType: payload.message_type,
        content: payload.content,
        createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
      });
      if (receiverID === currentUserID.value) {
        await bbsClient.im.markPrivateChatSessionRead({
          markPrivateChatSessionReadReq: { peerUserId, messageId: messageID },
        });
      }
      await loadSessions();
      if (receiverID === currentUserID.value) notifyPrivateChatRead();
    } catch {
      if (selectedPeerID.value) await selectSession(selectedPeerID.value);
    }
  });
  realtime.start();
});

onBeforeUnmount(() => unsubscribe?.());
</script>

<template>
  <div class="main private-chat-page">
    <div class="wrapper">
      <section :style="privateChatStyle" class="content module private-chat">
        <aside class="private-chat__sessions" aria-label="私聊会话">
          <EmptyState v-if="!sessions.length" />
          <button
            v-for="session in sessions"
            :key="session.peerUserId"
            :class="{ 'private-chat__session--selected': selectedPeerID === session.peerUserId }"
            class="private-chat__session"
            type="button"
            @click="selectSession(session.peerUserId)"
          >
            <Avatar :name="session.peer?.name" :size="36" square :url="session.peer?.avatarUrl" />
            <span class="private-chat__session-content">
              <span class="private-chat__session-title">
                <span>{{ memberDisplayName(session.peer, `用户 ${session.peerUserId}`) }}</span>
                <span
                  :class="{ 'private-chat__presence--online': session.peer?.online }"
                  class="private-chat__presence"
                  >{{ session.peer?.online ? "[在线]" : "[离线]" }}</span
                >
              </span>
              <span class="private-chat__session-preview">
                <span>{{
                  session.lastMessage?.revoked ? "消息已撤回" : session.lastMessage?.content || "暂无消息"
                }}</span>
                <span v-if="session.unreadCount" class="private-chat__badge">{{ session.unreadCount }}</span>
              </span>
            </span>
          </button>
        </aside>
        <button
          aria-label="调整会话列表与私聊区域宽度"
          class="private-chat__splitter private-chat__splitter--vertical"
          type="button"
          @pointerdown.prevent="startResize($event, 'horizontal')"
        />
        <section class="private-chat__conversation" aria-live="polite">
          <template v-if="selectedConversation"
            ><header>
              <strong>{{ memberDisplayName(selectedConversation, `用户 ${selectedPeerID}`) }}</strong>
              ><span v-if="loading">加载中…</span>
            </header>
            <main ref="timeline" @scroll.passive="handleTimelineScroll">
              <div ref="timelineContent" class="private-chat__timeline-content">
                <article
                  v-for="row in rows"
                  :key="row.id"
                  :class="{ 'private-chat__message--self': row.senderId === currentUserID }"
                  class="private-chat__message"
                >
                  <section class="private-chat__bubble">
                    <p v-if="row.revoked" class="private-chat__revoked">这条消息已撤回</p>
                    <p v-else-if="row.messageType === 'IM_MESSAGE_TYPE_RED_PACKET'" class="private-chat__red-packet">
                      红包消息：{{ row.content }}
                    </p>
                    <!-- Vditor sanitizes the Markdown before this content is assigned. -->
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <div v-else-if="row.html" class="private-chat__content vditor-reset" v-html="row.html" />
                    <p v-else>{{ row.content }}</p>
                    <footer>
                      <time v-if="row.createdAt">{{ row.createdAt.toLocaleString() }}</time>
                      <details class="private-chat__message-actions">
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
                <button v-if="pendingMessages" class="private-chat__new-messages" type="button" @click="scrollToLatest">
                  新消息（{{ pendingMessages }} 条）
                </button>
              </div>
            </main>
            <button
              aria-label="调整消息区与输入区高度"
              class="private-chat__splitter private-chat__splitter--horizontal"
              type="button"
              @pointerdown.prevent="startResize($event, 'vertical')"
            />
            <form class="private-chat__composer" @click="focusComposer" @submit.prevent="send">
              <label class="fn-none" for="private-chat-content">输入私聊消息</label>
              <div class="private-chat__composer-tools" aria-label="私聊工具">
                <button aria-label="发送红包" type="button" @click.stop="unavailable('红包')">
                  <Icon name="red-packet" />
                </button>
                <button
                  ref="emojiTrigger"
                  aria-label="插入表情"
                  type="button"
                  @click.stop
                  @focus="openEmojiPicker"
                  @pointerenter="openEmojiPicker"
                  @pointerleave="closeEmojiPickerLater"
                >
                  <Icon name="emoji" />
                </button>
              </div>
              <ClientOnly>
                <RichTextEditor
                  id="private-chat-content"
                  ref="editor"
                  v-model="content"
                  height="100%"
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
                  @keydown.capture="handleComposerKeydown"
                />
              </ClientOnly>
              <footer>
                <div class="private-chat__send-control">
                  <button class="private-chat__send" :disabled="sending" type="submit">
                    {{ sending ? "发送中…" : "发送" }}
                  </button>
                  <button
                    aria-label="选择发送快捷键"
                    class="private-chat__send-menu"
                    type="button"
                    @click="shortcutMenuOpen = !shortcutMenuOpen"
                  />
                  <div v-if="shortcutMenuOpen" class="private-chat__shortcut-menu">
                    <button
                      :class="{ 'private-chat__shortcut-option--selected': sendShortcut === 'enter' }"
                      type="button"
                      @click="setSendShortcut('enter')"
                    >
                      按 Enter 键发送消息
                    </button>
                    <button
                      :class="{ 'private-chat__shortcut-option--selected': sendShortcut === 'ctrl-enter' }"
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
                @pointerenter="openEmojiPicker"
                @pointerleave="closeEmojiPickerLater"
                @dragend="endEmojiDrag"
                @dragstart="beginEmojiDrag"
                @select="insertEmoji"
              />
            </form>
          </template>
          <section v-else class="private-chat__start" aria-labelledby="private-chat-start-title">
            <p id="private-chat-start-title">请在列表点选联系人，或直接发起聊天。</p>
            <form @submit.prevent="startConversation">
              <label class="fn-none" for="private-chat-with">输入用户名</label>
              <input
                id="private-chat-with"
                v-model="chatWithName"
                autocomplete="off"
                maxlength="32"
                placeholder="输入用户名"
              />
              <button :disabled="starting || !chatWithName.trim()" type="submit">
                {{ starting ? "查询中…" : "发起聊天" }}
              </button>
            </form>
          </section>
        </section>
      </section>
    </div>
  </div>
</template>

<style scoped>
.private-chat-page {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  padding-block: clamp(0.75rem, 2.5vh, 1.25rem);
}
.private-chat-page > .wrapper {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
}
.private-chat {
  display: grid;
  flex: 1 1 0;
  min-height: 0;
  grid-template-columns: minmax(15rem, var(--private-chat-side-width)) 0.375rem minmax(0, 1fr);
  overflow: hidden;
}
.private-chat__sessions {
  border-right: 1px solid var(--layer-border-color);
  overflow-y: auto;
}
.private-chat__conversation > header {
  padding: 18px 20px;
  border-bottom: 1px solid var(--layer-border-color);
}
.private-chat__start {
  display: grid;
  grid-row: 1 / -1;
  min-height: 0;
  place-content: center;
  gap: 1rem;
  padding: 1.5rem;
  color: var(--text-fade-color);
  text-align: center;
}
.private-chat__start p {
  margin: 0;
  font-size: 0.875rem;
}
.private-chat__start form {
  display: flex;
  gap: 0.5rem;
  width: min(100%, 22rem);
}
.private-chat__start input {
  min-width: 0;
  flex: 1 1 auto;
  min-height: 2.25rem;
  padding: 0 0.625rem;
  border: 1px solid var(--layer-border-color);
  border-radius: 0.1875rem;
  background: var(--layer-background-color);
  color: var(--text-color);
  font: inherit;
}
.private-chat__start input:focus {
  border-color: var(--color-accent);
  outline: 0;
}
.private-chat__start button {
  min-height: 2.25rem;
  padding: 0 0.75rem;
  border: 0;
  border-radius: 0.1875rem;
  background: var(--color-accent);
  color: #fff;
  cursor: pointer;
  font: inherit;
  white-space: nowrap;
}
.private-chat__conversation > header span {
  margin: 4px 0 0;
  color: var(--text-fade-color);
  font-size: 12px;
}
.private-chat__session {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 14px 20px;
  border: 0;
  border-bottom: 1px solid var(--layer-border-color);
  background: transparent;
  color: var(--text-color);
  text-align: left;
  cursor: pointer;
  transition: none !important;
}
.private-chat__session:hover,
.private-chat__session:focus-visible,
.private-chat__session--selected {
  background: var(--background-secondary-color);
  outline: none;
}
.private-chat__session:active {
  box-shadow: none !important;
  transform: none !important;
}
.private-chat__session:hover,
.private-chat__session:focus-visible {
  animation: none !important;
  box-shadow: none !important;
  transform: none !important;
}
.private-chat__session-content {
  min-width: 0;
  flex: 1 1 auto;
}
.private-chat__session-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.private-chat__session-title > :first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.private-chat__presence {
  flex: 0 0 auto;
  color: var(--text-fade-color);
  font-size: 0.75rem;
}
.private-chat__presence--online {
  color: var(--color-success);
}
.private-chat__session-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0 0;
  min-width: 0;
}
.private-chat__session-preview > :first-child {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-fade-color);
  white-space: nowrap;
}
.private-chat__badge {
  display: inline-grid;
  min-width: 1.25rem;
  height: 1.25rem;
  flex: 0 0 auto;
  place-items: center;
  padding: 0 0.3125rem;
  border-radius: 0.625rem;
  background: var(--color-accent);
  color: #fff;
  font-size: 12px;
  line-height: 1;
}
.private-chat__conversation {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) 0.375rem minmax(20%, var(--private-chat-composer-height));
  min-width: 0;
  min-height: 0;
}
.private-chat__conversation > header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.private-chat__conversation main {
  display: flex;
  flex-direction: column;
  padding: clamp(1rem, 2.4vh, 1.5rem) clamp(1.25rem, 2.8vw, 2rem);
  overflow-y: auto;
}
.private-chat__timeline-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.private-chat__message {
  display: flex;
  max-width: 75%;
  overflow-wrap: anywhere;
}
.private-chat__message--self {
  align-self: flex-end;
}
.private-chat__bubble {
  min-width: min(12rem, 100%);
  padding: 0.55rem 0.875rem 0.5rem;
  border-radius: 0.25rem;
  background: var(--background-secondary-color);
}
.private-chat__message--self .private-chat__bubble {
  text-align: right;
}
.private-chat__message :deep(p) {
  margin: 0;
}
.private-chat__content :deep(p) {
  margin: 0;
}
.private-chat__new-messages {
  position: sticky;
  z-index: 1;
  right: 0;
  bottom: 0.25rem;
  align-self: flex-end;
  margin-top: auto;
  padding: 0 0.75rem;
  border: 0;
  border-radius: 999px;
  background: var(--color-accent);
  color: #fff;
  cursor: pointer;
  font-size: 0.75rem;
  line-height: 1.75rem;
}
.private-chat__message time {
  display: block;
  margin-top: 5px;
  color: var(--text-fade-color);
  font-size: 11px;
}
.private-chat__bubble footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 0.3125rem;
}
.private-chat__message-actions {
  position: relative;
  margin-left: 0.5rem;
}
.private-chat__message-actions summary {
  display: grid;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  list-style: none;
  place-items: center;
  color: var(--text-fade-color);
  cursor: pointer;
}
.private-chat__message-actions summary::-webkit-details-marker {
  display: none;
}
.private-chat__message-actions :deep(.icon) {
  width: 0.875rem;
  height: 0.875rem;
}
.private-chat__message-actions summary:hover,
.private-chat__message-actions summary:focus-visible {
  color: var(--color-accent);
  outline: 0;
}
.private-chat__message-actions menu {
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
.private-chat__message-actions menu button {
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
.private-chat__message-actions menu button:hover,
.private-chat__message-actions menu button:focus-visible {
  background: transparent;
  box-shadow: none !important;
  color: var(--color-accent);
  outline: 0;
  transform: none !important;
}
.private-chat__revoked {
  color: var(--text-fade-color);
  font-style: italic;
}
.private-chat__red-packet {
  margin: 0;
  padding: 8px 10px;
  border-radius: 4px;
  background: #fff2ef;
  color: #db5a45;
}
.private-chat__composer {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
  padding: 0 0.875rem 0.625rem;
  overflow: hidden;
  background: var(--layer-background-color);
}
.private-chat__composer :deep(.editor-shell),
.private-chat__composer :deep(.vditor),
.private-chat__composer :deep(.vditor-content),
.private-chat__composer :deep(.vditor-ir),
.private-chat__composer :deep(.vditor-wysiwyg),
.private-chat__composer :deep(.vditor-sv) {
  height: 100% !important;
  min-height: 0;
  border: 0;
  box-shadow: none !important;
}
.private-chat__composer :deep(.vditor-toolbar) {
  display: none;
}
.private-chat__composer :deep(.vditor-ir pre),
.private-chat__composer :deep(.vditor-wysiwyg),
.private-chat__composer :deep(.vditor-sv) {
  box-sizing: border-box;
  height: 100%;
  padding: 0 !important;
  overflow-y: auto !important;
  background: var(--layer-background-color);
}
.private-chat__composer-tools {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 2.5rem;
}
.private-chat__composer-tools button {
  display: grid;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  place-items: center;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
}
.private-chat__composer-tools button:hover,
.private-chat__composer-tools button:focus-visible {
  color: var(--color-accent);
  box-shadow: none;
  outline: 0;
  transform: none;
}
.private-chat__composer-tools :deep(.icon) {
  width: 1.375rem;
  height: 1.375rem;
}
.private-chat__composer footer {
  display: flex;
  align-items: center;
  min-height: 1.875rem;
  color: var(--text-fade-color);
  font-size: 0.75rem;
}
.private-chat__send-control {
  position: relative;
  display: flex;
  margin-left: auto;
}
.private-chat__send,
.private-chat__send-menu {
  min-height: 1.75rem;
  border: 0;
  background: var(--color-accent);
  color: #fff;
  cursor: pointer;
  font: inherit;
  transition: none;
}
.private-chat__send {
  min-width: 3.5rem;
  border-radius: 0.1875rem 0 0 0.1875rem;
}
.private-chat__send-menu {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.625rem;
  padding: 0;
  border-left: 1px solid rgb(255 255 255 / 35%);
  border-radius: 0 0.1875rem 0.1875rem 0;
}
.private-chat__send-menu::before {
  width: 0.375rem;
  height: 0.375rem;
  border-right: 0.09375rem solid currentColor;
  border-bottom: 0.09375rem solid currentColor;
  content: "";
  transform: translateY(-0.09375rem) rotate(45deg);
}
.private-chat__send:hover,
.private-chat__send:focus-visible,
.private-chat__send-menu:hover,
.private-chat__send-menu:focus-visible {
  box-shadow: none;
  outline: 0;
  transform: none;
}
.private-chat__shortcut-menu {
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
.private-chat__shortcut-menu button {
  min-height: 2.25rem;
  padding: 0 0.875rem 0 2rem;
  border: 0;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  font: inherit;
  text-align: left;
}
.private-chat__shortcut-menu button:hover,
.private-chat__shortcut-option--selected {
  background: var(--background-secondary-color) !important;
}
.private-chat__shortcut-option--selected::before {
  position: absolute;
  margin-left: -1.125rem;
  content: "✓";
}
.private-chat__splitter {
  z-index: 2;
  border: 0;
  padding: 0;
  background: var(--layer-border-color);
  cursor: pointer;
  opacity: 0.65;
  transition:
    background-color 0.15s ease,
    opacity 0.15s ease;
}
.private-chat__splitter:hover,
.private-chat__splitter:focus-visible {
  background: var(--color-accent);
  opacity: 1;
  outline: 0;
}
.private-chat__splitter--vertical {
  cursor: col-resize;
}
.private-chat__splitter--horizontal {
  cursor: row-resize;
}
.private-chat button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (max-width: 768px) {
  .private-chat-page {
    padding: 10px 0;
  }
  .private-chat {
    grid-template-columns: 1fr;
  }
  .private-chat__sessions {
    max-height: 38dvh;
    border-right: 0;
    border-bottom: 1px solid var(--layer-border-color);
  }
  .private-chat__splitter--vertical {
    display: none;
  }
  .private-chat__conversation > header,
  .private-chat__session,
  .private-chat__conversation main,
  .private-chat__composer {
    padding-right: 14px;
    padding-left: 14px;
  }
}
</style>
