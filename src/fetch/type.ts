export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE'

export interface RequestCatch {
  request: Request
  error: any
}

export interface ResponseCatch {
  request: Request
  response: Response
  message: any
}

export interface Interceptors {
  requestInterceptor?: RequestInterceptorHandle<Request>
  requestInterceptorCatch?: RequestInterceptorHandle<RequestCatch>
  responseInterceptor?: ResponseInterceptorHandle<Response>
  responseInterceptorCatch?: (responseCatch: ResponseCatch) => void | Promise<ResponseCatch>
}

export interface FetchRequestConfig {
  baseURL?: string
  timeout?: number
  interceptors?: Interceptors
}

export interface FetchRequestOptions<P extends Record<string, string>, B> extends Omit<RequestInit, 'method' | 'body'> {
  method?: Method
  timeout?: number
  params?: P
  body?: B
  onProgress?: (progress: number) => void
}

export type RequestInterceptorHandle<T> = (value: T) => Promise<T> | undefined | unknown
export type ResponseInterceptorHandle<T> = (value: T) => Response | Promise<T> | undefined | unknown
