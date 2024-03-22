class FetchRequest {
  private readonly baseURL?: string
  private readonly timeout?: number

  constructor (config?: FetchRequestConfig) {
    this.baseURL = config?.baseURL ?? location.origin
    this.timeout = config?.timeout ?? 5000
  }

  private readonly interceptors: Interceptor = {
    request: undefined,
    response: undefined,
    requestError: undefined,
    responseError: undefined

  }

  /**
     * 添加请求拦截器
     * @param interceptor
     * @param errorInterceptor
     */
  public addRequestInterceptor (interceptor?: InterceptorHandler<Request>, errorInterceptor?: InterceptorHandler<Request>): void {
    this.interceptors.requestError = errorInterceptor
    this.interceptors.request = interceptor
  }

  /**
     * 添加响应拦截器
     * @param interceptor
     * @param errorInterceptor
     */
  public addResponseInterceptor (interceptor?: InterceptorHandler<Response>, errorInterceptor?: InterceptorHandler<Response>) {
    this.interceptors.response = interceptor
    this.interceptors.responseError = errorInterceptor
  }

  private getRequestPath (url: string, options?: RequestConfigGet<unknown> | RequestConfigPost<unknown, unknown>) {
    // eslint-disable-next-line prefer-const
    let [path, paramsString] = url.split('?')

    // 去除请求路径中的空格
    path = path.replace(/\s/g, '')

    // 获取url中携带的所有请求参数，转换为object
    let params = Object.fromEntries(new URLSearchParams(paramsString))
    params = Object.assign(params, options?.params)

    const searchParams = new URLSearchParams(params)
    return Object.keys(params).length > 0 ? `${path}?${searchParams.toString()}` : path
  }

  private async timeoutPromise (controller: AbortController, request: Request) {
    return await new Promise<Response>((_resolve, reject) => {
      const timeoutId = setTimeout(() => {
        controller.abort()
        reject(request)
      }, this.timeout)
      controller.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId)
      })
    })
  }

  /**
     * 发送请求
     * @param url   请求路径
     * @param options  请求配置
     * @returns
     */
  public async fetch (url: string, options?: Omit<RequestInit, 'method'> & { method: Method }) {
    // 去除url中多余的斜杠
    url = `${this.baseURL}/${url}`.replace(/([^:]\/)\/+/g, '$1')
    let request = new Request(url, options)

    try {
      if (this.interceptors.request != null) {
        const interceptedRequest = await this.interceptors.request(request)
        if (interceptedRequest != null) {
          request = interceptedRequest
        }
      }
    } catch {
      // 在拦截器中抛出异常，执行异常拦截器，并且终止请求
      if (this.interceptors.requestError != null) {
        void this.interceptors.requestError(request)
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw request
      }
    }

    let response = await fetch(request)

    /**
         * 如果请求失败，且存在异常拦截器，则执行异常拦截器
         * 如果异常拦截器返回值不为空，则返回异常拦截器返回值，否则返回原始异常
         */
    if (!response.ok && (this.interceptors.responseError != null)) {
      const rejectResponse = await this.interceptors.responseError(response)
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw rejectResponse ?? response
    }

    /**
         * 如果请求成功，且存在响应拦截器，则执行响应拦截器
         */
    if (response.ok && (this.interceptors.response != null)) {
      const interceptedResponse = await this.interceptors.response(response)
      if (interceptedResponse != null) {
        response = interceptedResponse
      }
    }

    if (!response.ok) {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw response
    }

    return response
  }

  /**
     * GET
     * @param url
     * @param options
     * @returns
     */
  public async get<D = unknown, P = unknown>(url: string, options?: RequestConfigGet<P>) {
    const controller = new AbortController()
    const signal = controller.signal
    const path = this.getRequestPath(url, options)
    const fetchPromise = this.fetch(path, { method: 'GET', signal, ...options })

    const request = new Request(path, { method: 'GET', signal, ...options })

    const response = await Promise.race([fetchPromise, this.timeoutPromise(controller, request)])

    if (this.interceptors.response != null) {
      return await (response as unknown as Promise<D>)
    }

    return await ((await response.json()) as Promise<D>)
  }

  public async post<D = unknown, B extends BodyInit | Record<string, unknown> = '', P = unknown>(
    url: string,
    options?: RequestConfigPost<B, P>
  ): Promise<D> {
    const controller = new AbortController()
    const signal = controller.signal
    const path = this.getRequestPath(url, options)

    const headers = new Headers()
    const data = options?.body

    if (data instanceof FormData) {
      headers.set('Content-Type', 'multipart/form-data')
    } else if (data instanceof Blob) {
      headers.set('Content-Type', 'application/octet-stream')
    } else if (typeof data === 'object' && !(data instanceof Blob) && !(data instanceof FormData)) {
      headers.set('Content-Type', 'application/json; charset=UTF-8')
    } else {
      headers.set('Content-Type', 'text/plain')
    }

    const body =
            typeof data === 'object' && !(data instanceof Blob) && !(data instanceof FormData)
              ? JSON.stringify(data)
              : (data as BodyInit)

    const fetchPromise = this.fetch(path, {
      method: 'POST',
      headers,
      signal,
      ...options,
      body
    })

    // 等待请求结果
    const request = new Request(path, { method: 'POST', headers, signal, ...options, body })
    const response = await Promise.race([fetchPromise, this.timeoutPromise(controller, request)])

    if (this.interceptors.response != null) {
      return await (response as unknown as Promise<D>)
    }
    return await (await response.json() as Promise<D>)
  }

  public async put<D = unknown, B extends BodyInit | Record<string, unknown> = '', P = unknown>(
    url: string,
    options?: RequestConfigPost<B, P>
  ): Promise<D> {
    const controller = new AbortController()
    const signal = controller.signal
    const path = this.getRequestPath(url, options)
    const headers = new Headers()
    const data = options?.body
    if (data instanceof FormData) {
      headers.set('Content-Type', 'multipart/form-data')
    } else if (data instanceof Blob) {
      headers.set('Content-Type', 'application/octet-stream')
    } else if (typeof data === 'object' && !(data instanceof Blob) && !(data instanceof FormData)) {
      headers.set('Content-Type', 'application/json; charset=UTF-8')
    } else {
      headers.set('Content-Type', 'text/plain')
    }
    const body =
            typeof data === 'object' && !(data instanceof Blob) && !(data instanceof FormData)
              ? JSON.stringify(data)
              : (data as BodyInit)
    const fetchPromise = this.fetch(path, {
      headers,
      signal,
      ...options,
      method: 'PUT',
      body
    })
    // Wait for the request to complete
    const request = new Request(path, { method: 'PUT', headers, signal, ...options, body })
    const response = await Promise.race([fetchPromise, this.timeoutPromise(controller, request)])
    if (this.interceptors.response != null) {
      return await (response as unknown as Promise<D>)
    }
    return await (await response.json() as Promise<D>)
  }

  public async patch<D = unknown, B extends BodyInit | Record<string, unknown> = '', P = unknown>(
    url: string,
    options?: RequestConfigPost<B, P>
  ): Promise<D> {
    const controller = new AbortController()
    const signal = controller.signal
    const path = this.getRequestPath(url, options)
    const headers = new Headers()
    const data = options?.body
    if (data instanceof FormData) {
      headers.set('Content-Type', 'multipart/form-data')
    } else if (data instanceof Blob) {
      headers.set('Content-Type', 'application/octet-stream')
    } else if (typeof data === 'object' && !(data instanceof Blob) && !(data instanceof FormData)) {
      headers.set('Content-Type', 'application/json; charset=UTF-8')
    } else {
      headers.set('Content-Type', 'text/plain')
    }
    const body =
            typeof data === 'object' && !(data instanceof Blob) && !(data instanceof FormData)
              ? JSON.stringify(data)
              : (data as BodyInit)
    const fetchPromise = this.fetch(path, {
      method: 'PATCH',
      headers,
      signal,
      ...options,
      body
    })
    // Wait for the request to complete
    const request = new Request(path, { method: 'PATCH', headers, signal, ...options, body })
    const response = await Promise.race([fetchPromise, this.timeoutPromise(controller, request)])
    if (this.interceptors.response != null) {
      return await (response as unknown as Promise<D>)
    }
    return await (await response.json() as Promise<D>)
  }

  public async delete<D = unknown, B extends BodyInit | Record<string, unknown> = '', P = unknown>(
    url: string,
    options?: RequestConfigPost<B, P>
  ): Promise<D> {
    const controller = new AbortController()
    const signal = controller.signal
    const path = this.getRequestPath(url, options)
    const headers = new Headers()
    const data = options?.body
    if (data instanceof FormData) {
      headers.set('Content-Type', 'multipart/form-data')
    } else if (data instanceof Blob) {
      headers.set('Content-Type', 'application/octet-stream')
    } else if (typeof data === 'object' && !(data instanceof Blob) && !(data instanceof FormData)) {
      headers.set('Content-Type', 'application/json; charset=UTF-8')
    } else {
      headers.set('Content-Type', 'text/plain')
    }
    const body =
            typeof data === 'object' && !(data instanceof Blob) && !(data instanceof FormData)
              ? JSON.stringify(data)
              : (data as BodyInit)
    const fetchPromise = this.fetch(path, {
      headers,
      signal,
      ...options,
      method: 'DELETE',
      body
    })
    // Wait for the request to complete
    const request = new Request(path, { method: 'DELETE', headers, signal, ...options, body })
    const response = await Promise.race([fetchPromise, this.timeoutPromise(controller, request)])
    if (this.interceptors.response != null) {
      return await (response as unknown as Promise<D>)
    }
    return await (await response.json() as Promise<D>)
  }
}

export default FetchRequest
