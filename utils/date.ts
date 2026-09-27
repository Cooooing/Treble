import dayjs, { type ConfigType } from "dayjs";

export function fromNow(date: ConfigType): string {
  const target = dayjs(date);
  if (!target.isValid()) return "";

  const seconds = dayjs().diff(target, "second");
  if (seconds < 60) return `刚刚`;
  if (seconds < 60 * 60) return `${Math.floor(seconds / 60)}分钟前`;
  return target.format("YYYY-MM-DD HH:mm:ss");
}
