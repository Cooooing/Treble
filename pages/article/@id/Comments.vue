<script setup lang="ts">
  import { IBasicPageResult } from '@/apis/common';
  import { addComment, IComment, ICommentPost } from '@/apis/comment';
  import { LayoutContextKey } from '@/pages/index';
  import { IArticle } from '@/apis/article';
  import Editor from '@/components/Editor/src/Editor.vue';
import { fromNow } from '@/utils/date';

  const props = defineProps<{
    article: IArticle
    comments: IBasicPageResult<IComment>;
  }>();

  const { pageContext } = inject(LayoutContextKey)!;
  const { user } = pageContext;

  const replyComment = ref<IComment | null>(null);
  const editorRef = ref<InstanceType<typeof Editor>>();
  function openCommentEditor(replyId?: string) {
    document.getElementById('commentEditor')?.showModal?.();
    replyComment.value = props.comments.rows?.find(comment => comment.id === replyId) || null;
    comment.value.reply_id = replyId;
  }
  function close() {
    document.getElementById('commentEditor')?.close?.();
    editorRef.value?.clearCache();
  }

  const comment = ref<ICommentPost>({
    article_id: props.article.id,
    content: '',
  })
  const error = ref<string>('');
  async function submit() {
    if (!comment.value.content || comment.value.content.trim().length === 0) {
      error.value = '评论内容不能为空';
      return;
    }
    error.value = '';
    await addComment(comment.value, error);
    close();
  }
</script>
<template>
  <article>
    <header class="border-b border-base-content/50">
      <h1 class="text-base mb-1 px-2">{{ comments.page.total || 0 }} 回帖</h1>
    </header>
    <main>
      <header class="flex items-center w-full p-0 my-2">
        <Avatar :url="user.avatar_url" :size="40" square />
        <div @click="openCommentEditor()" class="text-primary cursor-pointer border border-base-content/50 ml-3 flex h-10 flex-1 items-center px-3 rounded">
          <span>请输入回帖内容...</span>
        </div>
      </header>
      <main v-if="comments.rows?.length">
        <section v-for="comment in comments.rows" :key="comment.id" class="border-b border-base-content/50 pt-4 group">
          <section class="flex">
            <section>
              <Avatar :url="comment.user.avatar_url" :size="40" />
            </section>
            <section class="flex-1 ml-3">
              <section class="flex justify-between items-center">
                <div class="flex items-center gap-1 text-xs">
                  <section class="font-bold">{{ comment.user.name }}</section>
                  <span>·</span>
                  <section class="text-base-content/50">{{ fromNow(comment.created_at.seconds * 1000) }}</section>
                </div>
                <section></section>
              </section>
              <MdRender :md="comment.content" />
              <section class="flex items-center justify-end gap-2 group-hover:visible invisible">
                <button class="btn btn-text tooltip" @click="thankComment(comment.id)" data-tip="回复">
                  <Icon icon="si:heart-line" />
                </button>
                <button class="btn btn-text tooltip" @click="likeComment(comment.id)" data-tip="回复">
                  <Icon icon="streamline-plump:like-1" />
                </button>
                <button class="btn btn-text tooltip" @click="openCommentEditor(comment.id)" data-tip="回复">
                  <Icon icon="entypo:reply" />
                </button>
              </section>
            </section>
          </section>
        </section>
      </main>
      <Teleport to="#teleported">
        <dialog id="commentEditor" class="modal flex! items-end!">
          <div class="modal-box w-full! max-w-full!">
            <section class="wrapper">
              <header class="flex justify-between items-center pb-2">
                <section class="space-x-2">
                  <Icon icon="entypo:reply" class="scale-x-[-1]" />
                  <span v-if="replyComment"></span>
                  <span v-else>{{ article.title }}</span>
                </section>
                <section>
                  <Icon @click="close()" icon="bi:caret-down-fill" class="tooltip" data-tip="取消" />
                </section>
              </header>
              <main>
                <ClientOnly is="section">
                  <Editor ref="editorRef" name="comment" height="30vh" v-model="comment.content" />
                </ClientOnly>
                <div role="alert" class="alert alert-error alert-soft text-xs py-2" v-if="error">
                  <span>{{error}}</span>
                </div>
              </main>
              <footer class="flex justify-between pt-2">
                <section></section>
                <section>
                  <button class="btn btn-ghost btn-sm" @click="close()">取消</button>
                  <button class="btn btn-active btn-success btn-sm" @click="submit">提交</button>
                </section>
              </footer>
            </section>
          </div>
        </dialog>
      </Teleport>
    </main>
  </article>
</template>