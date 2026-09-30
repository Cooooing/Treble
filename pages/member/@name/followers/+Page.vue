<script lang="ts" setup>
import { toRefs } from "vue";
import { useData } from "vike-vue/useData";
import AppLink from "@/components/ui/AppLink.vue";
import Avatar from "@/components/identity/Avatar.vue";
import MemberProfileLayout from "@/components/member/MemberProfileLayout.vue";

const { profile, rows } = toRefs(useData<any>());
</script>
<template>
  <MemberProfileLayout v-if="profile" :profile="profile" active="followers">
    <p v-if="!rows.length" class="member-empty">暂无粉丝。</p>
    <div v-else class="member-list">
      <AppLink v-for="row in rows" :key="row.account?.id" :href="`/member/${row.account?.name}`" class="member-row">
        <Avatar :name="row.account?.name" :size="48" :url="row.account?.avatarUrl" />
        <span
          ><b>{{ row.account?.nickname || row.account?.name }}</b
          ><small v-if="row.account?.nickname">{{ row.account?.name }}</small
          ><em v-if="row.account?.introduction">{{ row.account.introduction }}</em></span
        >
      </AppLink>
    </div>
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
.member-row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 15px;
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid var(--layer-border-color);
}
.member-row:hover {
  background: var(--background-secondary-color);
}
.member-row > span {
  display: grid;
  min-width: 0;
  gap: 1px;
}
.member-row b {
  color: var(--text-color);
  font-size: 16px;
  line-height: 22px;
  overflow-wrap: anywhere;
}
.member-row small,
.member-row em {
  color: var(--text-fade-color);
  font-size: 12px;
  font-style: normal;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.member-row em {
  color: var(--text-gray-color);
}
</style>
