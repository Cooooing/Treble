<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { message } from "@/components/feedback/message";
import { uploadMarkdownImageAsset } from "@/services/markdownImageUpload";
import { bbsClient } from "@/utils/sdk";

type Item = { id?: string; name?: string; imageUrl?: string };
type Group = { id?: string; name?: string; items?: Item[] };

const props = defineProps<{ anchor: HTMLElement }>();
const emit = defineEmits<{
  (event: "close"): void;
  (event: "select", markdown: string): void;
  (event: "pointerenter"): void;
  (event: "pointerleave"): void;
  (event: "dragstart"): void;
  (event: "dragend"): void;
}>();

const groups = ref<Group[]>([]);
const selectedGroupID = ref<string>();
const query = ref("");
const creatingName = ref("");
const manage = ref(false);
const editingGroupID = ref<string>();
const fileInput = ref<HTMLInputElement>();
const root = ref<HTMLElement>();
const position = ref({ top: 8, left: 8, maxHeight: 400 });
let panelObserver: ResizeObserver | undefined;
const groupInputs = new Map<string, HTMLInputElement>();
const itemInputs = new Map<string, HTMLInputElement>();
const draggingGroupID = ref<string>();
const draggingItemID = ref<string>();
const editingItemID = ref<string>();

const selectedGroup = computed(
  () => groups.value.find((group) => group.id === selectedGroupID.value) || groups.value[0],
);

function groupName(group?: Group) {
  return group?.name === "默认分组" ? "默认" : group?.name || "未命名分组";
}

function isDefaultGroup(group?: Group) {
  return group?.name === "默认分组";
}

async function load() {
  try {
    const response = await bbsClient.emoji.list({ listEmojiGroupsReq: { query: query.value.trim() } });
    groups.value = [...(response.rows || [])].sort(
      (left, right) => Number(isDefaultGroup(right)) - Number(isDefaultGroup(left)),
    );
    selectedGroupID.value = groups.value.some((group) => group.id === selectedGroupID.value)
      ? selectedGroupID.value
      : groups.value[0]?.id;
  } catch (error) {
    message.error(error instanceof Error ? error.message : "表情包加载失败");
  }
}

function updatePosition() {
  const bounds = props.anchor.getBoundingClientRect();
  const gap = 8;
  const width = Math.min(520, window.innerWidth - gap * 2);
  const below = window.innerHeight - bounds.bottom - gap;
  const above = bounds.top - gap;
  const panelHeight = root.value?.getBoundingClientRect().height || 360;
  const opensAbove = above >= panelHeight + gap || above > below;
  const availableHeight = opensAbove ? above : below;
  const maxHeight = Math.max(0, Math.min(440, availableHeight));
  const anchoredTop = Math.max(gap, bounds.top - Math.min(panelHeight, maxHeight) - gap);
  position.value = {
    left: Math.max(gap, Math.min(bounds.left + bounds.width / 2 - width * 0.382, window.innerWidth - width - gap)),
    top: opensAbove ? anchoredTop : bounds.bottom + gap,
    maxHeight,
  };
}

function closeOnOutside(event: PointerEvent) {
  const target = event.target as Node | null;
  if (!target || root.value?.contains(target) || props.anchor.contains(target)) return;
  emit("close");
}

function closeOnFocusOutside(event: FocusEvent) {
  const target = event.target as Node | null;
  if (!target || root.value?.contains(target) || props.anchor.contains(target)) return;
  emit("close");
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") emit("close");
}

function select(item: Item) {
  if (!item.imageUrl) return;
  emit("select", `![${item.name || ""}](${item.imageUrl})`);
  emit("close");
}

async function createGroup() {
  const name = creatingName.value.trim();
  if (!name) return;
  try {
    const response = await bbsClient.emoji.createGroup({ createEmojiGroupReq: { name } });
    if (response.group) {
      groups.value.push(response.group);
      selectedGroupID.value = response.group.id;
      creatingName.value = "";
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : "创建分组失败");
  }
}

