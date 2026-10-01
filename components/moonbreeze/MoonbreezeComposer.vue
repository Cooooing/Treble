<script lang="ts" setup>
import { computed, ref } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import type { Moonbreeze } from "@bass/bbs-sdk-fetch/models/Moonbreeze";
import AppLink from "@/components/ui/AppLink.vue";
import { message } from "@/components/feedback/message";
import { currentAccount } from "@/services/sessionState";
import { ApiError, bbsClient } from "@/utils/sdk";

const emit = defineEmits<{ created: [row: Moonbreeze] }>();

const maxCharacters = 512;
const pageContext = usePageContext();
const content = ref("");
const submitting = ref(false);
const error = ref("");
const account = computed(() => pageContext.user || currentAccount.value);
const normalizedContent = computed(() => content.value.trim());
const characterCount = computed(() => Array.from(normalizedContent.value).length);

function normalizeInput() {
  // The service accepts a single plain-text line. Replacing pasted line breaks
  // immediately gives users predictable input rather than a late submit error.
  content.value = content.value.replace(/[\r\n]+/g, " ");
  error.value = "";
}

function validate() {
  if (!normalizedContent.value) return "请输入动态内容。";
  if (/[\r\n]/.test(content.value)) return "清风明月仅支持单行文本。";
  if (characterCount.value > maxCharacters) return `内容不能超过 ${maxCharacters} 个字符。`;
  return "";
}

function errorMessage(cause: unknown) {
  if (cause instanceof ApiError && Number(cause.code) === 12021) {
    const retryAfter = (cause.data as { retry_after_seconds?: number } | undefined)?.retry_after_seconds;
    return retryAfter ? `发布过于频繁，请在 ${retryAfter} 秒后重试。` : "发布过于频繁，请稍后再试。";
  }
  return cause instanceof Error ? cause.message : "发布失败，请稍后重试。";
}

async function submit() {
  error.value = validate();
  if (error.value || submitting.value) return;

  submitting.value = true;
  try {
    const response = await bbsClient.moonbreeze.create({
      createMoonbreezeReq: { content: normalizedContent.value },
    });
    if (response.moonbreeze) emit("created", response.moonbreeze);
    content.value = "";
    message.success("已发布。", { id: "moonbreeze-create" });
  } catch (cause) {
    error.value = errorMessage(cause);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form v-if="account" aria-label="发布清风明月" class="moonbreeze-composer" @submit.prevent="submit">
    <div class="moonbreeze-composer__row">
      <input
        id="moonbreeze-content"
        v-model="content"
        :aria-describedby="error ? 'moonbreeze-error' : undefined"
        :aria-invalid="Boolean(error)"
        :maxlength="maxCharacters"
        class="moonbreeze-composer__input"
        placeholder="此刻想说..."
        type="text"
        @input="normalizeInput"
      />
      <button :disabled="submitting || Boolean(validate())" type="submit">
        {{ submitting ? "发布中..." : "发布" }}
      </button>
    </div>
    <p v-if="error" id="moonbreeze-error" class="moonbreeze-composer__error" role="alert">{{ error }}</p>
  </form>
  <p v-else class="moonbreeze-composer moonbreeze-composer--guest">
    <AppLink href="/login?next=/moonbreezes">登录</AppLink> 后即可发布。
  </p>
</template>

<style scoped>
.moonbreeze-composer {
  margin: 0;
}

.moonbreeze-composer__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.moonbreeze-composer__input {
  min-width: 0;
  flex: 1;
  height: 32px;
  padding: 5px 9px;
  border: 1px solid var(--layer-border-color);
  border-radius: 3px;
  box-sizing: border-box;
  background: var(--background-secondary-color);
  color: var(--text-color);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
}

.moonbreeze-composer__input:focus-visible {
  border-color: var(--link-color);
  outline: 2px solid color-mix(in srgb, var(--link-color) 30%, transparent);
  outline-offset: 1px;
}
.moonbreeze-composer button {
  flex: 0 0 auto;
  min-width: 52px;
  height: 32px;
  border: 0;
  border-radius: 3px;
  background: var(--color-accent);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
}
.moonbreeze-composer button:hover:not(:disabled),
.moonbreeze-composer button:focus-visible:not(:disabled) {
  filter: brightness(0.94);
  outline: 2px solid color-mix(in srgb, var(--color-accent) 35%, transparent);
  outline-offset: 2px;
}
.moonbreeze-composer button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.moonbreeze-composer__error {
  margin: 6px 0 0;
  color: var(--color-danger);
  font-size: 12px;
  line-height: 18px;
}

.moonbreeze-composer--guest {
  color: var(--text-gray-color);
  font-size: 13px;
  line-height: 32px;
}
</style>
