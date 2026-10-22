type MemberIdentity = {
  name?: string;
  nickname?: string;
};

export function memberDisplayName(member?: MemberIdentity, fallback = "匿名用户") {
  const name = member?.name?.trim();
  const nickname = member?.nickname?.trim();
  if (nickname && name) return `${nickname}(${name})`;
  return nickname || name || fallback;
}
