import dayjs, { type ConfigType } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export const PER_DAY_MS = 24 * 3600 * 1000;
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATE_FORMAT_TIME = 'YYYY-MM-DD HH:mm:ss';
export const DATE_FORMAT_TIME_NO_SEC = 'YYYY-MM-DD HH:mm';

/**
 * 格式化日期
 * @param date 目标日期
 * @param format 日期格式
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: ConfigType, format = DATE_FORMAT): string {
  if (!date) return '';
  return dayjs(date).format(format);
}

/**
 * 格式化日期为年月日字符串
 * @param date 目标日期
 * @returns 格式化为年月日字符串
 */
export function formatDateTime(date: ConfigType): string {
  return formatDate(date, DATE_FORMAT_TIME);
}

/**
 * 获取指定日期格式化为不含秒的时间字符串
 * @param date 目标日期
 * @returns 格式化为不含秒的时间字符串
 */
export function formatDateTimeNOSec(date: ConfigType): string {
  return formatDate(date, DATE_FORMAT_TIME_NO_SEC);
}

/**
 * 获取指定日期的时间戳
 * @param date 日期
 * @returns 时间戳，单位毫秒
 */
export function getTime(date: ConfigType): number {
  return dayjs(date).toDate().getTime();
}

/**
 * 计算两个日期间隔天数
 * @param date1 日期1
 * @param date2 日期2
 */
export function betweenDay(date1: Date, date2: Date) {
  date1 = new Date(date1);
  date2 = new Date(date2);

  return Math.floor((date2.getTime() - date1.getTime()) / (24 * 3600 * 1000));
}

/**
 * 日期计算
 * @param param1 日期
 * @param param2 添加的时间
 */
export function addTime(param1: Date, param2: number) {
  param1 = new Date(param1);
  return new Date(param1.getTime() + param2);
}

/**
 * 获取指定日期距离当前时间的相对时间字符串
 * @param date 目标日期
 * @returns 相对时间字符串，例如 "3 天前"
 */
export function fromNow(date: ConfigType): string {
  return dayjs(date).fromNow();
}

/**
 * 获取当前时间距离指定日期的相对时间字符串
 * @param date 目标日期
 * @returns 相对时间字符串，例如 "3 天后"
 */
export function nowTo(date: ConfigType): string {
  return dayjs().to(date);
}