async function upload(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files || []);
  if (files.length === 0) return;
  const notice = message.loading(`正在上传 0/${files.length} 个表情…`);
  let succeeded = 0;
  try {
    for (const [index, file] of files.entries()) {
      notice.close();
      const progress = message.loading(`正在上传 ${index + 1}/${files.length} 个表情…`);
      try {
        const image = await uploadMarkdownImageAsset(file);
        await bbsClient.emoji.addItem({
          addEmojiItemReq: { groupId: selectedGroup.value?.id, assetId: image.assetId, name: image.name },
        });
        succeeded++;
      } catch (error) {
        message.error(error instanceof Error ? error.message : `第 ${index + 1} 个表情上传失败`);
      } finally {
        progress.close();
      }
    }
    await load();
    if (succeeded > 0) message.success(`已添加 ${succeeded}/${files.length} 个表情。`);
  } finally {
    if (fileInput.value) fileInput.value.value = "";
  }
}

async function renameGroup(group: Group) {
  if (!group.id || !group.name?.trim()) return;
  try {
    await bbsClient.emoji.renameGroup({ renameEmojiGroupReq: { groupId: group.id, name: group.name.trim() } });
  } catch (error) {
    message.error(error instanceof Error ? error.message : "修改分组失败");
  } finally {
    editingGroupID.value = undefined;
  }
}

async function beginRenameGroup(group: Group) {
  if (!group.id) return;
  editingGroupID.value = group.id;
  await nextTick();
  const input = groupInputs.get(group.id);
  input?.focus();
  input?.select();
}

function setGroupInput(groupID: string | undefined, element: Element | null) {
  if (!groupID) return;
  if (element instanceof HTMLInputElement) {
    groupInputs.set(groupID, element);
    return;
  }
  groupInputs.delete(groupID);
}

async function renameItem(item: Item) {
  if (!item.id || !item.name?.trim()) return;
  try {
    await bbsClient.emoji.renameItem({ renameEmojiItemReq: { itemId: item.id, name: item.name.trim() } });
  } catch (error) {
    message.error(error instanceof Error ? error.message : "修改表情别名失败");
  } finally {
    editingItemID.value = undefined;
  }
}

async function beginRenameItem(item: Item) {
  if (!item.id) return;
  editingItemID.value = item.id;
  await nextTick();
  const input = itemInputs.get(item.id);
  input?.focus();
  input?.select();
}

function setItemInput(itemID: string | undefined, element: Element | null) {
  if (!itemID) return;
  if (element instanceof HTMLInputElement) {
    itemInputs.set(itemID, element);
    return;
  }
  itemInputs.delete(itemID);
}

async function deleteGroup(group: Group) {
  if (!group.id || !window.confirm(`确定删除分组“${groupName(group)}”及其中表情吗？`)) return;
  try {
    await bbsClient.emoji.deleteGroup({ deleteEmojiGroupReq: { groupId: group.id } });
    await load();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "删除分组失败");
  }
}

async function deleteItem(item: Item) {
  if (!item.id) return;
  try {
    await bbsClient.emoji.deleteItem({ deleteEmojiItemReq: { itemId: item.id } });
    await load();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "移除表情失败");
  }
}

async function reorderGroups(ids: string[]) {
  try {
    await bbsClient.emoji.reorderGroups({ reorderEmojiGroupsReq: { groupIds: ids } });
  } catch (error) {
    message.error(error instanceof Error ? error.message : "分组重排失败");
    await load();
  }
}

async function reorderItems(ids: string[]) {
  const group = selectedGroup.value;
  if (!group?.id) return;
  try {
    await bbsClient.emoji.reorderItems({ reorderEmojiItemsReq: { groupId: group.id, itemIds: ids } });
  } catch (error) {
    message.error(error instanceof Error ? error.message : "表情重排失败");
    await load();
  }
}

function dragGroupStart(group: Group) {
  if (isDefaultGroup(group)) return;
  draggingGroupID.value = group.id;
  emit("dragstart");
}

