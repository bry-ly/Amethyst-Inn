// Types for auth-related API responses
export interface BannedWordsResponse {
  success: boolean
  data?: {
    english?: string[]
    filipino?: string[]
  }
}

export interface RegisterResponse {
  success?: boolean
  message?: string
  error?: string
  token?: string
}

export {}
