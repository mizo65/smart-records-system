import React, { useState } from 'react'
import { FiSave, FiRefreshCw, FiUser, FiPhone, FiDollarSign, FiCalendar, FiClock, FiFileText, FiTag, FiHash } from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import { generateReferenceNumber, getTodayDate, getCurrentTime } from '../lib/utils'
import { useToast } from '../components/Toast'
import Receipt from '../components/Receipt'
import { Record } from '../lib/supabase'

const STATUS_OPTIONS = ['مكتمل', 'معلق', 'قيد المعالجة', 'ملغي']

const AddRecord: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [newRecord, setNewRecord] = useState<Record | null>(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    amount: '',
    date: getTodayDate(),
    time: getCurrentTime(),
    notes: '',
    status: 'مكتمل',
    reference_number: generateReferenceNumber(),
  })

  const set = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }))
  const reset = () => setForm({ name: '', phone: '', amount: '', date: getTodayDate(), time: getCurrentTime(), notes: '', status: 'مكتمل', reference_number: generateReferenceNumber() })

  const handleSave = async () => {
    if (!form.name.trim()) return showToast('error', 'الاسم مطلوب')
    if (!form.amount || Number(form.amount) <= 0) return showToast('error', 'أدخل مبلغاً صحيحاً')
    if (!form.date) return showToast('error', 'التاريخ مطلوب')

    setSaving(true)
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      amount: Number(form.amount),
      date: form.date,
      time: form.time,
      notes: form.notes.trim(),
      status: form.status,
      reference_number: form.reference_number,
      image_url: '',
    }

    const { data, error } = await supabase.from('records').insert([payload]).select().single()
    setSaving(false)

    if (error) {
      console.error(error)
      showToast('error', `فشل الحفظ: ${error.message}`)
      return
    }

    showToast('success', '✅ تم حفظ السجل بنجاح!')
    setNewRecord(data)
    reset()
    onSuccess?.()
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">إضافة سجل جديد</h1>
        <p className="text-slate-400 text-sm mt-1">أدخل بيانات السجل الجديد</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        {/* Row 1: Name + Phone */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="form-label flex items-center gap-2">
              <FiUser size={14} className="text-blue-400" /> الاسم <span className="text-red-400">*</span>
            </label>
            <input className="form-input" placeholder="أدخل الاسم الكامل" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="form-label flex items-center gap-2">
              <FiPhone size={14} className="text-blue-400" /> رقم الهاتف
            </label>
            <input className="form-input" placeholder="05xxxxxxxx" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
        </div>

        {/* Row 2: Amount + Status */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="form-label flex items-center gap-2">
              <FiDollarSign size={14} className="text-emerald-400" /> المبلغ <span className="text-red-400">*</span>
            </label>
            <input className="form-input" type="number" placeholder="0.00" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} />
          </div>
          <div>
            <label className="form-label flex items-center gap-2">
              <FiTag size={14} className="text-amber-400" /> الحالة
            </label>
            <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Row 3: Date + Time */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="form-label flex items-center gap-2">
              <FiCalendar size={14} className="text-violet-400" /> التاريخ <span className="text-red-400">*</span>
            </label>
            <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label className="form-label flex items-center gap-2">
              <FiClock size={14} className="text-violet-400" /> الوقت
            </label>
            <input className="form-input" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
        </div>

        {/* Reference Number */}
        <div>
          <label className="form-label flex items-center gap-2">
            <FiHash size={14} className="text-slate-400" /> الرقم المرجعي (تلقائي)
          </label>
          <div className="flex gap-2">
            <input className="form-input flex-1 font-mono text-slate-400" readOnly value={form.reference_number} />
            <button onClick={() => set('reference_number', generateReferenceNumber())} className="px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:text-white transition-colors" title="توليد رقم جديد">
              <FiRefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="form-label flex items-center gap-2">
            <FiFileText size={14} className="text-slate-400" /> ملاحظات
          </label>
          <textarea className="form-input resize-none" rows={3} placeholder="أي ملاحظات إضافية..." value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <FiRefreshCw className="animate-spin" size={16} /> : <FiSave size={16} />}
            {saving ? 'جاري الحفظ...' : 'حفظ السجل'}
          </button>
          <button onClick={reset} className="btn-secondary" title="إعادة تعيين">
            <FiRefreshCw size={16} />
          </button>
        </div>
      </div>

      {newRecord && (
        <Receipt record={newRecord} onClose={() => setNewRecord(null)} />
      )}
    </div>
  )
}

export default AddRecord
