import type { ReqArticle, ReqArticleTypeEnum } from "@bass/bbs-sdk-fetch/models/ReqArticle";

export interface LocalArticleDraft {
  id: string;
  articleId?: string;
  article: ReqArticle;
  tagNames: string[];
  updatedAt: string;
}

const storageKey = "treble.article-drafts.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadDrafts() {
  if (!canUseStorage()) return [] as LocalArticleDraft[];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(
      (draft): draft is LocalArticleDraft =>
        typeof draft === "object" &&
        draft !== null &&
        typeof draft.id === "string" &&
        typeof draft.updatedAt === "string" &&
        Array.isArray(draft.tagNames) &&
        typeof draft.article === "object" &&
        draft.article !== null &&
        typeof draft.article.title === "string" &&
        typeof draft.article.content === "string" &&
        typeof draft.article.type === "string",
    );
  } catch {
    return [];
  }
}

function writeDrafts(drafts: LocalArticleDraft[]) {
  if (canUseStorage()) window.localStorage.setItem(storageKey, JSON.stringify(drafts));
}

export function listLocalArticleDrafts() {
  return loadDrafts().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getLocalArticleDraft(id: string) {
  return loadDrafts().find((draft) => draft.id === id);
}

export function saveLocalArticleDraft(draft: Omit<LocalArticleDraft, "id" | "updatedAt"> & { id?: string }) {
  const drafts = loadDrafts();
  const next: LocalArticleDraft = {
    ...draft,
    id: draft.id || crypto.randomUUID(),
    article: { ...draft.article },
    tagNames: [...draft.tagNames],
    updatedAt: new Date().toISOString(),
  };
  const index = drafts.findIndex((item) => item.id === next.id);
  if (index < 0) drafts.push(next);
  else drafts[index] = next;
  writeDrafts(drafts);
  return next;
}

export function removeLocalArticleDraft(id: string) {
  writeDrafts(loadDrafts().filter((draft) => draft.id !== id));
}
