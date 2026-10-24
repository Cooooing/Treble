import lutePath from "vditor/dist/js/lute/lute.min.js?url";
import chineseI18nPath from "vditor/dist/js/i18n/zh_CN.js?url";

let assetsReady: Promise<Window["VditorI18n"]> | undefined;

function appendScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("编辑器资源加载失败。"));
    document.head.appendChild(script);
  });
}

function waitForRuntime() {
  return new Promise<Window["VditorI18n"]>((resolve, reject) => {
    const deadline = performance.now() + 10_000;
    const check = () => {
      const runtime = window as typeof window & { Lute?: { New?: unknown } };
      if (runtime.Lute?.New && window.VditorI18n) {
        resolve(window.VditorI18n);
        return;
      }
      if (performance.now() >= deadline) {
        reject(new Error("编辑器资源初始化超时。"));
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });
}

/**
 * Resolves Vditor's startup assets from this application's build output.
 *
 * Vditor's own loader treats an existing script element as loaded even while
 * the browser is still downloading it. Keeping one promise ahead of every
 * Vditor API call prevents that race between Markdown rendering and editors.
 */
export function loadVditorAssets() {
  assetsReady ??= appendScript("vditorLuteScript", lutePath)
    .then(() => appendScript("trebleVditorI18nScript", chineseI18nPath))
    .then(waitForRuntime)
    .catch((error) => {
      assetsReady = undefined;
      throw error;
    });

  return assetsReady;
}

export { lutePath };
