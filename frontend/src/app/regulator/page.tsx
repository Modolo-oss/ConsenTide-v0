'use client'

import { useState, useEffect } from 'react'
import { 
  ShieldCheckIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  DocumentMagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { api } from '@/lib/api'
import { ComplianceStatus } from '@/lib/types'

type TabType = 'audit' | 'violations' | 'investigation' | 'compliance'

interface ControllerInfo {
  id: string
  name: string
  complianceScore: number
  totalConsents: number
  lastAudit: string
}

interface Violation {
  id: string
  controllerId: string
  controllerName: string
  articleViolated: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  detectedAt: string
  status: 'open' | 'investigating' | 'resolved'
}

export default function RegulatorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('audit')
  const [controllers, setControllers] = useState<ControllerInfo[]>([])
  const [violations, setViolations] = useState<Violation[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [controllerHash, setControllerHash] = useState<string>('')
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null)
  const [report, setReport] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [isRegulator, setIsRegulator] = useState(false)

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      
      if (!token || !userStr) {
        setSignedIn(false)
        setIsRegulator(false)
        return
      }

      try {
        const user = JSON.parse(userStr)
        setSignedIn(true)
        setIsRegulator(user.role === 'regulator')

        if (user.role === 'regulator') {
          await loadAuditData()
          await loadViolations()
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
        setSignedIn(false)
        setIsRegulator(false)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }

    init()
  }, [])

  const loadAuditData = async () => {
    try {
      const response = await api.get('/controllers/all')
      setControllers(response.data.controllers || [])
    } catch (error) {
      console.error('Failed to load controllers:', error)
      setControllers([])
    }
  }

  const loadViolations = async () => {
    const mockViolations: Violation[] = [
      {
        id: 'v1',
        controllerId: 'ctrl_io_org_001',
        controllerName: 'Demo Organization IO',
        articleViolated: 'Article 7',
        severity: 'high',
        description: 'Consent obtained without clear affirmative action',
        detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'investigating'
      },
      {
        id: 'v2',
        controllerId: 'ctrl_de9a42acbfd5e5fba38627114e458bf3',
        controllerName: 'Demo Corporation',
        articleViolated: 'Article 17',
        severity: 'critical',
        description: 'Data erasure request not processed within 30 days',
        detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open'
      },
      {
        id: 'v3',
        controllerId: 'ctrl_io_org_001',
        controllerName: 'Demo Organization IO',
        articleViolated: 'Article 13',
        severity: 'medium',
        description: 'Privacy notice not provided at data collection time',
        detectedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'resolved'
      }
    ]
    setViolations(mockViolations)
  }

  const loadCompliance = async () => {
    if (!controllerHash) return
    
    setLoading(true)
    try {
      const [statusRes, reportRes] = await Promise.all([
        api.get(`/compliance/status/${controllerHash}`),
        api.get(`/compliance/report/${controllerHash}`)
      ])
      setCompliance(statusRes.data)
      setReport(reportRes.data)
    } catch (error) {
      console.error('Failed to load compliance status:', error)
      alert('Failed to load compliance status')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const handleSignIn = () => {
    window.location.href = '/login'
  }

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'investigating': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const tabs = [
    { id: 'audit' as TabType, name: 'Audit Overview', icon: ChartBarIcon },
    { id: 'violations' as TabType, name: 'Violation Tracking', icon: ExclamationTriangleIcon },
    { id: 'investigation' as TabType, name: 'Investigation Tools', icon: DocumentMagnifyingGlassIcon },
    { id: 'compliance' as TabType, name: 'Compliance Check', icon: ShieldCheckIcon }
  ]

  const filteredControllers = controllers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const criticalCount = violations.filter(v => v.severity === 'critical').length
  const openCount = violations.filter(v => v.status === 'open').length
  const avgCompliance = controllers.length > 0 
    ? Math.round(controllers.reduce((acc, c) => acc + c.complianceScore, 0) / controllers.length)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Regulator Oversight Dashboard</h1>
                <p className="text-sm text-gray-600">Monitor GDPR compliance and enforce data protection regulations</p>
              </div>
            </div>
            {signedIn && (
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!signedIn && (
          <div className="bg-white rounded-lg shadow p-8 text-center mb-6">
            <p className="text-gray-700 mb-4">Sign in as a regulator to view oversight dashboard.</p>
            <button onClick={handleSignIn} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Sign in</button>
          </div>
        )}

        {signedIn && !isRegulator && (
          <div className="bg-white rounded-lg shadow p-8 text-center mb-6">
            <p className="text-gray-700">You must be a regulator to access this dashboard.</p>
          </div>
        )}

        {isRegulator && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-10 w-10 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Monitored Controllers</p>
                    <p className="text-2xl font-bold text-gray-900">{controllers.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <ChartBarIcon className="h-10 w-10 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Compliance</p>
                    <p className="text-2xl font-bold text-gray-900">{avgCompliance}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Open Violations</p>
                    <p className="text-2xl font-bold text-gray-900">{openCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-10 w-10 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                    <p className="text-2xl font-bold text-gray-900">{criticalCount}</p>
                  </div>
                </div>
              </div>
            </div>

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
                {activeTab === 'audit' && (
                  <AuditOverviewTab controllers={filteredControllers} searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                )}

                {activeTab === 'violations' && (
                  <ViolationTrackingTab violations={violations} />
                )}

                {activeTab === 'investigation' && (
                  <InvestigationTab controllers={controllers} />
                )}

                {activeTab === 'compliance' && (
                  <ComplianceCheckTab
                    controllerHash={controllerHash}
                    onHashChange={setControllerHash}
                    onCheck={loadCompliance}
                    loading={loading}
                    compliance={compliance}
                    report={report}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function AuditOverviewTab({ 
  controllers, 
  searchTerm, 
  onSearchChange 
}: { 
  controllers: ControllerInfo[], 
  searchTerm: string,
  onSearchChange: (value: string) => void
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Compliance Audit Overview</h2>
        <p className="text-sm text-gray-600 mt-1">Real-time monitoring of all registered data controllers</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search controllers by name or ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Controllers Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
            {controllers.map((controller) => (
              <tr key={controller.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{controller.name}</div>
                    <div className="text-sm text-gray-500">{controller.id}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 w-20 mr-2">
                      <div
                        className={`h-2 rounded-full ${
                          controller.complianceScore >= 90 ? 'bg-green-500' :
                          controller.complianceScore >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${controller.complianceScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{controller.complianceScore}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {controller.totalConsents.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(controller.lastAudit).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    controller.complianceScore >= 80 ? 'bg-green-100 text-green-800' : 
                    controller.complianceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {controller.complianceScore >= 80 ? 'Compliant' : 
                     controller.complianceScore >= 60 ? 'Under Review' : 'Non-Compliant'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ViolationTrackingTab({ violations }: { violations: Violation[] }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">GDPR Violation Tracking</h2>
        <p className="text-sm text-gray-600 mt-1">Monitor and investigate potential compliance violations</p>
      </div>

      {/* Violation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium mb-1">Critical Violations</p>
          <p className="text-3xl font-bold text-red-700">
            {violations.filter(v => v.severity === 'critical').length}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600 font-medium mb-1">Under Investigation</p>
          <p className="text-3xl font-bold text-yellow-700">
            {violations.filter(v => v.status === 'investigating').length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium mb-1">Resolved This Month</p>
          <p className="text-3xl font-bold text-green-700">
            {violations.filter(v => v.status === 'resolved').length}
          </p>
        </div>
      </div>

      {/* Violations List */}
      <div className="space-y-4">
        {violations.map((violation) => (
          <div key={violation.id} className={`bg-white border-2 rounded-lg p-6 ${getSeverityColor(violation.severity)}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getSeverityColor(violation.severity)}`}>
                    {violation.severity}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(violation.status)}`}>
                    {violation.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  GDPR {violation.articleViolated} Violation
                </h3>
                <p className="text-sm text-gray-600 mb-2">{violation.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span><strong>Controller:</strong> {violation.controllerName}</span>
                  <span><strong>Detected:</strong> {new Date(violation.detectedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                Investigate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InvestigationTab({ controllers }: { controllers: ControllerInfo[] }) {
  const [forensicSearch, setForensicSearch] = useState('')
  const [timelineDate, setTimelineDate] = useState('')

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Investigation Tools</h2>
        <p className="text-sm text-gray-600 mt-1">Forensic search and timeline reconstruction for compliance investigations</p>
      </div>

      {/* Forensic Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <MagnifyingGlassIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Forensic Search</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Search across all consent records, audit logs, and controller activities
        </p>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search by consent ID, user ID, controller hash, or transaction hash..."
            value={forensicSearch}
            onChange={(e) => setForensicSearch(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Search
          </button>
        </div>
      </div>

      {/* Timeline Reconstruction */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <ClockIcon className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Timeline Reconstruction</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Reconstruct consent lifecycle events for specific controllers or users
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Controller
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Select a controller...</option>
              {controllers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <input
              type="date"
              value={timelineDate}
              onChange={(e) => setTimelineDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <button className="mt-4 w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition">
          Reconstruct Timeline
        </button>
      </div>

      {/* Export Tools */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Investigation Export</h3>
        <p className="text-sm text-gray-600 mb-4">
          Export investigation data for legal proceedings or regulatory reports
        </p>
        <div className="flex space-x-4">
          <button className="flex-1 bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition">
            Export as PDF Report
          </button>
          <button className="flex-1 bg-white border border-blue-600 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition">
            Export Raw Data (JSON)
          </button>
        </div>
      </div>
    </div>
  )
}

function ComplianceCheckTab({
  controllerHash,
  onHashChange,
  onCheck,
  loading,
  compliance,
  report
}: {
  controllerHash: string
  onHashChange: (value: string) => void
  onCheck: () => void
  loading: boolean
  compliance: ComplianceStatus | null
  report: any | null
}) {
  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Controller Compliance Check</h2>
        <p className="text-sm text-gray-600 mt-1">Verify GDPR compliance status for specific controllers</p>
      </div>

      {/* Compliance Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex space-x-4">
          <input
            type="text"
            value={controllerHash}
            onChange={(e) => onHashChange(e.target.value)}
            placeholder="Enter Controller Hash"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={onCheck}
            disabled={loading || !controllerHash}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Check Compliance'}
          </button>
        </div>
      </div>

      {/* Compliance Results */}
      {compliance && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Overall Compliance</h3>
              <span className={`text-3xl font-bold ${getComplianceColor(compliance.overallCompliance)}`}>
                {compliance.overallCompliance}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${
                  compliance.overallCompliance >= 90 ? 'bg-green-500' :
                  compliance.overallCompliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${compliance.overallCompliance}%` }}
              />
            </div>
          </div>

          {/* GDPR Articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { article: 'Article 7', title: 'Conditions for Consent', compliant: compliance.gdprArticle7 },
              { article: 'Article 12', title: 'Transparent Information', compliant: compliance.gdprArticle12 },
              { article: 'Article 13', title: 'Information Provided', compliant: compliance.gdprArticle13 },
              { article: 'Article 17', title: 'Right to Erasure', compliant: compliance.gdprArticle17 },
              { article: 'Article 20', title: 'Data Portability', compliant: compliance.gdprArticle20 },
              { article: 'Article 25', title: 'Privacy by Design', compliant: compliance.gdprArticle25 },
              { article: 'Article 30', title: 'Processing Records', compliant: compliance.gdprArticle30 }
            ].map((item) => (
              <div key={item.article} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-600">{item.article}</span>
                  {item.compliant ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <p className="text-sm text-gray-900">{item.title}</p>
                <span className={`inline-flex mt-2 px-2 py-1 rounded text-xs font-semibold ${
                  item.compliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {item.compliant ? 'Compliant' : 'Non-Compliant'}
                </span>
              </div>
            ))}
          </div>

          {/* Report Details */}
          {report && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Compliance Report</h3>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `compliance-report-${compliance.controllerHash.substring(0, 8)}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Download Report
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Controller Information</h4>
                  <p><strong>Organization:</strong> {report.controller.organizationName}</p>
                  <p><strong>ID:</strong> {report.controller.organizationId}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Consent Summary</h4>
                  <p><strong>Total:</strong> {report.summary.totalConsents}</p>
                  <p><strong>Active:</strong> {report.summary.activeConsents}</p>
                  <p><strong>Revoked:</strong> {report.summary.revokedConsents}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'border-red-300'
    case 'high': return 'border-orange-300'
    case 'medium': return 'border-yellow-300'
    case 'low': return 'border-blue-300'
    default: return 'border-gray-300'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'open': return 'bg-red-100 text-red-800'
    case 'investigating': return 'bg-yellow-100 text-yellow-800'
    case 'resolved': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
