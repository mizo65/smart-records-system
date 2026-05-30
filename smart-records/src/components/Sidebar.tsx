import React, { useState } from 'react'
import { FiHome, FiPlusCircle, FiList, FiSettings, FiMenu, FiX, FiDatabase } from 'react-icons/fi'
import { useSettings } from '../lib/SettingsContext'

type Page = 'dashboard' | 'add' | 'records' | 'settings'

type Props = {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const navItems = [
  { id: 'dashboard' as Page, label: 'لوحة التحكم', icon: FiHome },
  { id: 'add' as Page, label: 'إضافة سجل', icon: FiPlusCircle },
  { id: 'records' as Page, label: 'السجلات', icon: FiList },
  { id: 'settings' as Page, label: 'الإعدادات', icon: FiSettings },
]

const Sidebar: React.FC<Props> = ({ currentPage, onNavigate }) => {
  const { settings } = useSettings()
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          {settings.orgLogo ? (
            <img src={settings.orgLogo} alt="logo" className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}>
              <FiDatabase className="text-white" size={20} />
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">{settings.orgName}</h1>
            <p className="text-xs text-slate-500">نظام السجلات الذكي</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setMobileOpen(false) }}
              className={`sidebar-item w-full text-right ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {isActive && (
                <span className="mr-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <p className="text-xs text-slate-600 text-center leading-relaxed">{settings.footerText}</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed top-0 right-0 glass border-l border-white/5 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <FiMenu size={22} />
        </button>
        <div className="flex items-center gap-2">
          {settings.orgLogo ? (
            <img src={settings.orgLogo} alt="logo" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}>
              <FiDatabase className="text-white" size={16} />
            </div>
          )}
          <span className="text-sm font-bold text-white">{settings.orgName}</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[100]">
          <div className="modal-overlay absolute inset-0" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 w-72 h-full glass border-l border-white/5 animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors">
                <FiX size={20} />
              </button>
              <span className="text-sm font-semibold text-white">القائمة</span>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
