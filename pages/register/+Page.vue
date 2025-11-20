<script setup lang="ts">
  import { navigate } from 'vike/client/router';
  import { VFormInstance, VFormItem } from '~/VForm';
  import { useDesign } from '@/hooks/useDesign';
  import { Rules } from 'async-validator';
  import { checkEmailExist, checkUsernameExist, IRegister, registerByEmail, verifyRegisterByEmail } from '@/apis/auth';

  const prefixCls = useDesign('register');

  const account = ref<IRegister>({
    name: '',
    nickname: '',
    email: '',
    password: '',
  });

  const rules: Rules = {
    name: [
      { required: true, message: '请输入用户名' },
      {
        validator(_rule, value, callback) {
          checkUsernameExist(value).then(({ exist }) => {
            if (exist) {
              callback(new Error('该用户名已被占用'));
            } else {
              callback();
            }
          }).catch((error) => {
            callback(error);
          });
        }
      }
    ],
    nickname: [
      { required: true, message: '请输入昵称' },
    ],
    email: [
      { required: true, message: '请输入邮箱' },
      { type: 'email', message: '请输入正确的邮箱格式' },
      { 
        validator: (_rule, value, callback) => {
          checkEmailExist(value).then(({ exist }) => {
            if (exist) {
              callback(new Error('该邮箱已被注册'));
            } else {
              callback();
            }
          });
        },
      }
    ],
    password: [
      { required: true, message: '请输入密码' },
      { min: 6, max: 30, message: '密码长度在6到30个字符之间' },
    ],
  };

  const error = ref('');
  const loading = ref(false);
  const formRef = ref<VFormInstance>();
  async function submit() {
    if (!(await formRef.value?.validate())) return;
    if (verify.value.codeToken) {
      // 提交验证码，完成注册
      loading.value = true;
      error.value = '';
      await verifyRegisterByEmail(verify.value, error)
        .finally(() => loading.value = false);
      $toast.success('注册成功！请前往登录。');
      // 跳转到登录页
      navigate('/login');
      return;
    }
    loading.value = true;
    error.value = '';
    const { codeToken } = await registerByEmail(account.value, error)
      .finally(() => loading.value = false);
    verify.value.codeToken = codeToken;
  }

  const verify = ref({
    code: '',
    codeToken: '',
  });
</script>
<template>
  <article class="flex md:flex-row flex-col p-8 max-w-[1300px]" :class="prefixCls">
    <section class="flex-1">
      <section class="flex items-center justify-center">
        <VForm
          ref="formRef"
          :model="!verify.codeToken ? account : verify"
          is="fieldset"
          class="fieldset bg-base-200 border-base-100 rounded-box w-xs border p-4"
          :class="`${prefixCls}-form`"
        >
          <legend class="fieldset-legend flex items-center text-2xl">
            <img src="@/assets/images/logo.svg" alt="logo" class="h-[1em]" />
            <span>注册账号</span>
          </legend>
          <template v-if="verify.codeToken">
            <!-- 验证邮箱，输入验证码 -->
            <div role="alert" class="alert alert-info alert-outline text-sm">
              <span>验证码已发送到您的邮箱，请查收。</span>
            </div>
            <label class="label">邮箱验证码</label>
            <input type="text" class="input" placeholder="请输入发送到您邮箱的验证码" v-model="verify.code" />
            <VFormItem prop="code" :rules="[{ required: true, message: '请输入验证码' }]" />
          </template>
          <template v-else>
            <label class="label">用户名</label>
            <input type="text" class="input" placeholder="用户名" v-model="account.name" @change="formRef?.validate('name')" />
            <VFormItem prop="name" :rules="rules.name" />
            <label class="label">昵称</label>
            <input type="text" class="input" placeholder="昵称" v-model="account.nickname" @change="formRef?.validate('nickname')" />
            <VFormItem prop="nickname" :rules="rules.nickname" />
            <label class="label">邮箱</label>
            <input type="email" class="input" placeholder="邮箱" v-model="account.email" @change="formRef?.validate('email')" />
            <VFormItem prop="email" :rules="rules.email" />
            <label class="label">密码</label>
            <input type="password" class="input" placeholder="密码" v-model="account.password" @change="formRef?.validate('password')" />
            <VFormItem prop="password" :rules="rules.password" />
          </template>
          <button class="btn btn-neutral mt-4" @click="submit">
            <span v-if="loading" class="loading loading-spinner"></span>
            注册
          </button>
          <p v-if="error" role="alert" class="alert alert-error alert-soft">
            <span>{{ error }}</span>
          </p>
        </VForm>
      </section>
    </section>
    <div class="intro flex-1 flex flex-col justify-center space-y-4 md:pl-12 mt-8 md:mt-0">
      <h1>🐟 鱼油，欢迎来到摸鱼派！</h1>
      <p>
        如果你也是奋斗在一线、热爱工作的苦逼青年，期待与众多鱼油聚集起来，那就加入友好的摸鱼派社区吧！ ❤️
      </p>
      <p>
        在这里有为你准备的聊天室、鱼游、充满生活感的帖子，只要来到摸鱼派，你就是我们的家庭成员～这里以「友善」为第一守则，你可以完全放开自己，和鱼油们畅所欲言，邂逅各行各业的搬砖人，参与摸鱼派有趣的活动 :)
      </p>
      <p>
        日常、闲聊、生活、吐槽、提问、技术、读书、游戏、兴趣 ...... 都可以在摸鱼派中讨论。
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
</script>
