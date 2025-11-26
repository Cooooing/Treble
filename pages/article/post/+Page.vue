<script setup lang="ts">
  import { getObjOfUrl } from "@/utils";
  import { articleTypes } from "../index";
  import { usePageContext } from "vike-vue/usePageContext";
  import { addArticle, IArticlePost, ITag } from "@/apis/article";
import { RuleItem, VFormInstance } from "~/VForm";
import { navigate } from "vike/client/router";

  const pageContext = usePageContext();
  const isRaward = ref(false);
  const { type } = getObjOfUrl(pageContext.urlOriginal);
  const articleType = computed(() => {
    return articleTypes.find(
      (a) => a.type === Number(type)
    );
  });

  const data = ref<IArticlePost>({
    title: "",
    content: "",
    tags: [],
    rewardPoints: 0,
    bountyPoints: 0,
    anonymous: false,
    listable: true,
    commentable: true,
    statement: "无声明",
    rewardContent: '', 
    status: 0, 
    type,
  });

  const formRef = ref<VFormInstance>();
  const rules = computed(() => {
    const rules: Recordable<RuleItem[]> = {
      title: [{ required: true, message: "标题不能为空" }],
      tags: [
        {
          validator(_: any, value: ITag[], callback) {
            const tags = value.map((t) => t.name).filter((t) => t.length > 0);
            if (tags.length === 0) {
              return callback(new Error("标签不能为空"));
            }
            if (tags.length > 4) {
              return callback(new Error("标签不能超过4个"));
            }
            for (const tag of tags) {
              if (tag.length > 9) {
                return callback(new Error("每个标签不能超过9个字符"));
              }
            }
            return callback();
          },
        },
      ],
      content: [{ required: true, message: "内容不能为空" }]
    };
    if (isRaward.value)  {
      rules.rewardPoints = [{ required: true, message: "打赏积分不能小于 1" }];
      rules.rewardContent = [{ required: true, message: "打赏内容不能为空" }];
    }
    if (type == '1') {
      rules.bountyPoints = [{ required: true, message: "悬赏积分不能小于 1" }];
    }
    return rules;
  })
  
  const contentRef = ref<InstanceType<typeof Editor>>();
  const rawardRef = ref<InstanceType<typeof Editor>>();
  const error = ref('');
  const tags = computed<string[]>({
    get() {
      return data.value.tags.map(t => t.name!);
    },
    set(value: string[]) {
      data.value.tags = value.map(name => ({ name }));
    }
  });
  async function submit(status = 0) {
    data.value.status = status;
    if(!(await formRef.value?.validate())) return;
    const { articleId } = await addArticle(data.value, error);
    navigate(`/article/${articleId}`);
  }
</script>
<template>
  <VForm 
    ref="formRef" 
    is="article" 
    class="flex flex-col"
    :rules="rules"
    :model="data"
    @validate-failed="error = $event.error?.message || ''"
  >
    <section>
      <label class="input join-item input-md input-ghost w-full border-b border-base-100">
        <input type="text" placeholder="标题" required v-model="data.title" />
      </label>
    </section>
    <section>
      <Editor
        ref="contentRef"
        :options="{
          outline: {
            enable: true,
            position: 'left',
          },
        }"
        v-model="data.content"
        name="article"
      >
        <template #fallback>
          <div class="h-[70vh] flex items-center justify-center">
            <span class="loading loading-infinity loading-xl"></span>
          </div>
        </template>
      </Editor>
    </section>
    <section>
      <InputTag class="input-ghost w-full border-b border-base-100 input-sm" v-model="tags" placeholder="标签（用逗号分隔，最多 4 个，每个最长 9 个字符）" />
    </section>
    <section v-if="type == '1'">
      <section class="px-10 py-2" v-if="!isRaward">
        <button class="btn btn-ghost btn-block mt-4 py-3 hover:shadow-xl bg-base-100 h-auto" @click="isRaward = true">
          打赏区 1. 当设置了打赏积分后，将启用打赏功能；2. 启用打赏需要 20 积分；3.
          打赏区的内容只有在浏览者打赏后才对其可见 ▾
        </button>
      </section>
      <section v-else>
        <Editor ref="rawardRef" height="30vh" v-model="data.rewardContent">
          <template #fallback>
            <div class="h-[30vh] flex items-center justify-center">
              <span class="loading loading-infinity loading-xl"></span>
            </div>
          </template>
        </Editor>
        <label class="input validator join-item input-sm input-ghost w-full border-b border-base-100">
          <input type="number" placeholder="打赏积分" required v-model="data.rewardPoints" />
        </label>
      </section>
    </section>
    <section v-if="type == '1'">
      <label class="input validator join-item input-sm input-ghost w-full border-b border-base-100">
        <input type="number" placeholder="悬赏积分" required v-model="data.bountyPoints" />
      </label>
    </section>
    <section class="px-5 py-2">
      <div role="alert" class="alert alert-error alert-soft text-xs py-2" v-if="error">
        <span>{{error}}</span>
      </div>
    </section>
    <section class="py-2 flex justify-between max-w-[1300px] m-auto w-full md:flex-row flex-col" v-if="articleType">
      <section class="space-x-2 md:flex items-center hidden">
        <Icon :icon="articleType.icon" />
        <span>{{ articleType.name }}</span>
        <component :is="articleType.description" />
      </section>
      <section class="flex-1 text-sm flex justify-end items-center space-x-2">
        <label class="inline-flex whitespace-nowrap items-center gap-2 mr-4">
          <span>创作声明</span>
          <select class="select inline select-sm" v-model="data.statement">
            <option selected>无声明</option>
            <option>包含 AI 辅助创作</option>
            <option>包含剧透</option>
            <option>虚拟演绎，仅供娱乐</option>
          </select>
        </label>
        <label class="inline-flex items-center gap-2 mr-4">
          <input type="checkbox" class="checkbox checkbox-sm" v-model="data.anonymous" />
          <span>匿名</span>
        </label>
        <label class="inline-flex items-center gap-2 mr-4">
          <input type="checkbox" class="checkbox checkbox-sm" v-model="data.listable" />
          <span>是否在列表展示</span>
        </label>
        <label class="inline-flex items-center gap-2 mr-4">
          <input type="checkbox" class="checkbox checkbox-sm" v-model="data.commentable" />
          <span>是否允许评论</span>
        </label>
        <button class="btn btn-outline btn-error btn-sm" @click="submit(3)">保存草稿</button>
        <button class="btn btn-primary btn-sm" @click="submit()">发布</button>
      </section>
    </section>
  </VForm>
</template>
