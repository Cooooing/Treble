import AsyncValidator, { ValidateError, ValidateFieldsError, Values } from 'async-validator';
import type { RuleItem } from "async-validator";
import VForm from './src/VForm.vue';
import VFormItem from './src/VFormItem.vue';

type VFormInstance = InstanceType<typeof VForm>;
type VFormItemInstance = InstanceType<typeof VFormItem>;

export default VForm;
export { VForm, VFormItem, VFormInstance, VFormItemInstance };


export declare interface FormValidate {
  error: Error | null;
  field?: string;
}

export interface IFormContext {
  addField: (prop: string, field: IFormItemContext) => void;
  removeField: (prop: string, field: IFormItemContext) => void;
}

export interface IFormItemContext {
  validate: (
    value: any,
    callback?: (isVaild?: boolean, err?: FormValidate[]) => void,
  ) => Promise<boolean>;
  rules: RuleItem[];
}

export function validator(rules: Recordable<RuleItem[]>, data?: any, callback?: (isValid?: boolean, err?: FormValidate[]) => void) {
  const validator = new AsyncValidator(rules);
  return validator
    .validate(data, { firstFields: true })
    .then(() => {
      callback?.();
      return true as const;
    })
    .catch((err: { errors: ValidateError[] | null, fields: ValidateFieldsError | Values }) => {
      console.dir(err);
      if (!err.fields) return true as const;
      const errors = err.errors?.map((e) => ({
        error: new Error(e.message),
        field: e.field,
      }));
      callback?.(false, errors);
      return Promise.reject(errors);
    });
}


export { RuleItem };

export const VFormContextKey: InjectionKey<IFormContext> = Symbol('VFormContextKey');
export const VFormItemContextKey: InjectionKey<IFormItemContext> = Symbol('VFormItemContextKey');