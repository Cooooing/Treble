<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import type { ArticleDetail } from "@bass/bbs-sdk-fetch/models/ArticleDetail";
import type { ReqArticle, ReqArticleTypeEnum } from "@bass/bbs-sdk-fetch/models/ReqArticle";
import type { RespTag } from "@bass/bbs-sdk-fetch/models/RespTag";
import { navigate } from "vike/client/router";
import ClientOnly from "@/components/ui/ClientOnly.vue";
import RichTextEditor from "@/components/content/RichTextEditor.vue";
import { message } from "@/components/feedback/message";
import Icon from "@/components/ui/Icon.vue";
import DraftInbox from "@/components/draft/DraftInbox.vue";
import ScheduledPublishControl from "@/components/article/ScheduledPublishControl.vue";
import { cancelArticleSchedule, publishArticle, saveArticleDraft, scheduleArticle, synchronizeArticleTags } from "@/services/content";
import {
  consumeServerArticleDraftRestore,
  getLocalArticleDraft,
  hasPendingServerArticleDraftRestore,
  removeLocalArticleDraft,
  saveLocalArticleDraft,
} from "@/services/localDrafts";
import { articleTypes } from "./index";
import { bbsClient } from "@/utils/sdk";

const props = defineProps<{ article?: ArticleDetail; type?: ReqArticleTypeEnum }>();
const type = (props.article?.type || props.type || "ARTICLE_TYPE_NORMAL") as ReqArticleTypeEnum;
const form = reactive<ReqArticle>({
  title: props.article?.title || "",
  content: props.article?.content || "",
  type,
  statement: props.article?.statement || "",
  commentable: props.article?.commentable ?? true,
  rewardContent: props.article?.rewardContent || "",
  rewardPoints: props.article?.rewardPoints,
});
const currentType = articleTypes.find((item) => item.type === type);
const loading = ref(false);
const scheduled = ref(Boolean(props.article?.publishedAt && new Date(props.article.publishedAt).getTime() > Date.now()));
const rewardOpen = ref(Boolean(props.article?.rewardContent || props.article?.rewardPoints));
const draftInboxOpen = ref(false);
const availableTags = ref<RespTag[]>([]);
const tagNames = ref<string[]>([]);
const savedTagIds = ref<string[]>([]);
const tagQuery = ref("");
const tagMenuOpen = ref(false);
const recoveryDraftSavedToServer = ref(Boolean(props.article?.id));
const articleId = ref(props.article?.id);
let localSaveTimer: ReturnType<typeof window.setTimeout> | undefined;
let formInitialized = false;
let retainLocalRecovery = true;

const matchingTags = computed(() => {
  const keyword = tagQuery.value.trim().toLocaleLowerCase();
  return availableTags.value.filter(
    (tag) =>
      tag.name &&
      !tagNames.value.some((name) => name.toLocaleLowerCase() === tag.name?.toLocaleLowerCase()) &&
      (!keyword || tag.name.toLocaleLowerCase().includes(keyword)),
  );
});

function normalizeTagName(value: string) {
  return value.trim().replace(/[,，、；;]/g, "");
}

function saveLocalDraft(savedToServer = false) {
  if (hasPendingServerArticleDraftRestore(type)) return;
  const draft = saveLocalArticleDraft({
    articleId: articleId.value,
    article: { ...form },
    tagNames: tagNames.value,
    savedToServer,
  });
  recoveryDraftSavedToServer.value = draft?.savedToServer || false;
}

function queueLocalDraftSave() {
  if (localSaveTimer) window.clearTimeout(localSaveTimer);
  localSaveTimer = window.setTimeout(() => saveLocalDraft(false), 100);
}

