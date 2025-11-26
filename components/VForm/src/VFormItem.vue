<script setup lang="ts">
  import AsyncValidator, { ValidateError, ValidateFieldsError, Values } from 'async-validator';
  import { IFormItemContext, VFormItemContextKey, VFormContextKey, FormValidate, RuleItem, validator } from '../index';
  import { isUnDef } from '@/utils';

  const props = withDefaults(defineProps<{
    rules?: RuleItem[] | RuleItem;
    prop?: string;
    value?: any;
  }>(), {
    rules: () => [],
  });

  function validate(value?: any, callback?: (isValid?: boolean, err?: FormValidate[]) => void) {
    if (!props.prop) return callback?.(), Promise.resolve(true);
    if (isUnDef(value)) value = props.value;
    const rules = props.rules ? (Array.isArray(props.rules) ? props.rules : [props.rules]) : [];
    const modelName = props.prop;
    return validator({
      [modelName]: rules,
    }, { [modelName]: value }, callback)
    .then(() => {
      error.value = '';
      return true as const;
    })
    .catch((errors: FormValidate[]) => {
      callback?.(false, errors);
      return Promise.reject(errors);
    });
  }

  const context = reactive<IFormItemContext>({
    rules: props.rules ? (Array.isArray(props.rules) ? props.rules : [props.rules]) : [],
    validate,
  });

  const vFormContext = inject(VFormContextKey, undefined);
  provide(VFormItemContextKey, context);

  onMounted(() => {
    if (props.prop) vFormContext?.addField(props.prop, context);
  });

  onBeforeUnmount(() => {
    if (props.prop) vFormContext?.removeField(props.prop, context);
  });

  const error = ref('');
  const isError = ref(false);
  defineExpose({
    isError,
    validate: () => validate(),
  })
</script>

<template>
  <p class="m-0 text-error text-xs">{{ error }}</p>
</template>