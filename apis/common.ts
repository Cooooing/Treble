import { defHttp } from "@/utils/http";
import * as qiniu from 'qiniu-js'; 

/**
 * 获取上传文件凭证
 * POST /v1/oss/uploadToken
 * 接口ID：380538931
 * 接口地址：https://app.apifox.com/link/project/7258948/apis/api-380538931
 */
export function getUploadToken() {
  return defHttp.post<{
    token: string;
  }>({
    url: '/v1/oss/uploadToken',
  });
}

export async function uploadFileToOss(files: File[], token: string, vars?: Recordable<string>) {
  const config = {
    useCdnDomain: true,
    region: qiniu.region.z2,
  };

  const uploadPromises = files.map(file => {
    const putExtra = {
      fname: file.name,
      customVars: vars || {},
    };

    if (file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) {
      const imageConfig = {
        quality: 92,
        noCompressIfLarger: true
      };
      qiniu.compressImage(file, imageConfig).then(compressedFile => {
        file = compressedFile.dist as File;
      });
    }

    const key = `${Date.now()}_${file.name}`;
    const observable = qiniu.upload(file, key, token, putExtra, config);
    return new Promise<{ filename: string; url: string; hash: string }>((resolve, reject) => {
      const subscription = observable.subscribe({
        next() {},
        error(err) {
          reject(err);
        },
        complete(res) {
          debugger;
          resolve({ url: res.key, hash: res.hash, filename: file.name });
          subscription.unsubscribe();
        },
      });
    });
  });

  return Promise.all(uploadPromises);
}