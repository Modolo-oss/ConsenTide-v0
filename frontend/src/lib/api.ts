/**
 * API client for ConsenTide backend
 */

import axios from 'axios'
import type { APIError } from './types'

const getAPIURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    const protocol = window.location.protocol
    
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001'
    }
    
    return `${protocol}//${host}:3001`
  }
  
  return 'http://localhost:3001'
}

const API_URL = getAPIURL()

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
