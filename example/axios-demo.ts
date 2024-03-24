import Request from '../src/axios'

const axiosInstance = new Request<DataType>({
  baseURL: '/api',
  interceptors: {
    requestInterceptor: async config => {
      console.log('2')
      return config
    },
    responseInterceptor: async ({ data }) => {
      return data
    },
    responseInterceptorCatch: async (error: any): Promise<unknown> => {
      return await Promise.reject(error.message)
    }
  }
})

void axiosInstance.get({
  url: '/users',
  params: { id: 1 },
  interceptors: {
    requestInterceptor: async config => {
      console.log('1')
      return config
    },
    responseInterceptor: async ({ data }) => {
      return data
    },
    responseInterceptorCatch: async (error: any): Promise<unknown> => {
      return await Promise.reject(error.message)
    }
  }
})
