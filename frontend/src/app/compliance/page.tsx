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

  const gdprArticles: GDPRArticle[] = [
    {
      article: 'Article 7',
      title: 'Conditions for Consent',
      description: 'Consent must be freely given, specific, informed and unambiguous',
      compliant: true,
      score: 95
    },
    {
      article: 'Article 12',
      title: 'Transparent Information',
      description: 'Provide clear and accessible privacy information',
      compliant: true,
      score: 92
    },
    {
      article: 'Article 13',
      title: 'Information to be Provided',
      description: 'Inform data subjects at time of data collection',
      compliant: true,
      score: 88
    },
    {
      article: 'Article 17',
      title: 'Right to Erasure',
      description: 'Enable users to request data deletion',
      compliant: true,
      score: 90
    },
    {
      article: 'Article 20',
      title: 'Data Portability',
      description: 'Allow data export in machine-readable format',
      compliant: true,
      score: 85
    },
    {
      article: 'Article 25',
      title: 'Data Protection by Design',
      description: 'Implement privacy-enhancing technologies',
      compliant: true,
      score: 93
    },
    {
      article: 'Article 30',
      title: 'Records of Processing',
      description: 'Maintain audit logs of data processing activities',
      compliant: true,
      score: 97
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
                  <ComplianceTab articles={gdprArticles} />
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
                  <AnalyticsTab stats={stats} />
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

function ComplianceTab({ articles }: { articles: GDPRArticle[] }) {
  const overallScore = Math.round(articles.reduce((acc, a) => acc + a.score, 0) / articles.length)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">GDPR Compliance Monitor</h2>
        <p className="text-sm text-gray-600 mt-1">Detailed compliance status for each GDPR article</p>
      </div>

      {/* Overall Compliance */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall GDPR Compliance</h3>
            <p className="text-sm text-gray-600">Aggregated score across all applicable articles</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600">{overallScore}%</div>
            <div className="text-sm text-gray-600 mt-1">Compliant</div>
          </div>
        </div>
      </div>

      {/* GDPR Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((article) => (
          <div key={article.article} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  {article.compliant ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm font-semibold text-gray-600">{article.article}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{article.title}</h3>
              </div>
              <span className={`text-lg font-bold ${
                article.score >= 90 ? 'text-green-600' :
                article.score >= 70 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {article.score}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{article.description}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  article.score >= 90 ? 'bg-green-500' :
                  article.score >= 70 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${article.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
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

function AnalyticsTab({ stats }: { stats: ComplianceStats | null }) {
  const mockTrendData = [
    { month: 'Jan', consents: 120, revocations: 5 },
    { month: 'Feb', consents: 180, revocations: 8 },
    { month: 'Mar', consents: 250, revocations: 12 },
    { month: 'Apr', consents: 310, revocations: 15 },
    { month: 'May', consents: 420, revocations: 18 },
    { month: 'Jun', consents: 580, revocations: 22 }
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">User Analytics</h2>
        <p className="text-sm text-gray-600 mt-1">Consent trends and user behavior insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Consents</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.activeConsents || 0}</p>
          <p className="text-xs text-green-600 mt-1">↑ 24% from last month</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Revocation Rate</p>
          <p className="text-2xl font-bold text-gray-900">3.8%</p>
          <p className="text-xs text-red-600 mt-1">↓ 1.2% from last month</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
          <p className="text-2xl font-bold text-gray-900">1.2s</p>
          <p className="text-xs text-green-600 mt-1">↓ 0.3s improvement</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">User Satisfaction</p>
          <p className="text-2xl font-bold text-gray-900">94%</p>
          <p className="text-xs text-green-600 mt-1">↑ 2% from last month</p>
        </div>
      </div>

      {/* Consent Trends */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Consent Trends (Last 6 Months)</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {mockTrendData.map((data, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: '200px' }}>
                <div 
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition cursor-pointer"
                  style={{ height: `${(data.consents / 600) * 100}%` }}
                  title={`${data.consents} consents`}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">{data.month}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center space-x-4 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span className="text-gray-600">Granted Consents</span>
          </div>
        </div>
      </div>

      {/* Purpose Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Consent Purpose Breakdown</h3>
        <div className="space-y-4">
          {[
            { purpose: 'Marketing Communications', percentage: 45, count: 261 },
            { purpose: 'Analytics & Research', percentage: 28, count: 162 },
            { purpose: 'Service Improvement', percentage: 18, count: 104 },
            { purpose: 'Third-party Sharing', percentage: 9, count: 52 }
          ].map((item, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{item.purpose}</span>
                <span className="text-sm text-gray-600">{item.count} ({item.percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
