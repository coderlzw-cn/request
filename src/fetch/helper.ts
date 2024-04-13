import { type FetchRequestOptions } from './type'

export function is2xxSuccessful (response: Response): boolean {
  return response.status >= 200 && response.status < 300
}

export function is3xxRedirect (response: Response): boolean {
  return response.status >= 300 && response.status < 400
}

export function is4xxClientError (response: Response): boolean {
  return response.status >= 400 && response.status < 500
}

export function is5xxServerError (response: Response): boolean {
  return response.status >= 500 && response.status < 600
}

export function isTimeoutError (error: any): boolean {
  return error.name === 'AbortError'
}

export function timeoutPromise (controller: AbortController, timeout: number) {
  return setTimeout(() => { controller.abort('Request timeout') }, timeout)
}

export function getRequestPath<P extends Record<string, any>, B> (url: string, options?: FetchRequestOptions<P, B>) {
  // 将url和params分开
  let [path, paramsString] = url.split('?')
  // 去除请求路径中不知名的空格
  path = path.replace(/\s/g, '')
  // 获取 url 中携带的所有请求参数，转换为 object
  const urlSearchParams = new URLSearchParams(paramsString)
  let params = Object.fromEntries(urlSearchParams)
  // 将options中的params合并到params中, options中的params优先级更高
  params = Object.assign(params, options?.params)
  const searchParams = new URLSearchParams(params).toString()
  return Object.keys(params).length > 0 ? `${path}?${searchParams}` : path
}

export function isPlainObject (value: any): value is Record<string, any> {
  return typeof value === 'object' &&
        value !== null &&
        value.constructor === Object &&
        Object.prototype.toString.call(value) === '[object Object]'
}