function selectTagName(name: string) {
  const normalized = normalizeTagName(name);
  if (!normalized) return;
  if (Array.from(normalized).length > 9) {
    message.warning("每个标签最多 9 个字符。");
    return;
  }
  if (tagNames.value.some((item) => item.toLocaleLowerCase() === normalized.toLocaleLowerCase())) {
    message.warning("该标签已添加。");
    return;
  }
  if (tagNames.value.length >= 4) {
    message.warning("最多添加 4 个标签。");
    return;
  }
  tagNames.value = [...tagNames.value, normalized];
  tagQuery.value = "";
  tagMenuOpen.value = false;
}

function removeTag(name: string) {
  tagNames.value = tagNames.value.filter((item) => item !== name);
}

function confirmTypedTag() {
  selectTagName(tagQuery.value);
}

function handleTagKeydown(event: KeyboardEvent) {
  if (event.ctrlKey && event.key === "Enter") {
    event.preventDefault();
    void save(true);
    return;
  }
  if (event.key === "Enter" || [",", "，", "、", "；", ";"].includes(event.key)) {
    event.preventDefault();
    confirmTypedTag();
    return;
  }
  if (event.key === "Backspace" && !tagQuery.value) {
    const lastTag = tagNames.value.at(-1);
    if (lastTag) removeTag(lastTag);
    return;
  }
  if (event.key === "Escape") tagMenuOpen.value = false;
}

function cleanedForm(): ReqArticle {
  return {
    ...form,
    title: form.title.trim(),
    content: form.content.trim(),
    statement: form.statement?.trim() || undefined,
    rewardContent: form.rewardContent?.trim() || undefined,
  };
}

async function loadTags(keepLocalTagNames = false) {
  const [tags, articleTags] = await Promise.all([
    bbsClient.tag.list({ listTagsReq: { page: { page: 1, size: 100 }, query: { status: "TAG_STATUS_ENABLED" } } }),
    articleId.value
      ? bbsClient.tag.listArticleTags({ listArticleTagsReq: { articleId: articleId.value } })
      : Promise.resolve({ rows: [] as RespTag[] }),
  ]);
  const seenTagIDs = new Set<string>();
  const linkedTags = [...(articleTags.rows || []), ...(props.article?.tags || [])].filter((tag) => {
    if (!tag.id) return Boolean(tag.name);
    if (seenTagIDs.has(tag.id)) return false;
    seenTagIDs.add(tag.id);
    return true;
  });
  availableTags.value = [
    ...(tags.rows || []),
    ...linkedTags.filter((tag) => !tags.rows?.some((item) => item.id === tag.id)),
  ];
  savedTagIds.value = linkedTags.flatMap((tag) => (tag.id ? [tag.id] : []));
  if (!keepLocalTagNames) tagNames.value = linkedTags.flatMap((tag) => (tag.name ? [tag.name] : []));
}

async function save(publish: boolean): Promise<string | undefined> {
  if (!form.title.trim()) return void message.warning("请输入文章标题。");
  if (!form.content.trim()) return void message.warning("请输入文章内容。");
  confirmTypedTag();
  if (rewardOpen.value && !form.rewardContent?.trim()) return void message.warning("请输入打赏内容，或收起打赏设置。");
  if (rewardOpen.value && (!form.rewardPoints || form.rewardPoints < 1))
    return void message.warning("打赏积分必须大于 0。");
  loading.value = true;
  try {
    saveLocalDraft(false);
    const draft = await saveArticleDraft(cleanedForm(), articleId.value);
    const id = draft.articleId;
    if (!id) throw new Error("保存草稿后未返回文章标识。");
    articleId.value = id;
    const tagIds = await synchronizeArticleTags(id, savedTagIds.value, tagNames.value, availableTags.value);
    savedTagIds.value = tagIds;
    saveLocalDraft(true);
    if (!publish) {
      message.success("草稿已保存。");
      return id;
    }
    await publishArticle(id);
    retainLocalRecovery = false;
    removeLocalArticleDraft(type);
    await navigate(`/article/${id}`);
    return id;
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "保存失败，请稍后重试。");
    return undefined;
  } finally {
    loading.value = false;
  }
}

