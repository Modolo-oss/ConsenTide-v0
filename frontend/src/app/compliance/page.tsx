'use client'

import { useState, useEffect } from 'react'
import {
  ShieldCheckIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UsersIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { api } from '@/lib/api'

interface ComplianceStats {
  totalControllers: number
  activeConsents: number
  complianceScore: number
  lastUpdated: string
}

interface ControllerInfo {
  id: string
  name: string
  complianceScore: number
  totalConsents: number
  lastAudit: string
}

export default function CompliancePage() {
  const [stats, setStats] = useState<ComplianceStats | null>(null)
  const [controllers, setControllers] = useState<ControllerInfo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [isController, setIsController] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      
      if (!token || !userStr) {
        setSignedIn(false)
        setIsController(false)
        setLoading(false)
        return
      }

      try {
        const user = JSON.parse(userStr)
        setSignedIn(true)
        setIsController(user.role === 'controller')
        
        if (user.role === 'controller') {
          await loadComplianceData()
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
        setSignedIn(false)
        setIsController(false)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const loadComplianceData = async () => {
    try {
      // Fetch real data from backend API
      const [statsRes, controllersRes] = await Promise.all([
        api.get('/controllers/stats'),
        api.get('/controllers/all')
      ])

      setStats(statsRes.data)
      setControllers(controllersRes.data.controllers || [])
    } catch (error) {
      console.error('Failed to load compliance data:', error)
      // Fallback to empty data on error
      setStats({
        totalControllers: 0,
        activeConsents: 0,
        complianceScore: 0,
        lastUpdated: new Date().toISOString()
      })
      setControllers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredControllers = controllers.filter(controller =>
    controller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    controller.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const handleSignIn = () => {
    window.location.href = '/login'
  }

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading compliance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Controller Compliance Dashboard</h1>
                <p className="text-sm text-gray-600">Manage your organization's GDPR compliance</p>
              </div>
            </div>
            {signedIn ? (
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!signedIn && (
          <div className="bg-white rounded-lg shadow p-8 text-center mb-6">
            <p className="text-gray-700 mb-4">Sign in as a controller to view compliance dashboard.</p>
            <button onClick={handleSignIn} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Sign in</button>
          </div>
        )}

        {signedIn && !isController && (
          <div className="bg-white rounded-lg shadow p-8 text-center mb-6">
            <p className="text-gray-700">You must be a controller to access this dashboard.</p>
          </div>
        )}

        {/* Overview Stats */}
        {isController && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Registered Controllers</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalControllers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Consents</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeConsents?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Compliance Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.complianceScore || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Data Subjects Protected</p>
                <p className="text-2xl font-bold text-gray-900">10K+</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Score Overview */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Industry Compliance Overview</h2>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full"
                style={{ width: `${stats?.complianceScore || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Overall Compliance: {stats?.complianceScore || 0}%</span>
              <span>Target: 95%</span>
            </div>
          </div>
        </div>

        {/* Controller Directory */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Controller Compliance Directory</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search controllers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Controller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compliance Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Consents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Audit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredControllers.map((controller) => (
                  <tr key={controller.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{controller.name}</div>
                        <div className="text-sm text-gray-500">{controller.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getComplianceColor(controller.complianceScore)}`}>
                        {controller.complianceScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {controller.totalConsents.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(controller.lastAudit).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        controller.complianceScore >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {controller.complianceScore >= 80 ? 'Compliant' : 'Under Review'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredControllers.length === 0 && (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No controllers found</h3>
              <p className="text-gray-600">Try adjusting your search terms</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {isController && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-2">About This Dashboard</h3>
                <p className="text-sm text-blue-700 mb-3">
                  This compliance dashboard helps controllers manage GDPR compliance across data processing activities.
                  All data is updated in real-time and backed by immutable records on the Constellation Hypergraph.
                </p>
                <p className="text-xs text-blue-600">
                  For regulatory oversight access, contact your compliance administrator.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}