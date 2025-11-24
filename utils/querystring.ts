import { usePageContext } from "vike-vue/usePageContext";
import { getType } from "./is";

/**
 * 对象生成url
 * @param baseUrl url
 * @param obj
 * @returns {string}
 * @example
 *  let obj = {a: '3', b: '4'}
 *  setObj2Url('www.baidu.com', obj)
 *  // www.baidu.com?a=3&b=4
 */
export function setObj2Url(baseUrl: string, obj?: Recordable): string {
  if (!obj) return baseUrl;

  let parameters = '';
  for (const key in obj) {
    parameters += '&' + key + '=' + encodeURIComponent(obj[key]);
  }

  const id = baseUrl.lastIndexOf('?');
  if (id < 0) return baseUrl + '?' + parameters.slice(1);

  return baseUrl.slice(0, id) + '?' + baseUrl.slice(id + 1).replace(/\/$/, '') + parameters;
}

/**
 * url生成对象
 * @param {Object} local window.location对象
 */
export function getObjOfUrl(urlPath: string): Recordable {
  let qs = urlPath.split('?')[1] || '';
  return (qs && Object.fromEntries(new URLSearchParams(qs))) || {};
}

/**
 * 替换对象中的键后获得新对象
 * @param {Object} obj 原始对象
 * @param {Object} key2key 待替换的键名映射
 * @param {boolean} preserveOriginalKeys 是否保留原键名 默认不保留
 * @example
 * const res = replaceObjKeys({ a: 1, b: 2 }, { a: 'aa', b: 'bb'})
 * // => { 'aa': 1, 'bb': 2 }
 */
export const replaceObjKeys = (
  obj: Recordable,
  key2key: Recordable = {},
  preserveOriginalKeys = false,
) => {
  if (getType(obj) !== 'Object') return obj;

  const res: Recordable = {};
  if (Object.keys(key2key).length < 1) return preserveOriginalKeys ? obj : res;

  for (const [key, newKey] of Object.entries(key2key)) {
    if (key === newKey || Reflect.has(obj, newKey) || !Reflect.has(obj, key)) continue;
    obj[newKey] = obj[key];
    if (!preserveOriginalKeys) delete obj[key];
  }

  return obj;
};
