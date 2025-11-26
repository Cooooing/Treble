<script lang="ts" setup>
  import { getUploadToken, uploadFileToOss } from '@/apis/common';
  import { useDaisyUI } from '@/stores/useDaisyUI';
  import Vditor from 'vditor';
  import 'vditor/dist/index.css';

  const props = withDefaults(defineProps<{
    name?: string;
    height?: string;
    width?: string;
    options?: IOptions;
    modelValue?: string;
    vditorInstance?: Vditor;
  }>(), {
    height: '70vh',
    width: '100%',
  });

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'update:vditorInstance', value: Vditor): void;
  }>();

  const vditor = ref<Vditor>();
  const vditorRef = ref<HTMLDivElement>();
  const daisyuiTheme = useDaisyUI();
  const vditorId = ref(`vditor_${Date.now()}`);
  onMounted(() => {
    vditor.value = new Vditor(vditorRef.value!, {
      cache: {
        enable: !!props.name,
        id: props.name,
      },
      height: props.height,
      width: props.width,
      theme: daisyuiTheme.isDarkTheme ? 'dark' : 'classic',
      ...props.options,
      after: () => {
        if (props.modelValue) {
          vditor.value?.setValue(props.modelValue);
        }
      },
      upload: {
        async handler(files: File[]) {
          try {
            const { token } = await getUploadToken();
            const fileInfos = await uploadFileToOss(files, token, { 
              form: props.name ? 'editor-' + props.name : 'editor' 
            });
            fileInfos.forEach(file => {
              vditor.value?.insertValue(`![${file.filename}](${file.url})\n`);
            });
            return '';
          } catch (error: any) {
            return error.message;
          }
        },
      },
      input: (value: string) => {
        emit('update:modelValue', value);
      },
    });
    emit('update:vditorInstance', vditor.value!);
  });

  watch(() => daisyuiTheme.isDarkTheme, (newVal) => {
    if (vditor.value) {
      vditor.value.setTheme(newVal ? 'dark' : 'classic');
    }
  }, { immediate: true });

  defineExpose({
    vditor,
    getValue() {
      return vditor.value?.getValue() || '';
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
 <div :id="vditorId" ref="vditorRef">
  <div :style="{ height }" class="h-[70vh] flex items-center justify-center">
    <span class="loading loading-infinity loading-xl"></span>
  </div>
 </div>
</template>