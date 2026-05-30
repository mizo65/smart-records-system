import React, { useState } from 'react'
import { SettingsProvider } from './lib/SettingsContext'
import { ToastProvider } from './components/Toast'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import AddRecord from './pages/AddRecord'
import Records from './pages/Records'
import SettingsPage from './pages/Settings'

type Page = 'dashboard' | 'add' | 'records' | 'settings'

const AppContent: React.FC = () => {
  const [page, setPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />
      case 'add': return <AddRecord onSuccess={() => setPage('dashboard')} />
      case 'records': return <Records />
      case 'settings': return <SettingsPage />
    }
  }

  return (
    <div className="min-h-screen mesh-bg">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="lg:pr-64 pt-0 lg:pt-0">
        <div className="pt-16 lg:pt-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
            {renderPage()}
          </div>
        </div>
      </main>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </SettingsProvider>
  )
}

export default App
