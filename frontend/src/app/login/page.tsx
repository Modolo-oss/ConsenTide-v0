'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  KeyIcon
} from '@heroicons/react/24/outline'
import { api } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setErrors({})
    
    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      })

      if (response.data.success) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        const role = response.data.user.role
        if (role === 'admin') {
          router.push('/admin')
        } else if (role === 'controller') {
          router.push('/compliance')
        } else {
          router.push('/dashboard')
        }
      } else {
        setErrors({ general: response.data.message || 'Login failed' })
      }
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.response?.status === 401) {
        setErrors({ general: 'Invalid email or password' })
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message })
      } else {
        setErrors({ general: 'An error occurred. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = (email: string, password: string) => {
    setFormData({ email, password })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to access your consent dashboard
          </p>
        </div>

        {/* Demo Accounts Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <svg className="h-5 w-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold text-blue-800">Demo Accounts for Judges</span>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => fillDemoCredentials('user@consentire.io', 'user123')}
              className="w-full text-left p-2 rounded hover:bg-blue-100 transition text-sm"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-900">👥 User</span>
                <span className="text-blue-700">user@consentire.io / user123</span>
              </div>
            </button>
            <button
              onClick={() => fillDemoCredentials('controller@consentire.com', 'controller123')}
              className="w-full text-left p-2 rounded hover:bg-blue-100 transition text-sm"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-900">🏢 Controller</span>
                <span className="text-blue-700">controller@consentire.com / controller123</span>
              </div>
            </button>
            <button
              onClick={() => fillDemoCredentials('regulator@consentire.io', 'reg123')}
              className="w-full text-left p-2 rounded hover:bg-blue-100 transition text-sm"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-900">🔬 Regulator</span>
                <span className="text-blue-700">regulator@consentire.io / reg123</span>
              </div>
            </button>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <EnvelopeIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <KeyIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-800 font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            ConsenTide - GDPR Compliant Consent Management
          </p>
        </div>
      </div>
    </div>
  )
}
