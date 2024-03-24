import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

export interface RequestInterceptors<R> {
  // 请求拦截器
  requestInterceptor?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig
  requestInterceptorCatch?: (err: unknown) => unknown
  // 响应拦截器
  responseInterceptor?: (response: R) => R
  responseInterceptorCatch?: (err: unknown) => unknown
}

// 返回值类型，请求体类型，参数类型
export interface Config<R = AxiosResponse, D = unknown, P=unknown> extends AxiosRequestConfig<D> {
  interceptors?: RequestInterceptors<R>
  params?: P
}
