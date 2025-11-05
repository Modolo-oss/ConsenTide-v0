'use client'

import { useState, useEffect } from 'react'
import {
  ShieldCheckIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UsersIcon,
  KeyIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline'
import { api } from '@/lib/api'

type TabType = 'overview' | 'compliance' | 'api' | 'analytics'

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

interface GDPRArticle {
  article: string
  title: string
  description: string
  compliant: boolean
  score: number
}

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [stats, setStats] = useState<ComplianceStats | null>(null)
  const [controllers, setControllers] = useState<ControllerInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [isController, setIsController] = useState(false)
  const [apiKey, setApiKey] = useState<string>('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [gdprCompliance, setGdprCompliance] = useState<any>(null)
  const [currentControllerHash, setCurrentControllerHash] = useState<string | undefined>(undefined)

  // GDPR Article metadata
  const gdprArticleDetails = [
    {
      article: 'Article 7',
      key: 'gdprArticle7',
      title: 'Conditions for Consent',
      description: 'Consent must be freely given, specific, informed and unambiguous'
    },
    {
      article: 'Article 12',
      key: 'gdprArticle12',
      title: 'Transparent Information',
      description: 'Provide clear and accessible privacy information'
    },
    {
      article: 'Article 13',
      key: 'gdprArticle13',
      title: 'Information to be Provided',
      description: 'Inform data subjects at time of data collection'
    },
    {
      article: 'Article 17',
      key: 'gdprArticle17',
      title: 'Right to Erasure',
      description: 'Enable users to request data deletion'
    },
    {
      article: 'Article 20',
      key: 'gdprArticle20',
      title: 'Data Portability',
      description: 'Allow data export in machine-readable format'
    },
    {
      article: 'Article 25',
      key: 'gdprArticle25',
      title: 'Data Protection by Design',
      description: 'Implement privacy-enhancing technologies'
    },
    {
      article: 'Article 30',
      key: 'gdprArticle30',
      title: 'Records of Processing',
      description: 'Maintain audit logs of data processing activities'
    }
  ]

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
          generateApiKey(user.id)
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
      const [statsRes, controllersRes] = await Promise.all([
        api.get('/controllers/stats'),
        api.get('/controllers/all')
      ])

      setStats(statsRes.data)
      setControllers(controllersRes.data.controllers || [])
      
      // Fetch real GDPR compliance for the logged-in user's controller
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          
          // Find the controller matching the logged-in user's organization_id
          if (user.organizationId) {
            const userController = controllersRes.data.controllers.find(
              (ctrl: any) => ctrl.organization_id === user.organizationId
            )
            
            if (userController) {
              setCurrentControllerHash(userController.controller_hash)
              const complianceRes = await api.get(`/compliance/status/${userController.controller_hash}`)
              setGdprCompliance(complianceRes.data)
            } else {
              console.error(`No controller found for organizationId: ${user.organizationId}`)
              // Do NOT fallback to first controller - this would expose other organization's data
            }
          } else {
            console.warn('User has no organizationId assigned')
          }
        } catch (error) {
          console.error('Failed to load GDPR compliance:', error)
        }
      }
    } catch (error) {
      console.error('Failed to load compliance data:', error)
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

  const generateApiKey = (userId: string) => {
    const key = `ctd_${userId.substring(0, 8)}_${Math.random().toString(36).substring(2, 15)}`
    setApiKey(key)
  }

  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const handleSignIn = () => {
    window.location.href = '/login'
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const tabs = [
    { id: 'overview' as TabType, name: 'Overview', icon: ChartBarIcon },
    { id: 'compliance' as TabType, name: 'GDPR Compliance', icon: ShieldCheckIcon },
    { id: 'api' as TabType, name: 'API Integration', icon: CodeBracketIcon },
    { id: 'analytics' as TabType, name: 'User Analytics', icon: ArrowTrendingUpIcon }
  ]

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
                <p className="text-sm text-gray-600">Manage GDPR compliance and consent automation</p>
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

        {isController && (
          <>
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow mb-6">
              <nav className="flex space-x-4 p-4 border-b border-gray-200">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.name}</span>
                    </button>
                  )
                })}
              </nav>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <OverviewTab stats={stats} controllers={controllers} />
                )}

                {activeTab === 'compliance' && (
                  <ComplianceTab compliance={gdprCompliance} articleDetails={gdprArticleDetails} />
                )}

                {activeTab === 'api' && (
                  <APIIntegrationTab 
                    apiKey={apiKey}
                    showApiKey={showApiKey}
                    onToggleKey={() => setShowApiKey(!showApiKey)}
                    onCopy={copyToClipboard}
                  />
                )}

                {activeTab === 'analytics' && (
                  <AnalyticsTab stats={stats} controllerHash={currentControllerHash} />
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function OverviewTab({ 
  stats, 
  controllers 
}: { 
  stats: ComplianceStats | null, 
  controllers: ControllerInfo[] 
}) {
  return (
    <div>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Registered Controllers</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalControllers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Consents</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeConsents?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Compliance Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.complianceScore || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Data Subjects</p>
              <p className="text-2xl font-bold text-gray-900">10K+</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Progress */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Compliance Progress</h2>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full"
            style={{ width: `${stats?.complianceScore || 0}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Current: {stats?.complianceScore || 0}%</span>
          <span>Target: 95%</span>
        </div>
      </div>

      {/* Controller Directory */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Controller Directory</h2>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {controllers.map((controller) => (
                <tr key={controller.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{controller.name}</div>
                      <div className="text-sm text-gray-500">{controller.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      controller.complianceScore >= 90 ? 'bg-green-100 text-green-800' :
                      controller.complianceScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {controller.complianceScore}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {controller.totalConsents.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(controller.lastAudit).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ComplianceTab({ 
  compliance, 
  articleDetails 
}: { 
  compliance: any, 
  articleDetails: any[] 
}) {
  const overallScore = compliance?.overallCompliance || 0

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">GDPR Compliance Monitor</h2>
        <p className="text-sm text-gray-600 mt-1">Real-time compliance status from database</p>
      </div>

      {!compliance ? (
        <div className="text-center py-12 text-gray-500">Loading GDPR compliance data...</div>
      ) : (
        <>
          {/* Overall Compliance */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall GDPR Compliance</h3>
                <p className="text-sm text-gray-600">Real-time score based on consent data</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">{overallScore}%</div>
                <div className="text-sm text-gray-600 mt-1">
                  {overallScore >= 90 ? 'Excellent' : overallScore >= 75 ? 'Good' : 'Needs Improvement'}
                </div>
              </div>
            </div>
          </div>

          {/* GDPR Articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articleDetails.map((detail) => {
              const isCompliant = compliance[detail.key] || false
              return (
                <div key={detail.article} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        {isCompliant ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-600" />
                        )}
                        <span className="text-sm font-semibold text-gray-600">{detail.article}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{detail.title}</h3>
                    </div>
                    <span className={`text-lg font-bold ${isCompliant ? 'text-green-600' : 'text-red-600'}`}>
                      {isCompliant ? '✓' : '✗'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{detail.description}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${isCompliant ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: isCompliant ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function APIIntegrationTab({
  apiKey,
  showApiKey,
  onToggleKey,
  onCopy
}: {
  apiKey: string
  showApiKey: boolean
  onToggleKey: () => void
  onCopy: (text: string) => void
}) {
  const codeExample = `// Verify user consent via ConsenTide API
const response = await fetch('https://api.consentire.io/v1/consent/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${showApiKey ? apiKey : 'YOUR_API_KEY'}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user_123',
    controllerId: 'ctrl_456',
    purpose: 'marketing_emails'
  })
});

const { isValid } = await response.json();
if (isValid) {
  // Process user data
}`

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">API Integration</h2>
        <p className="text-sm text-gray-600 mt-1">Integrate ConsenTide consent verification into your applications</p>
      </div>

      {/* API Key Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <KeyIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">API Key</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">Use this key to authenticate API requests from your application</p>
        
        <div className="flex items-center space-x-2 mb-4">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            readOnly
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
          />
          <button
            onClick={onToggleKey}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            {showApiKey ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={() => onCopy(apiKey)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
            <span>Copy</span>
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Security Warning:</strong> Keep this API key secret. Never expose it in client-side code or public repositories.
          </p>
        </div>
      </div>

      {/* API Documentation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Guide</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">1. Verify Consent</h4>
            <p className="text-sm text-gray-600 mb-2">Check if a user has granted consent for a specific purpose</p>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-green-400 font-mono">{codeExample}</pre>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">2. Available Endpoints</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <code className="text-sm font-mono">POST /v1/consent/verify</code>
                <span className="text-xs text-gray-600">Verify consent validity</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <code className="text-sm font-mono">GET /v1/consent/user/:userId</code>
                <span className="text-xs text-gray-600">Get user consents</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <code className="text-sm font-mono">POST /v1/consent/grant</code>
                <span className="text-xs text-gray-600">Grant new consent</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <code className="text-sm font-mono">POST /v1/consent/revoke/:id</code>
                <span className="text-xs text-gray-600">Revoke consent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SDK Links */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Official SDKs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <CodeBracketIcon className="h-8 w-8 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">JavaScript/TypeScript</h4>
            <code className="text-xs text-gray-600">npm install @consentire/sdk</code>
          </div>
          <div className="bg-white rounded-lg p-4">
            <CodeBracketIcon className="h-8 w-8 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Python</h4>
            <code className="text-xs text-gray-600">pip install consentire</code>
          </div>
          <div className="bg-white rounded-lg p-4">
            <CodeBracketIcon className="h-8 w-8 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Go</h4>
            <code className="text-xs text-gray-600">go get consentire.io/sdk</code>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalyticsTab({ stats, controllerHash }: { stats: ComplianceStats | null, controllerHash?: string }) {
  const [trendData, setTrendData] = useState<any[]>([])
  const [purposeData, setPurposeData] = useState<any[]>([])
  const [statusData, setStatusData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Build query params with controller filtering
        const hashParam = controllerHash ? `&controllerHash=${controllerHash}` : ''
        
        const [trendsRes, purposesRes, statusRes] = await Promise.all([
          api.get(`/analytics/trends?days=30${hashParam}`),
          api.get(`/analytics/purposes?${hashParam.substring(1)}`),
          api.get(`/analytics/status-distribution?${hashParam.substring(1)}`)
        ])
        
        setTrendData(trendsRes.data.trends || [])
        setPurposeData(purposesRes.data.purposes || [])
        setStatusData(statusRes.data.distribution || [])
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [controllerHash])

  const totalConsents = statusData.reduce((sum, s) => sum + s.count, 0)
  const activeCount = statusData.find(s => s.status === 'granted')?.count || 0
  const revokedCount = statusData.find(s => s.status === 'revoked')?.count || 0
  const revocationRate = totalConsents > 0 ? ((revokedCount / totalConsents) * 100).toFixed(1) : '0.0'

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">User Analytics</h2>
        <p className="text-sm text-gray-600 mt-1">Real-time consent trends from database</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading real analytics...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Consents</p>
              <p className="text-2xl font-bold text-gray-900">{totalConsents}</p>
              <p className="text-xs text-blue-600 mt-1">All time</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Active Consents</p>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs text-green-600 mt-1">Currently granted</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Revocation Rate</p>
              <p className="text-2xl font-bold text-gray-900">{revocationRate}%</p>
              <p className="text-xs text-gray-600 mt-1">{revokedCount} revoked</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Compliance Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.complianceScore || 0}%</p>
              <p className="text-xs text-green-600 mt-1">GDPR compliant</p>
            </div>
          </div>

          {/* Consent Trends */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Consent Trends (Last 30 Days)</h3>
            {trendData.length > 0 ? (
              <div className="h-64 flex items-end justify-between space-x-2">
                {trendData.slice(0, 10).map((data, idx) => {
                  const maxValue = Math.max(...trendData.map(d => d.total))
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center justify-end" style={{ height: '200px' }}>
                        <div 
                          className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition cursor-pointer"
                          style={{ height: `${(data.total / (maxValue || 1)) * 100}%` }}
                          title={`${data.total} consents on ${new Date(data.date).toLocaleDateString()}`}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">{new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No trend data available</p>
            )}
            <div className="flex items-center justify-center space-x-4 mt-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span className="text-gray-600">Total Consents</span>
              </div>
            </div>
          </div>

          {/* Purpose Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Consent Purpose Breakdown</h3>
            <div className="space-y-4">
              {purposeData.length > 0 ? (
                purposeData.map((item, idx) => {
                  const percentage = totalConsents > 0 ? ((item.total / totalConsents) * 100).toFixed(0) : 0
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{item.purpose}</span>
                        <span className="text-sm text-gray-600">{item.total} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-500 text-center py-4">No purpose data available</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
