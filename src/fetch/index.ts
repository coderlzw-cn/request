import { getRequestPath, is2xxSuccessful, is3xxRedirect, isPlainObject, timeoutPromise } from './helper'
import { type FetchRequestConfig, type FetchRequestOptions, type Interceptors } from './type'
import { StatusCode } from './status'
import { ContentType } from './contentType'

class FetchRequest {
  private readonly baseURL: string = '.'
  private readonly timeout: number = 10000
  private readonly interceptors: Interceptors = {
    requestInterceptor: undefined,
    responseInterceptor: undefined,
    requestInterceptorCatch: undefined,
    responseInterceptorCatch: undefined
  }

  constructor (config?: FetchRequestConfig) {
    this.baseURL = config?.baseURL ?? this.baseURL
    this.timeout = config?.timeout ?? this.timeout
    this.interceptors = config?.interceptors ?? this.interceptors
  }

  /**
     * 发送请求
     * @param url   请求路径
     * @param options  请求配置
     * @returns
     */
  public async fetch<D = any, P extends Record<string, any> = Record<string, any>, B = unknown>(url: string, options?: FetchRequestOptions<P, B>) {
    // 去除url中多余的斜杠
    url = `${this.baseURL}/${url}`.replace(/([^:]\/)\/+/g, '$1')

    const controller = new AbortController()
    const signal = controller.signal

    // 设置请求头
    const path = getRequestPath<P, B>(url, options)
    const optionHeaders = options?.headers
    const headers = new Headers()
    if (optionHeaders != null) for (const [key, value] of Object.entries(optionHeaders)) headers.set(key, value as string)

    // 设置请求体
    const optionsBody = options?.body
    let body: RequestInit['body'] = null
    const requestInit: RequestInit = {
      signal,
      ...options,
      body
    }

    // 如果是字面量对象，则设置请求头为json格式
    if (isPlainObject(optionsBody)) {
      headers.set('Content-Type', ContentType.JSON)
      body = JSON.stringify(optionsBody)
    }

    requestInit.headers = headers
    requestInit.body = body ?? optionsBody as BodyInit

    let request = new Request(path, requestInit)

    try {
      if (this.interceptors.requestInterceptor != null) {
        const interceptedRequest = await this.interceptors.requestInterceptor(request)
        if (interceptedRequest != null) {
          if (interceptedRequest instanceof Request) {
            request = interceptedRequest
          } else {
            throw new Error('Request interceptor must return a Request object')
          }
        }
      }
    } catch (error: any) {
      if (this.interceptors.requestInterceptorCatch != null) {
        const requestInterceptorCatch = await this.interceptors.requestInterceptorCatch({
          request,
          error
        })
        if (requestInterceptorCatch != null) {
          // requestInterceptorCatch 必须返回 Promise.reject 或者 throw new Error
          throw new Error('Request interceptor catch must return a rejected Promise or throw an Error')
        }
        throw error
      }
    }

    // 发送请求
    let response: Response
    try {
      const timerId = timeoutPromise(controller, options?.timeout ?? this.timeout)
      response = await fetch(request)
      clearTimeout(timerId)
    } catch (error: any) {
      console.log(controller.signal.aborted)
      if (controller.signal.aborted) throw new Error(controller.signal.reason)
      throw error
    }

    if (is3xxRedirect(response)) {
      return response as D
    }

    /**
         * 如果请求失败，且存在异常拦截器，则执行异常拦截器中的逻辑
         * 如果异常拦截器返回值不为空，则返回异常拦截器返回值，否则返回原始异常
         */
    if (!is2xxSuccessful(response) && !is3xxRedirect(response)) {
      const responseCatch = {
        request,
        response,
        message: StatusCode[response.status] ?? 'Request failed'
      }

      if (this.interceptors.responseInterceptorCatch != null) {
        const rejectResponse = await this.interceptors.responseInterceptorCatch(responseCatch)
        if (rejectResponse != null) throw rejectResponse
      }
      throw new Error(responseCatch.message)
    }

    // 对于流类型的数据，直接返回，不走拦截器
    const contentType = response.headers.get('Content-Type') as ContentType
    if (contentType != null && contentType.includes(ContentType.MULTIPART)) {
      return await response.formData() as unknown as D
    } else if (contentType != null && [ContentType.IMAGE, ContentType.STREAM].includes(contentType)) {
      if (options?.onProgress != null) {
        const reader = response.body?.getReader()
        if (reader != null) {
          const contentLength = response.headers.get('Content-Length')
          let receivedLength = 0
          const chunks = []
          while (true) {
            const {
              done,
              value
            } = await reader.read()
            if (done) break
            if (value != null) {
              chunks.push(value)
              receivedLength += value.length
              options.onProgress(receivedLength / Number(contentLength))
            }
          }
          const chunksAll = new Uint8Array(receivedLength) // 创建一个新的 Uint8Array 来保存所有的二进制块
          let position = 0
          for (const chunk of chunks) {
            chunksAll.set(chunk, position)
            position += chunk.length
          }
          return chunksAll as unknown as D
        }
      }
      return await response.blob() as unknown as D
    }

    /**
         * 如果请求成功，且存在响应拦截器，则执行响应拦截器
         */
    if (this.interceptors.responseInterceptor != null) {
      const interceptedResponse = await this.interceptors.responseInterceptor(response)
      if (interceptedResponse != null) {
        return interceptedResponse as D
      }
    }

    // 对于json和text类型的数据
    if (contentType != null && contentType.includes('application/json')) {
      return await response.json() as D
    } else if (contentType != null && contentType.includes('text')) {
      return await response.text() as unknown as D
    }
    return response as D
  }

  /**
     * GET
     * @param url
     * @param options
     * @returns
     */
  public async get<D = unknown, P extends Record<string, any> = Record<string, any>>(url: string, options?: FetchRequestOptions<P, undefined>) {
    const response = await this.fetch(url, { method: 'GET', ...options })
    return this.interceptors.responseInterceptor != null ? response as D : response
  }

  /**
     * POST
     * @param url
     * @param options
     * @returns
     */
  public async post<D = unknown, B = unknown, P extends Record<string, any> = Record<string, any>>(url: string, options?: FetchRequestOptions<P, B>) {
    const response = await this.fetch(url, { method: 'POST', ...options })
    return this.interceptors.responseInterceptor != null ? response as D : response
  }

  /**
     * PUT
     * @param url
     * @param options
     * @returns
     */
  public async put<D = unknown, B = unknown, P extends Record<string, any> = Record<string, any>>(url: string, options?: FetchRequestOptions<P, B>) {
    const response = await this.fetch(url, { method: 'PUT', ...options })
    return this.interceptors.responseInterceptor != null ? response as D : response
  }

  /**
     * DELETE
     * @param url
     * @param options
     * @returns
     */
  public async delete<D = unknown, B = unknown, P extends Record<string, any> = Record<string, any>>(url: string, options?: FetchRequestOptions<P, B>) {
    const response = await this.fetch(url, { method: 'DELETE', ...options })
    return this.interceptors.responseInterceptor != null ? response as D : response
  }

  /**
     * PATCH
     * @param url
     * @param options
     * @returns
     */
  public async patch<D = unknown, B = unknown, P extends Record<string, any> = Record<string, any>>(url: string, options?: FetchRequestOptions<P, B>) {
    const response = await this.fetch(url, { method: 'PATCH', ...options })
    return this.interceptors.responseInterceptor != null ? response as D : response
  }
}

export default FetchRequest
