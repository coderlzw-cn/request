type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE'

interface FetchRequestConfig {
  baseURL: string
  timeout: number
}

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type InterceptorHandler<T> = (value: T) => T | Promise<T> | void

interface RequestConfigGet<P> extends Omit<RequestInit, 'method' | 'body'> {
  params?: P
}

interface RequestConfigPost<B, P> extends Omit<RequestInit, 'body' | 'method'> {
  params?: P
  body?: B
}

interface Interceptor {
  request?: InterceptorHandler<Request>
  response?: InterceptorHandler<Response>
  requestError?: InterceptorHandler<Request>
  responseError?: InterceptorHandler<Response>
}
