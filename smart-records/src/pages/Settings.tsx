import React, { useState } from 'react'
import { FiSave, FiUpload, FiMoon, FiSun, FiRefreshCw, FiDatabase, FiTrash2 } from 'react-icons/fi'
import { useSettings } from '../lib/SettingsContext'
import { useToast } from '../components/Toast'

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings()
  const { showToast } = useToast()
  const [form, setForm] = useState({ ...settings })
  const [logoPreview, setLogoPreview] = useState(settings.orgLogo)

  const set = (f: string, v: string | boolean) => setForm(prev => ({ ...prev, [f]: v }))

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { showToast('error', 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت'); return }
    const reader = new FileReader()
    reader.onload = ev => {
      const url = ev.target?.result as string
      setLogoPreview(url)
      set('orgLogo', url)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    updateSettings(form)
    showToast('success', 'تم حفظ الإعدادات بنجاح ✅')
  }

  const handleReset = () => {
    const defaults = {
      orgName: 'Smart Records System',
      orgLogo: '',
      primaryColor: '#2563eb',
      secondaryColor: '#7c3aed',
      footerText: 'جميع الحقوق محفوظة © 2025 Smart Records System',
      darkMode: true,
    }
    setForm(defaults)
    setLogoPreview('')
    updateSettings(defaults)
    showToast('info', 'تمت إعادة الضبط للإعدادات الافتراضية')
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">الإعدادات</h1>
        <p className="text-slate-400 text-sm mt-1">تخصيص مظهر وبيانات النظام</p>
      </div>

      {/* Organization */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FiDatabase size={16} className="text-blue-400" /> معلومات المؤسسة
        </h2>

        {/* Logo */}
        <div>
          <label className="form-label">شعار المؤسسة</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
              {logoPreview ? (
                <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-600 text-2xl font-black">S</span>
              )}
            </div>
            <div className="flex-1">
              <label className="cursor-pointer flex items-center gap-2 btn-secondary text-sm w-fit">
                <FiUpload size={14} />
                رفع شعار
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              {logoPreview && (
                <button onClick={() => { setLogoPreview(''); set('orgLogo', '') }} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 mt-2 transition-colors">
                  <FiTrash2 size={12} /> حذف الشعار
                </button>
              )}
              <p className="text-xs text-slate-600 mt-1">PNG, JPG حتى 2 ميجابايت</p>
            </div>
          </div>
        </div>

        {/* Org Name */}
        <div>
          <label className="form-label">اسم المؤسسة</label>
          <input className="form-input" value={form.orgName} onChange={e => set('orgName', e.target.value)} placeholder="اسم المؤسسة" />
        </div>

        {/* Footer Text */}
        <div>
          <label className="form-label">نص التذييل</label>
          <input className="form-input" value={form.footerText} onChange={e => set('footerText', e.target.value)} placeholder="نص التذييل" />
        </div>
      </div>

      {/* Colors */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-bold text-white">🎨 الألوان</h2>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="form-label">اللون الرئيسي</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                className="w-12 h-12 rounded-xl border-0 cursor-pointer bg-transparent" />
              <input className="form-input flex-1 font-mono text-sm" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="form-label">اللون الثانوي</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.secondaryColor} onChange={e => set('secondaryColor', e.target.value)}
                className="w-12 h-12 rounded-xl border-0 cursor-pointer bg-transparent" />
              <input className="form-input flex-1 font-mono text-sm" value={form.secondaryColor} onChange={e => set('secondaryColor', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Preview gradient */}
        <div className="rounded-xl p-4 text-center font-bold text-white text-sm" style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}>
          معاينة التدرج اللوني
        </div>

        {/* Presets */}
        <div>
          <label className="form-label">ألوان جاهزة</label>
          <div className="flex flex-wrap gap-2">
            {[
              { primary: '#2563eb', secondary: '#7c3aed', label: 'أزرق-بنفسجي' },
              { primary: '#059669', secondary: '#0891b2', label: 'أخضر-سماوي' },
              { primary: '#dc2626', secondary: '#ea580c', label: 'أحمر-برتقالي' },
              { primary: '#7c3aed', secondary: '#db2777', label: 'بنفسجي-وردي' },
              { primary: '#0891b2', secondary: '#2563eb', label: 'سماوي-أزرق' },
            ].map(preset => (
              <button key={preset.label}
                onClick={() => { set('primaryColor', preset.primary); set('secondaryColor', preset.secondary) }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300 hover:text-white transition-colors"
              >
                <span className="w-4 h-4 rounded-full" style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }} />
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white">🌙 المظهر</h2>
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <div className="flex items-center gap-3">
            {form.darkMode ? <FiMoon size={18} className="text-blue-400" /> : <FiSun size={18} className="text-amber-400" />}
            <div>
              <p className="text-sm font-semibold text-slate-200">الوضع الليلي</p>
              <p className="text-xs text-slate-500">{form.darkMode ? 'الخلفية الداكنة مفعلة' : 'الخلفية الفاتحة مفعلة'}</p>
            </div>
          </div>
          <button
            onClick={() => set('darkMode', !form.darkMode)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${form.darkMode ? 'bg-blue-600' : 'bg-slate-600'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${form.darkMode ? 'translate-x-0.5' : '-translate-x-6'}`} />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <FiSave size={16} />
          حفظ الإعدادات
        </button>
        <button onClick={handleReset} className="btn-secondary flex items-center gap-2">
          <FiRefreshCw size={16} />
          إعادة ضبط
        </button>
      </div>
    </div>
  )
}

export default SettingsPage
