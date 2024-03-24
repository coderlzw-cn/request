interface DataType<T = unknown> {
  data: T
  message: string
  code: number
  success: boolean
}

interface User {
  name: string
  age: number
  email: string
}
