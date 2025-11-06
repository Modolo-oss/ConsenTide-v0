/**
 * API client for ConsenTide backend
 */

import axios from 'axios'
import type { APIError } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001' : '')

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - use localStorage token
api.interceptors.request.use(async (config) => {
  try {
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('token')
      if (token) {
        config.headers = config.headers || {}
        ;(config.headers as any).Authorization = `Bearer ${token}`
      }
    }
  } catch {}
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      const apiError: APIError = error.response.data
      console.error('API Error:', apiError)
    }
    return Promise.reject(error)
  }
)

export default api
