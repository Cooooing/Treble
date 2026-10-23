import { sha256 as sha256Fallback } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { ApiError, bbsClient } from "@/utils/sdk";

const maxImageSize = 5 * 1024 * 1024;
const acceptedMimeTypes = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]);

export async function uploadMarkdownImage(file: File, onProgress?: (progress: number) => void) {
  validateImage(file);
  const content = new Uint8Array(await file.arrayBuffer());
  const hash = await sha256(content);
  const prepared = await bbsClient.asset.prepareMarkdownImageUpload({
    prepareMarkdownImageUploadReq: {
      hash,
      mimeType: file.type,
      size: content.byteLength.toString(),
    },
  });
  if (prepared.assetId == null) {
    await postToObjectStorage(prepared.uploadUrl, prepared.formFields, file, onProgress);
  }
  const completed = await completeMarkdownImageUpload(hash);
  if (!completed.imageUrl) throw new Error("图片地址无效，请重试。");
  return `![${markdownAlt(file.name)}](${completed.imageUrl})`;
}

function validateImage(file: File) {
  if (!acceptedMimeTypes.has(file.type)) {
    throw new Error("仅支持 JPEG、PNG、GIF 或 WebP 图片。");
  }
  if (file.size <= 0) {
    throw new Error("图片不能为空。");
  }
  if (file.size > maxImageSize) {
    throw new Error("图片文件不能超过 5 MiB。");
  }
}

async function sha256(content: Uint8Array) {
  // Web Crypto is unavailable on HTTP development origins. Keep the same
  // deterministic fallback as profile image uploads for local use.
  if (!globalThis.crypto?.subtle) return bytesToHex(sha256Fallback(content));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", content.slice().buffer);
  return bytesToHex(new Uint8Array(digest));
}

async function postToObjectStorage(
  uploadUrl: string | undefined,
  fields: Record<string, string> | undefined,
  file: File,
  onProgress?: (progress: number) => void,
) {
  if (!uploadUrl || !fields) throw new Error("上传凭证无效，请重试。");
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) form.append(name, value);
  form.append("file", file, file.name);
  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", uploadUrl);
    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }
      reject(new Error("图片直传失败，请重试。"));
    });
    request.addEventListener("error", () => reject(new Error("图片直传失败，请重试。")));
    request.addEventListener("abort", () => reject(new Error("图片上传已取消。")));
    request.send(form);
  });
}

async function completeMarkdownImageUpload(hash: string) {
  let lastError: unknown;
  const deadline = Date.now() + 30_000;
  let attempt = 0;
  while (Date.now() < deadline) {
    try {
      return await bbsClient.asset.completeMarkdownImageUpload({ completeMarkdownImageUploadReq: { hash } });
    } catch (error) {
      lastError = error;
      // MinIO's event-to-directory callback is asynchronous. A 404 is the
      // only expected retry state; all other failures are final for this file.
      if (!(error instanceof ApiError) || error.status !== 404) throw error;
      const delay = Math.min(250 * 2 ** attempt, 2_000);
      attempt += 1;
      await new Promise((resolve) => window.setTimeout(resolve, delay));
    }
  }
  throw lastError || new Error("图片处理超时，请稍后重试。");
}

function markdownAlt(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim();
  const normalized = baseName
    .replace(/[\\\u005B\u005D()\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized || "图片";
}