function dropGroup(target: Group) {
  const sourceID = draggingGroupID.value;
  draggingGroupID.value = undefined;
  emit("dragend");
  if (!sourceID || !target.id || sourceID === target.id || isDefaultGroup(target)) return;
  const source = groups.value.find((group) => group.id === sourceID);
  const targetIndex = groups.value.findIndex((group) => group.id === target.id);
  if (!source || targetIndex < 0) return;
  groups.value = groups.value.filter((group) => group.id !== sourceID);
  groups.value.splice(targetIndex, 0, source);
  void reorderGroups(groups.value.map((group) => group.id || ""));
}

function dragItemStart(item: Item) {
  draggingItemID.value = item.id;
  emit("dragstart");
}

function dropItem(target: Item) {
  const sourceID = draggingItemID.value;
  draggingItemID.value = undefined;
  emit("dragend");
  const items = selectedGroup.value?.items;
  if (!sourceID || !target.id || sourceID === target.id || !items) return;
  const source = items.find((item) => item.id === sourceID);
  const targetIndex = items.findIndex((item) => item.id === target.id);
  if (!source || targetIndex < 0) return;
  selectedGroup.value!.items = items.filter((item) => item.id !== sourceID);
  selectedGroup.value!.items.splice(targetIndex, 0, source);
  void reorderItems(selectedGroup.value!.items.map((item) => item.id || ""));
}

async function moveItemToGroup(target: Group) {
  const itemID = draggingItemID.value;
  draggingItemID.value = undefined;
  emit("dragend");
  if (!itemID || !target.id || target.id === selectedGroup.value?.id) return;
  try {
    await bbsClient.emoji.moveItem({ moveEmojiItemReq: { itemId: itemID, groupId: target.id } });
    await load();
    selectedGroupID.value = target.id;
  } catch (error) {
    message.error(error instanceof Error ? error.message : "移动表情失败");
  }
}

async function createShare() {
  if (!selectedGroup.value?.id) return;
  try {
    const response = await bbsClient.emoji.createShare({ createEmojiShareReq: { groupId: selectedGroup.value.id } });
    if (!response.code) throw new Error("分享码生成失败。");
    if (await writeClipboardText(response.code)) {
      message.success("分享码已复制，七天内有效。");
      return;
    }
    window.prompt("浏览器不支持自动复制，请手动复制分享码：", response.code);
  } catch (error) {
    message.error(error instanceof Error ? error.message : "生成分享码失败");
  }
}

async function importShare() {
  try {
    const code = (await readClipboardText()).trim();
    if (!code) throw new Error("剪贴板没有分享码。");
    await bbsClient.emoji.importShare({ importEmojiShareReq: { code } });
    await load();
    message.success("表情分组已导入。");
  } catch (error) {
    message.error("分享码过期或无效");
  }
}

