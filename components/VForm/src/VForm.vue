<script setup lang="ts">
  import { isString } from '@/utils';
import { IFormContext, IFormItemContext, VFormContextKey, validator, FormValidate } from '../index';

  const props = withDefaults(
    defineProps<{
      is: string;
      model?: any;
      rules?: Recordable<any>;
    }>(),
    {
      is: "form",
    },
  );
  const emit = defineEmits<{
    (e: 'validateFailed', payload: FormValidate): void;
  }>();

  const context = reactive<IFormContext>({
    addField(prop: string, field: IFormItemContext) {
      if (!fields[prop]) fields[prop] = field;
      fieldsProps[prop] = (fieldsProps[prop] || 0) + 1;
    },
    removeField(prop: string) {
      if (fieldsProps[prop] && --fieldsProps[prop] <= 0) delete fields[prop];
    },
  });
  provide(VFormContextKey, context);
  const fields = reactive<Recordable<IFormItemContext>>({});
  const fieldsProps = reactive<Recordable<number>>({});

  async function validate(key?: string | string[]): Promise<boolean> {
    if (!props.model) return true;
    const keys = isString(key) ? [key] : key;
    if (Object.keys(fields).length == 0) {
      const rules = !keys ? props.rules : Object.entries(props.rules || {}).reduce((acc, [k, v]) => {
        if (keys.includes(k)) acc[k] = v;
        return acc;
      }, {} as Recordable<any>);
      return validator(rules || {}, props.model)
        .then(() => true)
        .catch((errors: FormValidate[]) => {
          emit('validateFailed', errors[0]);
          return false;
        });
    }
    if (keys) {
      for (const key of keys) {
        if (fields[key]) {
          if (!(await fields[key].validate(props.model[key]).catch((errors) => {
            emit('validateFailed', errors[0]);
            return false
          }))) {
            return false;
          }
        }
      }
      return true;
    }
    for (const key in fields) {
      if (!(await fields[key].validate(props.model[key]).catch((errors) => {
        emit('validateFailed', errors[0]);
        return false
      }))) {
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