async function schedule(scheduledAt: Date) {
  const id = await save(false);
  if (!id) return;
  loading.value = true;
  try {
    await scheduleArticle(id, scheduledAt);
    saveLocalDraft(true);
    scheduled.value = true;
    message.success("已设置定时发布。");
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "定时发布设置失败，请稍后重试。");
  } finally {
    loading.value = false;
  }
}

async function cancelSchedule() {
  if (!articleId.value) return;
  loading.value = true;
  try {
    await cancelArticleSchedule(articleId.value);
    scheduled.value = false;
    message.success("已取消定时发布。");
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "取消定时发布失败，请稍后重试。");
  } finally {
    loading.value = false;
  }
}

function openDraftInbox() {
  saveLocalDraft(recoveryDraftSavedToServer.value);
  draftInboxOpen.value = true;
}

onMounted(async () => {
  tagQuery.value = "";
  tagMenuOpen.value = false;
  const restoringServerDraft = consumeServerArticleDraftRestore(props.article?.id, type);
  const draft = getLocalArticleDraft(type);
  const shouldRestoreLocalDraft =
    !restoringServerDraft &&
    Boolean(draft && !draft.savedToServer && (!props.article || draft.articleId === props.article.id));
  if (shouldRestoreLocalDraft && draft) {
    articleId.value = draft.articleId || articleId.value;
    Object.assign(form, draft.article);
    tagNames.value = [...draft.tagNames];
    rewardOpen.value = Boolean(draft.article.rewardContent || draft.article.rewardPoints);
    recoveryDraftSavedToServer.value = false;
  }
  try {
    await loadTags(shouldRestoreLocalDraft);
  } catch (cause) {
    message.error(cause instanceof Error ? cause.message : "标签加载失败，请刷新页面后重试。");
  } finally {
    formInitialized = true;
  }
});

watch(
  [form, tagNames],
  () => {
    if (!formInitialized) return;
    recoveryDraftSavedToServer.value = false;
    queueLocalDraftSave();
  },
  { deep: true },
);
onBeforeUnmount(() => {
  if (localSaveTimer) window.clearTimeout(localSaveTimer);
  if (retainLocalRecovery) saveLocalDraft(recoveryDraftSavedToServer.value);
});
</script>