async function writeClipboardText(value: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through for HTTP, permission-denied and compatibility environments.
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

async function readClipboardText() {
  try {
    if (navigator.clipboard?.readText) return await navigator.clipboard.readText();
  } catch {
    // A manual input prompt remains available when clipboard permissions are denied.
  }
  return window.prompt("请粘贴表情分组分享码：") || "";
}

function toggleManage() {
  manage.value = !manage.value;
  editingGroupID.value = undefined;
  void nextTick(updatePosition);
}

onMounted(async () => {
  await nextTick();
  updatePosition();
  await nextTick();
  updatePosition();
  document.addEventListener("pointerdown", closeOnOutside);
  document.addEventListener("focusin", closeOnFocusOutside);
  document.addEventListener("keydown", closeOnEscape);
  window.addEventListener("resize", updatePosition);
  if (root.value) {
    panelObserver = new ResizeObserver(updatePosition);
    panelObserver.observe(root.value);
  }
  void load();
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", closeOnOutside);
  document.removeEventListener("focusin", closeOnFocusOutside);
  document.removeEventListener("keydown", closeOnEscape);
  window.removeEventListener("resize", updatePosition);
  panelObserver?.disconnect();
});
</script>

<template>
  <section
    ref="root"
    :style="{ left: `${position.left}px`, top: `${position.top}px`, maxHeight: `${position.maxHeight}px` }"
    class="emoji-picker"
    aria-label="表情包"
    role="dialog"
    @click.stop
    @pointerdown.stop
    @pointerenter="emit('pointerenter')"
    @pointerleave="emit('pointerleave')"
  >
    <header class="emoji-picker__header">
      <input v-model="query" aria-label="搜索表情别名" placeholder="搜索表情" @input="load" />
      <nav aria-label="表情包操作">
        <button type="button" @click="createShare">分享</button><button type="button" @click="importShare">导入</button
        ><button :aria-pressed="manage" type="button" @click="toggleManage">管理</button>
      </nav>
    </header>
    <main>
      <aside>
        <div
          v-for="group in groups"
          :key="group.id"
          :class="{ active: group.id === selectedGroup?.id, 'is-dragging': draggingGroupID === group.id, 'is-drop-target': draggingItemID && group.id !== selectedGroup?.id }"
          class="emoji-picker__group"
          @dragover.prevent
          @drop="draggingItemID ? moveItemToGroup(group) : dropGroup(group)"
        >
          <button
            v-if="manage && !isDefaultGroup(group)"
            aria-label="拖动分组排序"
            class="emoji-picker__drag"
            draggable="true"
            type="button"
            @dragend="emit('dragend')"
            @dragstart="dragGroupStart(group)"
          >
            ⠿
          </button>
          <input
            v-if="manage && editingGroupID === group.id"
            :ref="(element) => setGroupInput(group.id, element)"
            v-model="group.name"
            aria-label="分组名称"
            maxlength="32"
            @blur="renameGroup(group)"
            @keydown.enter.prevent="renameGroup(group)"
          />
          <button v-else type="button" @click="selectedGroupID = group.id">
            {{ groupName(group) }}
          </button>
          <button
            v-if="manage && !isDefaultGroup(group)"
            :aria-label="`重命名${groupName(group)}分组`"
            class="emoji-picker__edit"
            type="button"
            @click="beginRenameGroup(group)"
          >
            ✎
          </button>
          <button
            v-if="manage && !isDefaultGroup(group)"
            :aria-label="`删除${groupName(group)}分组`"
            class="emoji-picker__remove"
            type="button"
            @click="deleteGroup(group)"
          >
            ×
          </button>
        </div>
        <form v-if="manage" class="emoji-picker__new-group" @submit.prevent="createGroup">
          <input v-model="creatingName" aria-label="新分组名称" maxlength="32" placeholder="新分组" /><button
            aria-label="新建分组"
            type="submit"
          >
            ＋
          </button>
        </form>
      </aside>
      <section class="emoji-picker__items">
        <p v-if="!selectedGroup">暂无表情。</p>
        <div v-else class="emoji-picker__grid">
          <article
            v-for="item in selectedGroup.items || []"
            :key="item.id"
            :class="{ 'is-dragging': draggingItemID === item.id }"
            class="emoji-picker__item"
            draggable="true"
            @dragend="emit('dragend')"
            @dragover.prevent
            @dragstart="dragItemStart(item)"
            @drop="dropItem(item)"
          >
            <button :aria-label="item.name || '图片表情'" type="button" @click="select(item)">
              <img :alt="item.name || '图片表情'" :src="item.imageUrl" />
            </button>
            <div class="emoji-picker__item-name">
              <input v-if="manage && editingItemID === item.id" :ref="(element) => setItemInput(item.id, element)" v-model="item.name" aria-label="表情别名" maxlength="64" @blur="renameItem(item)" @keydown.enter.prevent="renameItem(item)" />
              <span v-else>{{ item.name || "图片表情" }}</span>
              <button v-if="manage" :aria-label="`重命名${item.name || '图片表情'}`" class="emoji-picker__edit" type="button" @click="beginRenameItem(item)">✎</button>
            </div>
            <button
              v-if="manage"
              :aria-label="`从${groupName(selectedGroup)}移除表情`"
              class="emoji-picker__remove"
              type="button"
              @click="deleteItem(item)"
            >
              ×
            </button>
          </article>
          <article class="emoji-picker__upload-item">
            <button aria-label="上传表情图片" class="upload" type="button" @click="fileInput?.click()">＋</button>
            <span>上传表情</span>
          </article>
        </div>
      </section>
    </main>
    <footer class="fn-none">
      <input
        ref="fileInput"
        accept="image/gif,image/jpeg,image/png,image/webp"
        class="fn-none"
        multiple
        type="file"
        @change="upload"
      />
    </footer>
  </section>
</template>

<style scoped>
.emoji-picker {
  position: fixed;
  z-index: 20;
  display: grid;
  width: min(36rem, calc(100dvw - 1.5rem));
  min-height: 18rem;
  overflow: hidden;
  border: 1px solid var(--layer-border-color);
  border-radius: 0.375rem;
  background: var(--layer-background-color);
  box-shadow: 0 0.75rem 2rem rgb(0 0 0 / 16%);
  animation: emoji-picker-in 0.14s ease-out;
  grid-template-rows: auto minmax(0, 1fr);
}
@keyframes emoji-picker-in {
  from {
    opacity: 0;
    transform: translateY(0.375rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.emoji-picker__header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem;
  border-bottom: 1px solid var(--layer-border-color);
}
.emoji-picker__header > input {
  min-width: 0;
  flex: 1;
}
.emoji-picker__header nav {
  display: flex;
  gap: 0.125rem;
}
.emoji-picker input {
  min-width: 0;
  height: 2rem;
  padding: 0 0.625rem;
  border: 1px solid var(--layer-border-color);
  border-radius: 0.1875rem;
  background: transparent;
  color: var(--text-color);
  font: inherit;
  font-size: 0.8125rem;
}
.emoji-picker button {
  min-height: 2rem;
  padding: 0 0.5rem;
  border: 0;
  border-radius: 0.1875rem;
  background: transparent;
  box-shadow: none !important;
  color: var(--text-color);
  cursor: pointer;
  font: inherit;
  transform: none !important;
  transition: none !important;
}
.emoji-picker button:hover,
.emoji-picker button:focus-visible,
.emoji-picker .active {
  background: var(--background-secondary-color);
  box-shadow: none !important;
  color: var(--color-accent);
  outline: 0;
  transform: none !important;
}
.emoji-picker main {
  display: grid;
  min-height: 0;
  grid-template-columns: minmax(8rem, 28%) minmax(0, 1fr);
}
.emoji-picker aside {
  overflow-y: auto;
  padding: 0.5rem;
  border-right: 1px solid var(--layer-border-color);
}
.emoji-picker__group {
  display: flex;
  align-items: center;
  gap: 0.125rem;
}
.emoji-picker__group:hover,
.emoji-picker__group:focus-within {
  background: var(--background-secondary-color);
}
.emoji-picker__group.is-dragging,
.emoji-picker__item.is-dragging {
  opacity: 0.45;
}
.emoji-picker__group.active {
  background: var(--background-secondary-color);
}
.emoji-picker__group.is-drop-target {
  outline: 1px dashed var(--color-accent);
  outline-offset: -1px;
}
.emoji-picker__group > input,
.emoji-picker__group > button:not(.emoji-picker__drag):not(.emoji-picker__edit):not(.emoji-picker__remove) {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.emoji-picker__group input {
  width: 100%;
}
.emoji-picker__new-group {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.375rem;
}
.emoji-picker__new-group input {
  width: 100%;
}
.emoji-picker__items {
  min-width: 0;
  overflow-y: auto;
  padding: 0.75rem;
}
.emoji-picker__items p {
  margin: 0;
  color: var(--text-fade-color);
  font-size: 0.8125rem;
}
.emoji-picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5.25rem, 1fr));
  grid-auto-rows: 6.875rem;
  gap: 0.875rem;
  align-content: start;
}
.emoji-picker__item,
.emoji-picker__upload-item {
  position: relative;
  display: grid;
  min-width: 0;
  height: 6.875rem;
  grid-template-rows: 5.25rem 1.25rem;
  gap: 0.375rem;
}
.emoji-picker__item {
}
.emoji-picker__item > :first-child,
.emoji-picker .upload {
  display: grid;
  width: 100%;
  min-height: 0 !important;
  height: 5.25rem;
  box-sizing: border-box;
  padding: 0.25rem !important;
  place-items: center;
}
.emoji-picker__item > :first-child {
  overflow: hidden;
  background: var(--background-secondary-color);
}
.emoji-picker__item > :first-child:hover,
.emoji-picker__item > :first-child:focus-visible {
  background: var(--background-secondary-color);
  color: var(--color-accent);
  outline: 1px solid var(--color-accent);
  outline-offset: -1px;
}
.emoji-picker__item img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.emoji-picker .upload {
  border: 1px dashed var(--layer-border-color);
  border-radius: 0;
  color: var(--text-fade-color);
  font-size: 1.5rem;
}
.emoji-picker__upload-item > span { display: block; overflow: hidden; color: var(--text-fade-color); font-size: 0.6875rem; line-height: 1.25rem; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.emoji-picker__remove {
  display: grid;
  width: 1.375rem;
  min-height: 1.375rem !important;
  height: 1.375rem;
  padding: 0 !important;
  border-radius: 50% !important;
  place-items: center;
  background: var(--background-secondary-color) !important;
  color: var(--text-fade-color) !important;
  font-size: 1rem;
  line-height: 1;
}
.emoji-picker__item > .emoji-picker__remove {
  position: absolute;
  top: 0;
  right: 0;
  border: 1px solid var(--layer-border-color);
}
.emoji-picker__item-name { display: flex; align-items: center; gap: 0.125rem; min-width: 0; height: 1.25rem; color: var(--text-fade-color); font-size: 0.6875rem; line-height: 1; }.emoji-picker__item-name span { min-width: 0; flex: 1; overflow: hidden; text-align: center; text-overflow: ellipsis; white-space: nowrap; }.emoji-picker__item-name input { min-width: 0; flex: 1; height: 1.125rem; padding: 0 0.1875rem; font-size: 0.6875rem; }.emoji-picker__item-name .emoji-picker__edit { display: grid; width: 1rem; min-width: 1rem; min-height: 1rem !important; height: 1rem; padding: 0 !important; place-items: center; color: var(--text-fade-color); font-size: 0.6875rem; }
.emoji-picker__group > .emoji-picker__remove {
  background: transparent !important;
}
.emoji-picker__group > .emoji-picker__edit {
  min-width: 1.375rem;
  padding: 0 !important;
  background: transparent;
  color: var(--text-fade-color);
}
.emoji-picker__drag {
  display: grid;
  width: 1.375rem;
  min-width: 1.375rem;
  max-width: 1.375rem;
  flex: 0 0 1.375rem;
  min-height: 1.375rem !important;
  height: 1.375rem;
  padding: 0 !important;
  place-items: center;
  color: var(--text-fade-color) !important;
  cursor: grab !important;
  font-size: 1rem !important;
  line-height: 1;
}
.emoji-picker__remove:hover,
.emoji-picker__remove:focus-visible {
  background: var(--background-secondary-color) !important;
  color: var(--color-danger, #d94b4b) !important;
}
@media (max-width: 480px) {
  .emoji-picker {
    width: calc(100dvw - 1rem);
  }
  .emoji-picker main {
    grid-template-columns: 6.5rem minmax(0, 1fr);
  }
  .emoji-picker__grid {
    grid-template-columns: repeat(auto-fill, minmax(3.5rem, 1fr));
    gap: 0.5rem;
  }
}
</style>
