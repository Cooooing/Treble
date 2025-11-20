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

export interface VFormContext {
  addField: (prop: string, field: FormItemContext) => void;
  removeField: (prop: string, field: FormItemContext) => void;
}

export interface FormItemContext {
  validate: (
    value: any,
    callback?: (isVaild?: boolean, err?: FormValidate[]) => void,
  ) => Promise<boolean>;
  rules: RuleItem[];
}

export { RuleItem };

export const VFormContextKey: InjectionKey<VFormContext> = Symbol('VFormContextKey');
export const VFormItemContextKey: InjectionKey<FormItemContext> = Symbol('VFormItemContextKey');