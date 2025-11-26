import { defHttp } from "@/utils/http";
import * as qiniu from 'qiniu-js'; 

export interface IBasicPageParams<T> {
  /**
   * 分页参数
   */
  page: {
    /**
     * 页码
     */
    page?: number;
    /**
     * 页大小
     */
    size?: number;
  };
  /**
   * 查询参数
   */
  query: T;
}

export interface IBasicPageResult<T> {
    /**
     * 分页
     */
    page: {
      /**
       * 页码
       */
      page?: number;
      /**
       * 页大小
       */
      size?: number;
      /**
       * 总数
       */
      total?: number;
    };
    /**
     * 用户列表
     */
    rows: T[];
}

export interface IUploadFile { 
  filename: string; 
  url: string; 
  hash: string 
}

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

export function uploadFileToOss(
  files: File[], 
  token: string, 
  { 
    vars,
    onProgress,
  }: { 
    vars?: Recordable<string>,
    onProgress?: (percent: number, filename: string) => any,
  }
) {
  const config = {
    useCdnDomain: true,
    region: qiniu.region.z2,
  };

  const results: IUploadFile[] = [];
  const uploadPromises: Promise<IUploadFile>[] = [];
  let cancelUpload: (() => void) | null = null;
  const ret = {
    cancel: () => { cancelUpload?.(); },
    results: () => Promise.all<IUploadFile>(uploadPromises)
    .then(() => ({ err: undefined }))
    .catch((err: Error) => ({
      err,
    }))
    .then((ret) => ({ err: ret.err, files: results })),
  }

  // 依次上传
  for (let file of files) {
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

    const observable = qiniu.upload(file, null, token, putExtra, config);
    uploadPromises.push(new Promise<IUploadFile>((resolve, reject) => {
      const subscription = observable.subscribe({
        next({ total }) {
          // 获取上传进度
          onProgress?.(total.percent, file.name);
        },
        error(err) {
          reject(err);
        },
        complete(res) {
          debugger;
          results.push({ url: res.key, hash: res.hash, filename: file.name });
          subscription.unsubscribe();
        },
      });
      cancelUpload = () => subscription.unsubscribe();
    }));
  }

  return ret;
}