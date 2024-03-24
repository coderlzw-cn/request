import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { type Config } from './index.type'

class Request {
  instance: AxiosInstance // 实例
  interceptors? // 实例拦截器
  constructor (config: Config) {
    this.instance = axios.create(config)
    this.interceptors = config.interceptors
    // 请求拦截器
    this.instance.interceptors.request.use(
      this.interceptors?.requestInterceptor,
      this.interceptors?.requestInterceptorCatch
    )
    // 相应拦截器
    this.instance.interceptors.response.use(
      this.interceptors?.responseInterceptor,
      this.interceptors?.responseInterceptorCatch
    )
  }

  async request<R>(config: Config<R>) {
    return await new Promise<any>((resolve, reject) => {
      if (config.interceptors?.requestInterceptor) {
        config = config.interceptors.requestInterceptor(config as unknown as InternalAxiosRequestConfig)
      }
      this.instance
        .request(config)
        .then((res) => {
          if (config.interceptors?.responseInterceptor != null) {
            res = config.interceptors.responseInterceptor(res as R) as any
          }
          resolve(res)
        })
        .catch((err: any) => {
          if (config.interceptors?.responseInterceptorCatch != null) {
            err = config.interceptors.responseInterceptorCatch(err)
          }
          reject(err)
        })
    })
  }

  async get<R = unknown, P = unknown>(config: Config<R, unknown, P>) {
    return await this.request<R>({
      ...config,
      method: 'GET'
    })
  }

  async post<R = unknown, D = unknown, P = unknown>(config: Config<R, D, P>) {
    return await this.request<R>({
      ...config,
      method: 'POST'
    })
  }

  async put<R = unknown, D = unknown, P = unknown>(config: Config<R, D, P>) {
    return await this.request<R>({
      method: 'PUT',
      ...config
    })
  }

  async patch<R = unknown, D = unknown, P = unknown>(config: Config<R, D, P>) {
    return await this.request<R>({
      method: 'PATCH',
      ...config
    })
  }

  async delete<R = unknown, D = unknown, P = unknown>(config: Config<R, D, P>) {
    return await this.request<R>({
      method: 'DELETE',
      ...config
    })
  }
}

export default Request
