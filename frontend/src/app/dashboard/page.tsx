'use client'

import { useState, useEffect } from 'react'
import { 
  ShieldCheckIcon, 
  XCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { api } from '@/lib/api'
import {
  ConsentState,
  ConsentStatus,
  ConsentGrantRequest,
  LegalBasis
} from '@/lib/types'

type TabType = 'consents' | 'organizations' | 'settings' | 'export'

interface OrganizationData {
  id: string
  name: string
  controller_hash: string
  complianceScore: number
  totalConsents: number
  lastAudit: string
}

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('user')
  const [activeTab, setActiveTab] = useState<TabType>('consents')
  const [consents, setConsents] = useState<ConsentState[]>([])
  const [organizations, setOrganizations] = useState<OrganizationData[]>([])
  const [showGrantForm, setShowGrantForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      
      if (!token || !userStr) {
        setSignedIn(false)
        return
      }

      try {
        const user = JSON.parse(userStr)
        setSignedIn(true)
        setUserId(user.id)
        setUserRole(user.role || 'user')
        
        await loadConsents()
        await loadOrganizations()
      } catch (error) {
        console.error('Failed to load user data:', error)
        setSignedIn(false)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    init()
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const handleEmailSignIn = () => {
    window.location.href = '/login'
  }

  const loadConsents = async () => {
    try {
      const response = await api.get(`/consent/user/me`)
      const rows = response.data.consents || []
      const mapped: ConsentState[] = rows.map((r: any) => ({
        consentId: r.id,
        controllerHash: r.controller_hash,
        purposeHash: r.purpose_hash,
        status: r.status,
        grantedAt: new Date(r.granted_at).getTime(),
        expiresAt: r.expires_at ? new Date(r.expires_at).getTime() : undefined,
        hgtpTxHash: r.hgtp_tx_hash || '',
        userId: r.user_id,
      }))
      setConsents(mapped)
    } catch (error) {
      console.error('Failed to load consents:', error)
    }
  }

  const loadOrganizations = async () => {
    try {
      const response = await api.get('/controllers/all')
      setOrganizations(response.data.controllers || [])
    } catch (error) {
      console.error('Failed to load organizations:', error)
    }
  }

  const handleGrantConsent = async (data: ConsentGrantRequest) => {
    setLoading(true)
    try {
      await api.post('/consent/grant', data)
      await loadConsents()
      await loadOrganizations()
      setShowGrantForm(false)
      alert('Consent granted successfully!')
    } catch (error: any) {
      alert(`Failed to grant consent: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeConsent = async (consentId: string) => {
    if (!confirm('Are you sure you want to revoke this consent?')) return
    
    setLoading(true)
    try {
      await api.post(`/consent/revoke/${consentId}`, {
        userId,
        signature: `sig_${Date.now()}`
      })
      await loadConsents()
      await loadOrganizations()
      alert('Consent revoked successfully!')
    } catch (error: any) {
      alert(`Failed to revoke consent: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = (format: 'json' | 'csv') => {
    const data = {
      userId,
      exportedAt: new Date().toISOString(),
      consents: consents.map(c => ({
        consentId: c.consentId,
        controllerHash: c.controllerHash,
        status: c.status,
        grantedAt: new Date(c.grantedAt).toISOString(),
        expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
        hgtpTxHash: c.hgtpTxHash
      })),
      organizations: organizations.map(o => ({
        id: o.id,
        name: o.name,
        complianceScore: o.complianceScore
      }))
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `consentire-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const csv = [
        ['Consent ID', 'Controller Hash', 'Status', 'Granted At', 'Expires At', 'HGTP TX Hash'],
        ...consents.map(c => [
          c.consentId,
          c.controllerHash,
          c.status,
          new Date(c.grantedAt).toISOString(),
          c.expiresAt ? new Date(c.expiresAt).toISOString() : '',
          c.hgtpTxHash
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `consentire-consents-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const tabs = [
    { id: 'consents' as TabType, name: 'My Consents', icon: ShieldCheckIcon },
    { id: 'organizations' as TabType, name: 'Organizations with My Data', icon: BuildingOfficeIcon },
    { id: 'settings' as TabType, name: 'Privacy Settings', icon: Cog6ToothIcon },
    { id: 'export' as TabType, name: 'Data Export', icon: ArrowDownTrayIcon }
  ]

  const userOrganizations = organizations.filter(org => 
    consents.some(c => c.controllerHash === org.controller_hash)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Personal Privacy Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {signedIn && (
                <div className="text-sm text-gray-600">
                  {userId?.substring(0, 16)}...
                </div>
              )}
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!signedIn && (
          <div className="bg-white rounded-lg shadow p-8 text-center mb-6">
            <ShieldCheckIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to ConsenTide</h2>
            <p className="text-gray-700 mb-6">Sign in to manage your GDPR consents with zero-knowledge privacy.</p>
            <div className="space-y-3">
              <button onClick={handleEmailSignIn} className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                Sign in to Continue
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              New user? <a href="/register" className="text-blue-600 hover:text-blue-800">Create an account</a>
            </p>
          </div>
        )}

        {signedIn && (
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

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'consents' && (
                  <MyConsentsTab
                    consents={consents}
                    onRevoke={handleRevokeConsent}
                    onGrantNew={() => setShowGrantForm(true)}
                  />
                )}

                {activeTab === 'organizations' && (
                  <OrganizationsTab organizations={userOrganizations} />
                )}

                {activeTab === 'settings' && (
                  <PrivacySettingsTab />
                )}

                {activeTab === 'export' && (
                  <DataExportTab onExport={handleExportData} consents={consents} />
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-10 w-10 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Consents</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {consents.filter(c => c.status === ConsentStatus.GRANTED).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-10 w-10 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Organizations</p>
                    <p className="text-2xl font-bold text-gray-900">{userOrganizations.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <ChartBarIcon className="h-10 w-10 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Privacy Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {consents.length > 0 ? Math.round((consents.filter(c => c.status === ConsentStatus.GRANTED).length / consents.length) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Grant Consent Form Modal */}
        {signedIn && showGrantForm && (
          <GrantConsentForm
            userId={userId!}
            onSubmit={handleGrantConsent}
            onCancel={() => setShowGrantForm(false)}
            loading={loading}
          />
        )}
      </main>
    </div>
  )
}

function MyConsentsTab({ 
  consents, 
  onRevoke, 
  onGrantNew 
}: { 
  consents: ConsentState[], 
  onRevoke: (id: string) => void,
  onGrantNew: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Consent Permissions</h2>
          <p className="text-sm text-gray-600 mt-1">Control who has access to your personal data</p>
        </div>
        <button
          onClick={onGrantNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Grant New Consent</span>
        </button>
      </div>

      {consents.length === 0 ? (
        <div className="text-center py-12">
          <ShieldCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">You haven't granted any consents yet.</p>
          <button
            onClick={onGrantNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Grant Your First Consent
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {consents.map((consent) => (
            <ConsentCard
              key={consent.consentId}
              consent={consent}
              onRevoke={onRevoke}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function OrganizationsTab({ organizations }: { organizations: OrganizationData[] }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Organizations with Your Data</h2>
        <p className="text-sm text-gray-600 mt-1">View all organizations that have been granted access to your personal information</p>
      </div>

      {organizations.length === 0 ? (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No organizations have access to your data yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {organizations.map((org) => (
            <div key={org.id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{org.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Organization ID:</strong> {org.id}</p>
                    <p><strong>Active Consents:</strong> {org.totalConsents}</p>
                    <p><strong>Last Audit:</strong> {new Date(org.lastAudit).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                    org.complianceScore >= 90 ? 'bg-green-100 text-green-800' :
                    org.complianceScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {org.complianceScore}% Compliant
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PrivacySettingsTab() {
  const [autoRevoke, setAutoRevoke] = useState(() => {
    const saved = localStorage.getItem('privacy_auto_revoke')
    return saved ? JSON.parse(saved) : true
  })
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('privacy_notifications')
    return saved ? JSON.parse(saved) : true
  })
  const [dataRetention, setDataRetention] = useState(() => {
    const saved = localStorage.getItem('privacy_data_retention')
    return saved || '1year'
  })

  const saveSettings = () => {
    localStorage.setItem('privacy_auto_revoke', JSON.stringify(autoRevoke))
    localStorage.setItem('privacy_notifications', JSON.stringify(notifications))
    localStorage.setItem('privacy_data_retention', dataRetention)
    alert('Privacy settings saved successfully!')
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Privacy Settings</h2>
        <p className="text-sm text-gray-600 mt-1">Configure your privacy preferences and data management options</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-semibold text-gray-900">Auto-Revoke Expired Consents</h3>
            <p className="text-sm text-gray-600">Automatically revoke consents when they expire</p>
          </div>
          <button
            onClick={() => setAutoRevoke(!autoRevoke)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              autoRevoke ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                autoRevoke ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-semibold text-gray-900">Consent Change Notifications</h3>
            <p className="text-sm text-gray-600">Receive alerts when organizations access your data</p>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              notifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                notifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Default Data Retention Period</h3>
          <p className="text-sm text-gray-600 mb-4">Set how long organizations can keep your data by default</p>
          <select
            value={dataRetention}
            onChange={(e) => setDataRetention(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="3months">3 Months</option>
            <option value="6months">6 Months</option>
            <option value="1year">1 Year</option>
            <option value="2years">2 Years</option>
            <option value="indefinite">Indefinite (Until Revoked)</option>
          </select>
        </div>

        <div className="pt-4">
          <button 
            onClick={saveSettings}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Save Privacy Settings
          </button>
        </div>
      </div>
    </div>
  )
}

function DataExportTab({ 
  onExport, 
  consents 
}: { 
  onExport: (format: 'json' | 'csv') => void,
  consents: ConsentState[]
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Data Export Tools</h2>
        <p className="text-sm text-gray-600 mt-1">Download your consent records and exercise your GDPR data portability rights</p>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-2">GDPR Article 20: Right to Data Portability</h3>
              <p className="text-sm text-blue-700">
                You have the right to receive your personal data in a structured, commonly used, and machine-readable format.
                Export your consent records below to exercise this right.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => onExport('json')}
            className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
          >
            <DocumentTextIcon className="h-10 w-10 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Export as JSON</h3>
            <p className="text-sm text-gray-600">Machine-readable format for developer integration</p>
            <div className="mt-4 flex items-center text-sm text-blue-600 font-medium">
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Download JSON
            </div>
          </button>

          <button
            onClick={() => onExport('csv')}
            className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
          >
            <DocumentTextIcon className="h-10 w-10 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Export as CSV</h3>
            <p className="text-sm text-gray-600">Spreadsheet format for Excel and data analysis</p>
            <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Download CSV
            </div>
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Export Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Consents</p>
              <p className="text-2xl font-bold text-gray-900">{consents.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Active Consents</p>
              <p className="text-2xl font-bold text-green-600">
                {consents.filter(c => c.status === ConsentStatus.GRANTED).length}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Revoked Consents</p>
              <p className="text-2xl font-bold text-red-600">
                {consents.filter(c => c.status === ConsentStatus.REVOKED).length}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Expired Consents</p>
              <p className="text-2xl font-bold text-yellow-600">
                {consents.filter(c => c.status === ConsentStatus.EXPIRED).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConsentCard({
  consent,
  onRevoke
}: {
  consent: ConsentState,
  onRevoke: (id: string) => void
}) {
  const getStatusIcon = (status: ConsentStatus) => {
    switch (status) {
      case ConsentStatus.GRANTED:
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />
      case ConsentStatus.REVOKED:
        return <XCircleIcon className="h-6 w-6 text-red-500" />
      case ConsentStatus.EXPIRED:
        return <ClockIcon className="h-6 w-6 text-yellow-500" />
      default:
        return <ClockIcon className="h-6 w-6 text-gray-500" />
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-3">
            {getStatusIcon(consent.status)}
            <span className="font-semibold text-gray-900 capitalize">{consent.status}</span>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Consent ID:</strong> {consent.consentId.substring(0, 16)}...</p>
            <p><strong>Controller Hash:</strong> {consent.controllerHash.substring(0, 16)}...</p>
            <p><strong>Purpose Hash:</strong> {consent.purposeHash.substring(0, 16)}...</p>
            <p><strong>Granted:</strong> {formatDate(consent.grantedAt)}</p>
            {consent.expiresAt && (
              <p><strong>Expires:</strong> {formatDate(consent.expiresAt)}</p>
            )}
            <p><strong>HGTP TX Hash:</strong> {consent.hgtpTxHash.substring(0, 16)}...</p>
          </div>
        </div>
        {consent.status === ConsentStatus.GRANTED && (
          <button
            onClick={() => onRevoke(consent.consentId)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
          >
            Revoke
          </button>
        )}
      </div>
    </div>
  )
}

function GrantConsentForm({ 
  userId, 
  onSubmit, 
  onCancel, 
  loading 
}: { 
  userId: string, 
  onSubmit: (data: ConsentGrantRequest) => void,
  onCancel: () => void,
  loading: boolean
}) {
  const [formData, setFormData] = useState({
    controllerId: '',
    purpose: '',
    dataCategories: ['email', 'name'] as string[],
    lawfulBasis: LegalBasis.CONSENT,
    expiresAt: ''
  })
  const [dataCategoriesInput, setDataCategoriesInput] = useState('email, name')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      userId,
      controllerId: formData.controllerId,
      purpose: formData.purpose,
      dataCategories: formData.dataCategories,
      lawfulBasis: formData.lawfulBasis,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).getTime() : undefined,
      signature: `sig_${Date.now()}`
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Grant New Consent</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Controller ID
            </label>
            <input
              type="text"
              required
              value={formData.controllerId}
              onChange={(e) => setFormData({ ...formData, controllerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Organization identifier"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Categories
            </label>
            <input
              type="text"
              value={dataCategoriesInput}
              onChange={(e) => {
                const value = e.target.value
                setDataCategoriesInput(value)
                setFormData({
                  ...formData,
                  dataCategories: value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="email, name, address"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated list of personal data fields requested.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <textarea
              required
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Data processing purpose"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lawful Basis
            </label>
            <select
              value={formData.lawfulBasis}
              onChange={(e) => setFormData({ ...formData, lawfulBasis: e.target.value as LegalBasis })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.values(LegalBasis).map((basis) => (
                <option key={basis} value={basis}>{basis}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Granting...' : 'Grant Consent'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
