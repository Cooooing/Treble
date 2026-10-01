<script lang="ts" setup>
import { ref } from "vue";
import { useData } from "vike-vue/useData";
import type { Breezemoon } from "@bass/bbs-sdk-fetch/models/Breezemoon";
import BreezemoonList from "@/components/breezemoon/BreezemoonList.vue";
import BreezemoonSidebar from "@/components/breezemoon/BreezemoonSidebar.vue";
import ErrorState from "@/components/feedback/ErrorState.vue";
import type { Data } from "./+data";

const data = useData<Data>();
const rows = ref<Breezemoon[]>([...data.rows]);
const nextCursor = ref(data.nextCursor);

function prepend(row: Breezemoon) {
  rows.value.unshift(row);
}

function append(nextRows: Breezemoon[], cursor?: string) {
  rows.value.push(...nextRows);
  nextCursor.value = cursor;
}
</script>

<template>
  <ErrorState v-if="data.error" :message="data.error" title="关注动态暂时无法打开" />
  <main v-else class="main breezemoon-page">
    <div class="wrapper">
      <section class="content">
        <BreezemoonList :next-cursor="nextCursor" :rows="rows" stream="watching" @append="append" />
      </section>
      <aside class="side"><BreezemoonSidebar :rows="rows" @created="prepend" /></aside>
    </div>
  </main>
</template>
