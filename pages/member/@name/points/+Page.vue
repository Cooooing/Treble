<script lang="ts" setup>
import { toRefs } from "vue";
import { useData } from "vike-vue/useData";
import ErrorState from "@/components/feedback/ErrorState.vue";
import ContentSidebar from "@/components/layout/ContentSidebar.vue";
import { fromNow } from "@/utils/date";
import { Data } from "./+data";

const { profile, rows, tags, domains, error, private: isPrivate } = toRefs(useData<Data>());

function pointsValue(value?: number | string | bigint) {
  if (value === undefined || value === null) return "0";
  return BigInt(value).toString(10);
}
</script>

<template>
  <ErrorState v-if="error || !profile" :message="error || '该用户不存在。'" title="积分明细暂时无法打开" />
  <main v-else class="main">
    <div class="wrapper">
      <section class="content">
        <section class="module member-points">
          <header class="member-points__header">
            <h1>{{ profile.account?.name }} 的积分明细</h1>
            <span v-if="profile.points !== undefined">当前积分 {{ pointsValue(profile.points) }}</span>
          </header>
          <p v-if="isPrivate" class="member-points__empty">该成员未公开积分明细。</p>
          <div v-else-if="rows.length" class="member-points__table-wrap">
            <table class="member-points__table">
              <colgroup>
                <col class="member-points__time" />
                <col class="member-points__type" />
                <col class="member-points__amount" />
                <col class="member-points__balance" />
              </colgroup>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>类型</th>
                  <th>数额</th>
                  <th>余额</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in rows" :key="`${record.createdAt}-${record.typeLabel}-${record.amount}`">
                  <td>
                    <time v-if="record.createdAt">{{ fromNow(record.createdAt) }}</time>
                  </td>
                  <td>{{ record.typeLabel }}</td>
                  <td
                    :class="
                      record.direction === 'ECONOMY_RECORD_DIRECTION_INCOME'
                        ? 'member-points__income'
                        : 'member-points__expense'
                    "
                  >
                    {{ record.direction === "ECONOMY_RECORD_DIRECTION_INCOME" ? "+" : "-" }}{{ record.amount }}
                  </td>
                  <td>{{ pointsValue(record.balanceAfter) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="member-points__empty">暂无积分流水。</p>
        </section>
      </section>
      <ContentSidebar :domains="domains" :tags="tags" />
    </div>
  </main>
</template>

<style scoped>
.member-points {
  overflow: hidden;
}
.member-points__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 15px;
  border-bottom: 1px solid var(--layer-border-color);
}
.member-points__header h1 {
  margin: 0;
  font-size: 16px;
  line-height: 20px;
}
.member-points__header span {
  color: var(--text-color);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
}
.member-points__table-wrap {
  overflow-x: auto;
}
.member-points__table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
}
.member-points__time {
  width: 30%;
}
.member-points__type {
  width: 30%;
}
.member-points__amount {
  width: 20%;
}
.member-points__balance {
  width: 20%;
}
.member-points__table th,
.member-points__table td {
  padding: 12px 15px;
  border-bottom: 1px solid var(--layer-border-color);
  text-align: left;
  white-space: nowrap;
}
.member-points__table th {
  color: var(--text-fade-color);
  font-size: 12px;
  font-weight: normal;
}
.member-points__table td:nth-child(4) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.member-points__income {
  color: var(--color-success);
}
.member-points__expense {
  color: var(--color-danger);
}
.member-points__empty {
  margin: 0;
  padding: 32px 16px;
  color: var(--text-fade-color);
  font-size: 13px;
  text-align: center;
}
@media (max-width: 640px) {
  .member-points__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
  .member-points__table th,
  .member-points__table td {
    padding: 10px 12px;
  }
}
</style>
