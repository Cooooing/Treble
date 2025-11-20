<script setup lang="ts">
  import { VFormContext, FormItemContext, VFormContextKey } from '../index';

  const props = withDefaults(
    defineProps<{
      is: string;
      model?: any;
    }>(),
    {
      is: "form",
    },
  );
  const emit = defineEmits<{
    (e: 'validateFailed', payload: { prop: string }): void;
  }>();

  const context = reactive<VFormContext>({
    addField(prop: string, field: FormItemContext) {
      if (!fields[prop]) fields[prop] = field;
      fieldsProps[prop] = (fieldsProps[prop] || 0) + 1;
    },
    removeField(prop: string) {
      if (fieldsProps[prop] && --fieldsProps[prop] <= 0) delete fields[prop];
    },
  });
  provide(VFormContextKey, context);
  const fields = reactive<Recordable<FormItemContext>>({});
  const fieldsProps = reactive<Recordable<number>>({});

  async function validate(key?: string): Promise<boolean> {
    if (!props.model) return true;
    if (key) {
      if (fields[key]) {
        if (!(await fields[key].validate(props.model[key]).catch(() => false))) {
          emit('validateFailed', { prop: key });
          return false;
        }
      }
      return true;
    }
    for (const key in fields) {
      if (!(await fields[key].validate(props.model[key]).catch(() => false))) {
        emit('validateFailed', { prop: key });
        return false;
      }
    }
    return true;
  }

  defineExpose({
    validate,
  });
</script>

<template>
  <component :is="is" class="v-form">
    <slot></slot>
  </component>
</template>
