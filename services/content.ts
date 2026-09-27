import type { ReqArticle } from "@bass/bbs-sdk-fetch/models/ReqArticle";
import type { RespTag } from "@bass/bbs-sdk-fetch/models/RespTag";
import { bbsClient } from "@/utils/sdk";

export async function saveArticleDraft(article: ReqArticle, articleId?: string) {
  if (articleId) {
    return bbsClient.article.updateDraft({ updateDraftArticleReq: { articleId, article } });
  }
  return bbsClient.article.createDraft({ createDraftArticleReq: { article } });
}

export async function synchronizeArticleTags(
  articleId: string,
  savedTagIds: string[],
  tagNames: string[],
  availableTags: RespTag[],
) {
  const tagsByName = new Map(
    availableTags.flatMap((tag) => (tag.id && tag.name ? [[tag.name.toLocaleLowerCase(), tag] as const] : [])),
  );
  const tagIds: string[] = [];

  for (const name of tagNames) {
    const key = name.toLocaleLowerCase();
    let tag = tagsByName.get(key);
    if (!tag) {
      const response = await bbsClient.tag.create({
        createTagReq: {
          tag: {
            code: name,
            name,
            status: "TAG_STATUS_ENABLED",
          },
        },
      });
      tag = response.tag;
      if (!tag?.id) throw new Error(`创建标签“${name}”后未返回标签标识。`);
      availableTags.push(tag);
      tagsByName.set(key, tag);
    }
    if (tag.id) tagIds.push(tag.id);
  }

  const removedTagIds = savedTagIds.filter((id) => !tagIds.includes(id));
  const addedTagIds = tagIds.filter((id) => !savedTagIds.includes(id));
  if (removedTagIds.length) {
    await bbsClient.tag.unbindArticle({ unbindArticleTagsReq: { articleId, tagIds: removedTagIds } });
  }
  if (addedTagIds.length) {
    await bbsClient.tag.bindArticle({ bindArticleTagsReq: { articleId, tagIds: addedTagIds } });
  }
  return tagIds;
}

export async function publishArticle(articleId: string) {
  await bbsClient.article.publish({ publishArticleReq: { articleId } });
}
