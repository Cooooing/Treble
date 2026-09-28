import type { ReqArticle, ReqArticleTypeEnum } from "@bass/bbs-sdk-fetch/models/ReqArticle";

export interface LocalArticleDraft {
  id: string;
  articleId?: string;
  article: ReqArticle;
  tagNames: string[];
  savedToServer: boolean;
  updatedAt: string;
}

const storageKeyPrefix = "treble.article-drafts.";
const restoreIntentKey = "treble.article-draft-restore";

interface ServerArticleDraftRestoreIntent {
  articleId: string;
  type: ReqArticleTypeEnum;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function storageKey(type: ReqArticleTypeEnum) {
  return `${storageKeyPrefix}${type}`;
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function pendingServerArticleDraftRestore() {
  if (!canUseSessionStorage()) return undefined;
  try {
    const intent: unknown = JSON.parse(window.sessionStorage.getItem(restoreIntentKey) || "null");
    if (
      typeof intent !== "object" || intent === null ||
      typeof intent.articleId !== "string" || typeof intent.type !== "string"
    ) return undefined;
    return intent as ServerArticleDraftRestoreIntent;
  } catch {
    return undefined;
  }
}

function loadDraft(type: ReqArticleTypeEnum) {
  if (!canUseStorage()) return undefined;
  try {
    const draft: unknown = JSON.parse(window.localStorage.getItem(storageKey(type)) || "null");
    if (
      typeof draft !== "object" || draft === null ||
      typeof draft.id !== "string" || typeof draft.updatedAt !== "string" ||
      typeof draft.savedToServer !== "boolean" || !Array.isArray(draft.tagNames) ||
      typeof draft.article !== "object" || draft.article === null ||
      typeof draft.article.title !== "string" || typeof draft.article.content !== "string" || typeof draft.article.type !== "string"
    ) return undefined;
    return draft as LocalArticleDraft;
  } catch {
    return undefined;
  }
}

function hasContent(draft: Pick<LocalArticleDraft, "article" | "tagNames">) {
  return Boolean(draft.article.title.trim() || draft.article.content.trim() || draft.tagNames.length);
}

export function getLocalArticleDraft(type: ReqArticleTypeEnum) {
  return loadDraft(type);
}

export function hasUnsavedLocalArticleDraft(type: ReqArticleTypeEnum) {
  const draft = loadDraft(type);
  return Boolean(draft && !draft.savedToServer && hasContent(draft));
}

export function markServerArticleDraftRestore(articleId: string, type: ReqArticleTypeEnum) {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(restoreIntentKey, JSON.stringify({ articleId, type } satisfies ServerArticleDraftRestoreIntent));
}

export function hasPendingServerArticleDraftRestore(type: ReqArticleTypeEnum) {
  return pendingServerArticleDraftRestore()?.type === type;
}

export function consumeServerArticleDraftRestore(articleId: string | undefined, type: ReqArticleTypeEnum) {
  const intent = pendingServerArticleDraftRestore();
  if (!intent || intent.articleId !== articleId || intent.type !== type) return false;
  window.sessionStorage.removeItem(restoreIntentKey);
  return true;
}

export function saveLocalArticleDraft(draft: Omit<LocalArticleDraft, "id" | "updatedAt">) {
  if (!canUseStorage()) return undefined;
  const next: LocalArticleDraft = {
    ...draft,
    id: draft.article.type,
    article: { ...draft.article },
    tagNames: [...draft.tagNames],
    updatedAt: new Date().toISOString(),
  };
  if (!hasContent(next)) {
    removeLocalArticleDraft(next.article.type);
    return undefined;
  }
  window.localStorage.setItem(storageKey(next.article.type), JSON.stringify(next));
  return next;
}

export function removeLocalArticleDraft(type: ReqArticleTypeEnum) {
  if (canUseStorage()) window.localStorage.removeItem(storageKey(type));
}
