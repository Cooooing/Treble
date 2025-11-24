<script setup lang="ts">
  const props = withDefaults(defineProps<{
    modelValue?: string[];
    placeholder?: string;
    splitChar?: string;
    tagClass?: string;
  }>(), {
    modelValue: () => [],
    splitChar: ',',
    tagClass: 'badge-primary',
  });
  const emit = defineEmits<{
    (e: 'update:modelValue', value: string[]): void;
  }>();

  const inputValue = ref('');
  const tags = ref<string[]>([...props.modelValue!]);
  function addTag() {
    const value = inputValue.value.trim();
    if (value && !tags.value.includes(value)) {
      tags.value.push(value);
      emit('update:modelValue', tags.value);
    }
    inputValue.value = '';
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    } else if (event.key === props.splitChar) {
      event.preventDefault();
      addTag();
    } else if (event.key === 'Backspace' && inputValue.value === '') {
      tags.value.pop();
      emit('update:modelValue', tags.value);
    }
  }

  function removeTag(index: number) {
    tags.value.splice(index, 1);
    emit('update:modelValue', tags.value);
  }
</script>

<template>
  <label class="input">
    <div v-if="tags.length" class="inline-flex flex-nowrap gap-1 mr-2">
      <span
        v-for="(tag, index) in tags"
        :key="index"
        class="badge badge-sm badge-soft"
        :class="tagClass"
      >
        <span>{{ tag }}</span>
        <span
          type="button"
          class="cursor-pointer opacity-70 hover:opacity-100"
          @click.prevent="removeTag(index)"
        >
          ✕
        </span>
      </span>
    </div>
    <input type="text" class="grow" :placeholder="placeholder" v-model="inputValue" @keydown="onKeyDown" />
  </label>
</template>