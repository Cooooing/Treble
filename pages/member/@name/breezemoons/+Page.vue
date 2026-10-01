<script lang="ts" setup>
import { ref } from "vue";
import { useData } from "vike-vue/useData";
import type { Breezemoon } from "@bass/bbs-sdk-fetch/models/Breezemoon";
import ErrorState from "@/components/feedback/ErrorState.vue";
import MemberProfileLayout from "@/components/member/MemberProfileLayout.vue";
import BreezemoonList from "@/components/breezemoon/BreezemoonList.vue";
import type { Data } from "./+data";

const data = useData<Data>();
const rows = ref<Breezemoon[]>([...data.rows]);
const nextCursor = ref(data.nextCursor);

function append(nextRows: Breezemoon[], cursor?: string) {
  rows.value.push(...nextRows);
  nextCursor.value = cursor;
}
</script>

<template>
  <ErrorState v-if="!data.profile" :message="data.error || '该用户不存在或不可用。'" title="用户未找到" />
  <MemberProfileLayout v-else :profile="data.profile" active="breezemoons">
    <BreezemoonList
      :empty-text="'暂无公开的明月清风。'"
      :member-name="data.profile.account?.name"
      :next-cursor="nextCursor"
      :rows="rows"
      stream="member"
      @append="append"
    />
  </MemberProfileLayout>
</template>
