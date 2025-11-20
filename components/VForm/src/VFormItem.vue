<script setup lang="ts">
  import AsyncValidator, { ValidateError, ValidateFieldsError, Values } from 'async-validator';
  import { FormItemContext, VFormItemContextKey, VFormContextKey, FormValidate, RuleItem } from '../index';
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
    const validator = new AsyncValidator({
      [modelName]: rules,
    });
    return validator
      .validate({ [modelName]: value }, { firstFields: true })
      .then(() => {
        callback?.();
        error.value = '';
        return true as const;
      })
      .catch((err: { errors: ValidateError[] | null, fields: ValidateFieldsError | Values }) => {
        console.dir(err);
        if (!err.fields) return true as const;
        error.value = err.errors?.[0].message ?? '';
        const errors = err.errors?.map((e) => ({
          error: new Error(e.message),
          field: e.field,
        }));
        callback?.(false, errors);
        return Promise.reject(errors);
      });
  }

  const context = reactive<FormItemContext>({
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