<template>
  <div class="main post-page post">
    <form class="form" novalidate @submit.prevent="save(true)" @keydown.ctrl.enter.prevent="save(true)">
      <label class="sr-only" for="articleTitle">文章标题</label>
      <input
        id="articleTitle"
        v-model="form.title"
        type="text"
        maxlength="120"
        autocomplete="off"
        placeholder="标题"
        :disabled="loading"
        required
      />

      <section class="post-article-content" aria-label="文章内容">
        <ClientOnly>
          <RichTextEditor
            id="articleContent"
            v-model="form.content"
            :name="articleId ? `article-${articleId}` : `post-${type}`"
            height="500px"
            :options="{
              placeholder: currentType?.editorHint,
              outline: { enable: true, position: 'left' },
              typewriterMode: true,
              preview: { mode: 'both' },
              resize: { enable: true, position: 'bottom' },
            }"
          />
        </ClientOnly>
      </section>

      <section class="tags-wrap tag_selection" aria-label="文章标签">
        <label class="sr-only" for="articleTags">文章标签</label>
        <div class="tags-input">
          <span v-for="name in tagNames" :key="name" class="tag tag--selected">
            {{ name }}
            <button type="button" :aria-label="`移除标签 ${name}`" :disabled="loading" @click="removeTag(name)">
              ×
            </button>
          </span>
          <input
            id="articleTags"
            v-model="tagQuery"
            :disabled="loading || tagNames.length >= 4"
            autocomplete="off"
            maxlength="9"
            placeholder="标签（可选，逗号分隔，最多 4 个，每个最长 9 字符）"
            @focus="tagMenuOpen = true"
            @click="tagMenuOpen = true"
            @input="tagMenuOpen = true"
            @blur="tagMenuOpen = false"
            @keydown="handleTagKeydown"
          />
        </div>
        <div v-if="tagMenuOpen && matchingTags.length" class="domains-tags" role="listbox" aria-label="标签建议">
          <button
            v-for="tag in matchingTags.slice(0, 12)"
            :key="tag.id || tag.name"
            type="button"
            class="tag"
            :disabled="loading"
            @pointerdown.prevent
            @click="selectTagName(tag.name || '')"
          >
            {{ tag.name }}
          </button>
        </div>
        <p v-else-if="tagMenuOpen && tagQuery.trim()" class="ft-fade article-tags__hint">
          按回车即可创建“{{ normalizeTagName(tagQuery) }}”标签。
        </p>
      </section>

      <button
        v-if="!rewardOpen"
        id="showReward"
        class="fn-ellipsis"
        type="button"
        :disabled="loading"
        @click="rewardOpen = true"
      >
        打赏区 1. 当设置了打赏积分后，将启用打赏功能 2. 启用打赏需要 20 积分 3. 打赏区的内容只有在浏览者打赏后才对其可见
        &dtrif;
      </button>
      <section v-if="rewardOpen" class="article-reward-content" aria-label="打赏设置">
        <label class="sr-only" for="articleRewardContent">打赏内容</label>
        <ClientOnly>
          <RichTextEditor
            id="articleRewardContent"
            v-model="form.rewardContent"
            :name="articleId ? `article-reward-${articleId}` : undefined"
            height="200px"
            :options="{ placeholder: '写下打赏后可见的内容', preview: { mode: 'editor' }, resize: { enable: false } }"
          />
        </ClientOnly>
        <label class="sr-only" for="articleRewardPoint">打赏积分</label>
        <input
          id="articleRewardPoint"
          v-model.number="form.rewardPoints"
          type="number"
          min="1"
          :disabled="loading"
          placeholder="打赏积分"
        />
      </section>

      <section class="wrapper post__footer">
        <div class="post__type">
          <Icon :name="currentType?.icon || 'article'" class="post__info" aria-hidden="true" />
          <span>{{ currentType?.name || "发布文章" }}</span>
          <span class="ft-gray">{{ currentType?.description }}</span>
        </div>
        <div class="article-settings">
          <div class="article-settings__options">
            <label class="article-anonymous article-settings__statement" for="articleStatement"
              >创作声明
              <select id="articleStatement" v-model="form.statement" :disabled="loading">
                <option value="">无声明</option>
                <option value="包含 AI 辅助创作">包含 AI 辅助创作</option>
                <option value="包含剧透">包含剧透</option>
                <option value="虚构演绎，仅供娱乐">虚构演绎，仅供娱乐</option>
              </select>
            </label>
            <label class="article-anonymous" for="articleCommentable"
              >允许回帖 <input id="articleCommentable" v-model="form.commentable" type="checkbox" :disabled="loading"
            /></label>
          </div>
          <div class="article-settings__actions article-post-actions">
            <button class="article-draft-action" type="button" :disabled="loading" @click="openDraftInbox">
              草稿箱
            </button>
            <button class="article-draft-action" type="button" :disabled="loading" @click="save(false)">
              {{ loading ? "正在保存..." : "存草稿" }}
            </button>
            <ScheduledPublishControl :disabled="loading" :scheduled="scheduled" @schedule="schedule" @cancel="cancelSchedule" />
            <button class="green article-publish-action" type="submit" :disabled="loading">
              {{ loading ? "正在发布..." : "发布" }}
            </button>
          </div>
        </div>
      </section>
    </form>
    <DraftInbox v-model="draftInboxOpen" />
  </div>
</template>

<style scoped>
.article-tags__hint {
  margin: 8px 0 0;
  font-size: 12px;
}
</style>
