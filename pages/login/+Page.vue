<script setup lang="ts">
  import { ILogin, loginByAccount } from '@/apis/auth';
import { navigate } from 'vike/client/router';
import { getGlobalContext } from 'vike/server';
  import { VFormInstance, VFormItem } from '~/VForm';

  const prefixCls = useDesign('login');

  const account = ref<ILogin>({
    account: '',
    password: '',
  });

  const rules = {
    account: [
      { required: true, message: '请输入用户名或邮箱' },
    ],
    password: [
      { required: true, message: '请输入密码' },
    ],
  };
  const formRef = ref<VFormInstance>();
  const error = ref('');
  const loading = ref(false);
  async function submit() {
    error.value = '';
    const valid = await formRef.value?.validate();
    if (!valid) return;
    loading.value = true;
    await loginByAccount(account.value, error).finally(() => loading.value = false);
    navigate('/');
  }

</script>

<template>
    <article class="flex md:flex-row flex-col p-8 max-w-[1300px]" :class="prefixCls">
    <section class="flex-1">
      <section class="flex items-center justify-center">
        <VForm
          ref="formRef"
          :model="account"
          is="fieldset"
          class="fieldset bg-base-200 border-base-100 rounded-box w-xs border p-4"
          :class="`${prefixCls}-form`"
        >
          <legend class="fieldset-legend flex items-center text-2xl">
            <img src="@/assets/images/logo.svg" alt="logo" class="h-[1em]" />
            <span>登录</span>
          </legend>
          <label class="input">
            <Icon icon="mdi:account" />
            <input type="search" class="grow" placeholder="用户名/邮箱" v-model="account.account" @change="formRef?.validate('account')" />
          </label>
          <VFormItem prop="account" :rules="rules.account" />
          <label class="input">
            <Icon icon="mdi:lock" />
            <input type="password" class="input" placeholder="密码" v-model="account.password" @change="formRef?.validate('password')" />
          </label>
          <VFormItem prop="password" :rules="rules.password" />
          <button class="btn btn-neutral mt-4" @click="submit">
            <span v-if="loading" class="loading loading-spinner"></span>
            登录
          </button>
          <p v-if="error" role="alert" class="alert alert-error alert-soft">
            <span>{{ error }}</span>
          </p>
        </VForm>
      </section>
    </section>
    <PublicBoard />
  </article>
</template>
