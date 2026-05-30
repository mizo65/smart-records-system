import React, { createContext, useContext, useState, useEffect } from 'react'

export type Settings = {
  orgName: string
  orgLogo: string
  primaryColor: string
  secondaryColor: string
  footerText: string
  darkMode: boolean
}

const defaultSettings: Settings = {
  orgName: 'Smart Records System',
  orgLogo: '',
  primaryColor: '#2563eb',
  secondaryColor: '#7c3aed',
  footerText: 'جميع الحقوق محفوظة © 2025 Smart Records System',
  darkMode: true,
}

type SettingsContextType = {
  settings: Settings
  updateSettings: (s: Partial<Settings>) => void
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
})

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('srs_settings')
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
    } catch {
      return defaultSettings
    }
  })

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    document.documentElement.style.setProperty('--color-primary', settings.primaryColor)
    document.documentElement.style.setProperty('--color-secondary', settings.secondaryColor)
  }, [settings])

  const updateSettings = (partial: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial }
      localStorage.setItem('srs_settings', JSON.stringify(next))
      return next
    })
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
