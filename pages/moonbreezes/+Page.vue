<script lang="ts" setup>
import { ref } from "vue";
import { useData } from "vike-vue/useData";
import type { Moonbreeze } from "@bass/bbs-sdk-fetch/models/Moonbreeze";
import MoonbreezeList from "@/components/moonbreeze/MoonbreezeList.vue";
import MoonbreezeSidebar from "@/components/moonbreeze/MoonbreezeSidebar.vue";
import ErrorState from "@/components/feedback/ErrorState.vue";
import type { Data } from "./+data";

const data = useData<Data>();
const rows = ref<Moonbreeze[]>([...data.rows]);
const nextCursor = ref(data.nextCursor);

function prepend(row: Moonbreeze) {
  rows.value.unshift(row);
}

function append(nextRows: Moonbreeze[], cursor?: string) {
  rows.value.push(...nextRows);
  nextCursor.value = cursor;
}
</script>

<template>
  <ErrorState v-if="data.error" :message="data.error" title="清风明月暂时无法打开" />
  <main v-else class="main moonbreeze-page">
    <div class="wrapper">
      <section class="content">
        <MoonbreezeList :next-cursor="nextCursor" :rows="rows" stream="public" @append="append" />
      </section>
      <aside class="side"><MoonbreezeSidebar :rows="rows" @created="prepend" /></aside>
    </div>
  </main>
</template>
