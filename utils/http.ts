import { getGlobalContext } from 'vike'

const globalContext = await getGlobalContext();

export interface HttpOptions {
  baseURL?: string;
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  contentType?: string;
  headers?: Record<string, string>;
  transformResponse?: boolean;
  data?: any;
  params?: Record<string, string | number | boolean>;
}

class DefHttp {
  apiPrefix = '';

  constructor(config?: { apiPrefix?: string }) {
    if (config?.apiPrefix) {
      this.apiPrefix = config.apiPrefix;
    }
  }

  get<T = any>(options: HttpOptions): Promise<T> {
    return this.request({ ...options, method: 'GET' });
  }

  post<T = any>(options: HttpOptions): Promise<T> {
    return this.request({ ...options, method: 'POST' });
  }

  put<T = any>(options: HttpOptions): Promise<T> {
    return this.request({ ...options, method: 'PUT' });
  }

  delete<T = any>(options: HttpOptions): Promise<T> {
    return this.request({ ...options, method: 'DELETE' });
  }

  patch<T = any>(options: HttpOptions): Promise<T> {
    return this.request({ ...options, method: 'PATCH' });
  }

  private async transformResponse(options: HttpOptions, res: Response) {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const { code, msg, data } = await res.json();
      if (code !== 0) {
        throw new Error(`Error ${code}: ${msg}`);
      }
      if (options.transformResponse) return data;
      return { code, msg, data };
    }
    return res.text();
  }

  private transformRequestOptions(options: HttpOptions): { url: string, options: RequestInit } {
    const defaultHeaders = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };

    if (options?.params) {
      const urlParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.params)) {
        urlParams.append(key, String(value));
      }
      options.url += `?${urlParams.toString()}`;
    }

    const requestOptions: RequestInit = {
      method: options?.method || 'GET',
      headers: {
        ...defaultHeaders,
        ...(options?.headers || {}),
      },
    };

    if (options?.data && options.contentType === 'application/json') {
      requestOptions.body = JSON.stringify(options.data);
    }

    return {
      url:`${options.baseURL || this.apiPrefix}${options.url}`,
      options: requestOptions,
    };
  }

  private request(options: HttpOptions) {
    options = Object.assign({ 
      transformResponse: true, 
      method: 'GET',
      contentType: 'application/json',
    }, options);
    const { url, options: requestOptions } = this.transformRequestOptions(options);
    let baseUrl = '';
    if (!globalContext.isClientSide && !url.startsWith('http')) {
      baseUrl = `http://localhost:${process.env.PORT || 2324}`;
    }
    console.log('HTTP Request URL:', baseUrl + url);
    return fetch(baseUrl + url, requestOptions).then((res) => this.transformResponse(options, res));
  }
}

const defHttp = new DefHttp({
  apiPrefix: import.meta.env.VITE_GLOB_API_URL || '',
});

export { defHttp };