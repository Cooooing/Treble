<script lang="ts" setup>
import { getUploadToken, uploadFileToOss } from "@/apis/common";
import { getUsers } from "@/apis/user";
import { useDaisyUI } from "@/stores/useDaisyUI";
import Vditor from "vditor";
import "vditor/dist/index.css";

const props = withDefaults(
  defineProps<{
    name?: string;
    height?: string;
    width?: string;
    options?: IOptions;
    modelValue?: string;
    vditorInstance?: Vditor;
  }>(),
  {
    height: "70vh",
    width: "100%",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:vditorInstance", value: Vditor): void;
}>();

const vditor = ref<Vditor>();
const vditorRef = ref<HTMLDivElement>();
const daisyuiTheme = useDaisyUI();
const vditorId = ref(`vditor_${Date.now()}`);
let uploadHandlerCancel: (() => void) | null = null;
const uploadProgress = ref({
  filename: "",
  percent: 0,
});
onMounted(() => {
  vditor.value = new Vditor(vditorRef.value!, {
    cache: {
      enable: !!props.name,
      id: props.name,
    },
    height: props.height,
    width: props.width,
    theme: daisyuiTheme.isDarkTheme ? "dark" : "classic",
    ...props.options,
    after: () => {
      if (props.modelValue) {
        vditor.value?.setValue(props.modelValue);
      }
    },
    hint: {
      extend: [
        {
          key: '@',
          hint: async (key) => {
            if (key.length > 0) {
              return await getUsers({ query: { name: key }, page: { page: 1, size: 10 } })
                .then(({ rows }) => rows.map(r => ({
                  value: `[@${r.name}](/member/${r.name})`,
                  html: `<img src="${r.avatar_url}" align="center" /> ${r.name}`
                })))
            }
            return []
          },
        },
      ],
    },
    upload: {
      async handler(files: File[]) {
        try {
          const { token } = await getUploadToken();
          const fileInfos = uploadFileToOss(files, token, {
            vars: {
              form: props.name ? "editor-" + props.name : "editor",
            },
            onProgress: (percent, filename) => {
              uploadProgress.value = { percent, filename };
            },
          });
          uploadHandlerCancel = fileInfos.cancel;
          await fileInfos.results().then((ret) => {
            ret.files.forEach((file) => {
              vditor.value?.insertValue(`![${file.filename}](${file.url})\n`);
            });
          });
          uploadHandlerCancel = null;
          return "";
        } catch (error: any) {
          return error.message;
        }
      },
    },
    input: (value: string) => {
      emit("update:modelValue", value);
    },
  });
  emit("update:vditorInstance", vditor.value!);
});

watch(
  () => daisyuiTheme.isDarkTheme,
  (newVal) => {
    if (vditor.value) {
      vditor.value.setTheme(newVal ? "dark" : "classic");
    }
  },
  { immediate: true },
);

defineExpose({
  vditor,
  getValue() {
    return vditor.value?.getValue() || "";
  },
  setValue(value: string) {
    vditor.value?.setValue(value);
  },
  focus() {
    vditor.value?.focus();
  },
});
</script>
<template>
  <section>
    <template v-if="uploadHandlerCancel">
      <Teleport to=".vditor-content">
        <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div class="alert alert-info shadow-lg">
            <div class="flex items-center gap-2">
              <span>正在上传 {{ uploadProgress.filename }}</span>
              <progress class="progress progress-primary w-30" :value="uploadProgress.percent" max="100"></progress>
              <span role="button" @click="uploadHandlerCancel">取消</span>
            </div>
          </div>
        </div>
      </Teleport>
    </template>
    <div :id="vditorId" ref="vditorRef">
      <div :style="{ height }" class="h-[70vh] flex items-center justify-center">
        <span class="loading loading-infinity loading-xl"></span>
      </div>
    </div>
  </section>
</template>
