<script lang="ts" setup>
  import { useDaisyUI } from '@/stores/useDaisyUI';
  import Vditor from 'vditor';
  import 'vditor/dist/index.css';

  const props = withDefaults(defineProps<{
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
    vditor.value = new Vditor(vditorId.value, {
      height: props.height,
      width: props.width,
      theme: daisyuiTheme.isDarkTheme ? 'dark' : 'classic',
      ...props.options,
      after: () => {
        if (props.modelValue) {
          vditor.value?.setValue(props.modelValue);
        }
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