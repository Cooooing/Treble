<script lang="ts" setup>
import { ref } from "vue";
import { useData } from "vike-vue/useData";
import type { Moonbreeze } from "@bass/bbs-sdk-fetch/models/Moonbreeze";
import ErrorState from "@/components/feedback/ErrorState.vue";
import MemberProfileLayout from "@/components/member/MemberProfileLayout.vue";
import MoonbreezeList from "@/components/moonbreeze/MoonbreezeList.vue";
import type { Data } from "./+data";

const data = useData<Data>();
const rows = ref<Moonbreeze[]>([...data.rows]);
const nextCursor = ref(data.nextCursor);

function append(nextRows: Moonbreeze[], cursor?: string) {
  rows.value.push(...nextRows);
  nextCursor.value = cursor;
}
</script>

<template>
  <ErrorState v-if="!data.profile" :message="data.error || '该用户不存在或不可用。'" title="用户未找到" />
  <MemberProfileLayout v-else :profile="data.profile" active="moonbreezes">
    <p v-if="data.private" class="member-empty">该用户未公开清风明月列表。</p>
    <MoonbreezeList
      v-else
      :empty-text="'暂无公开的清风明月。'"
      :member-name="data.profile.account?.name"
      :next-cursor="nextCursor"
      :rows="rows"
      stream="member"
      @append="append"
    />
  </MemberProfileLayout>
</template>

<style scoped>
.member-empty {
  margin: 0;
  padding: 48px 20px;
  color: var(--text-fade-color);
  font-size: 14px;
  line-height: 24px;
  text-align: center;
}
</style>
