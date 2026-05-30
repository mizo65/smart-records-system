import React, { useEffect, useState, useCallback } from 'react'
import {
  FiSearch, FiEdit2, FiTrash2, FiEye, FiDownload, FiRefreshCw,
  FiChevronUp, FiChevronDown, FiFilter, FiX, FiPlus
} from 'react-icons/fi'
import { supabase } from '../lib/supabase'
import type { Record as SRSRecord } from '../lib/supabase'
import { formatCurrency, getStatusColor, generateReferenceNumber, getTodayDate, getCurrentTime } from '../lib/utils'
import { useToast } from '../components/Toast'
import Receipt from '../components/Receipt'
import { useSettings } from '../lib/SettingsContext'

const STATUS_OPTIONS = ['الكل', 'مكتمل', 'معلق', 'قيد المعالجة', 'ملغي']

type SortField = 'name' | 'amount' | 'date' | 'created_at'
type SortDir = 'asc' | 'desc'

const EditModal: React.FC<{ record: SRSRecord; onSave: (r: SRSRecord) => void; onClose: () => void }> = ({ record, onSave, onClose }) => {
  const [form, setForm] = useState({ ...record })
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const set = (f: string, v: string | number) => setForm(p => ({ ...p, [f]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return showToast('error', 'الاسم مطلوب')
    setSaving(true)
    const { data, error } = await supabase.from('records').update({
      name: form.name, phone: form.phone, amount: Number(form.amount),
      date: form.date, time: form.time, notes: form.notes, status: form.status
    }).eq('id', form.id).select().single()
    setSaving(false)
    if (error) { showToast('error', 'فشل التحديث'); return }
    showToast('success', 'تم التحديث بنجاح')
    onSave(data)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-overlay">
      <div className="glass rounded-2xl w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">تعديل السجل</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><FiX size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">الاسم</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div><label className="form-label">الهاتف</label><input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className="form-label">المبلغ</label><input className="form-input" type="number" value={form.amount} onChange={e => set('amount', e.target.value)} /></div>
            <div><label className="form-label">الحالة</label>
              <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="form-label">التاريخ</label><input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
            <div><label className="form-label">الوقت</label><input className="form-input" type="time" value={form.time} onChange={e => set('time', e.target.value)} /></div>
          </div>
          <div><label className="form-label">ملاحظات</label><textarea className="form-input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <FiRefreshCw className="animate-spin" size={15} /> : <FiEdit2 size={15} />}
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
            <button onClick={onClose} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const Records: React.FC = () => {
  const [records, setRecords] = useState<SRSRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('الكل')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedReceipt, setSelectedReceipt] = useState<SRSRecord | null>(null)
  const [editRecord, setEditRecord] = useState<SRSRecord | null>(null)
  const [viewRecord, setViewRecord] = useState<SRSRecord | null>(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 10
  const { showToast } = useToast()
  const { settings } = useSettings()

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('records').select('*').order(sortField, { ascending: sortDir === 'asc' })
    if (data) setRecords(data)
    setLoading(false)
  }, [sortField, sortDir])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return
    const { error } = await supabase.from('records').delete().eq('id', id)
    if (error) { showToast('error', 'فشل الحذف'); return }
    setRecords(prev => prev.filter(r => r.id !== id))
    showToast('success', 'تم حذف السجل')
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const filtered = records.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.name?.toLowerCase().includes(q) || r.phone?.includes(q) || r.reference_number?.includes(q) || r.date?.includes(q)
    const matchStatus = statusFilter === 'الكل' || r.status === statusFilter
    const matchFrom = !dateFrom || r.date >= dateFrom
    const matchTo = !dateTo || r.date <= dateTo
    return matchSearch && matchStatus && matchFrom && matchTo
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <FiChevronUp className="text-slate-600" size={12} />
    return sortDir === 'asc' ? <FiChevronUp className="text-blue-400" size={12} /> : <FiChevronDown className="text-blue-400" size={12} />
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">السجلات</h1>
          <p className="text-slate-400 text-sm mt-1">{filtered.length} سجل</p>
        </div>
        <button onClick={fetchRecords} disabled={loading} className="flex items-center gap-2 btn-secondary text-sm">
          <FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          تحديث
        </button>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف أو المرجع..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="form-input pr-10 text-sm"
            />
          </div>
          <select
            className="form-input sm:w-40 text-sm"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex items-center gap-2 text-sm text-slate-400 flex-1">
            <FiFilter size={14} />
            <span>من:</span>
            <input type="date" className="form-input text-sm flex-1" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span>إلى:</span>
            <input type="date" className="form-input text-sm flex-1" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {(search || statusFilter !== 'الكل' || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(''); setStatusFilter('الكل'); setDateFrom(''); setDateTo(''); setPage(1) }}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors whitespace-nowrap">
              <FiX size={12} /> مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">جاري التحميل...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-12 text-center">
            <FiSearch size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">لا توجد سجلات مطابقة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-white/2">
                  {[
                    { label: 'الاسم', field: 'name' as SortField },
                    { label: 'الهاتف', field: null },
                    { label: 'المبلغ', field: 'amount' as SortField },
                    { label: 'التاريخ', field: 'date' as SortField },
                    { label: 'الحالة', field: null },
                    { label: 'المرجع', field: null },
                    { label: 'الإجراءات', field: null },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      className={`px-4 py-3 text-right text-xs font-semibold text-slate-500 whitespace-nowrap ${field ? 'cursor-pointer hover:text-slate-300 select-none' : ''}`}
                      onClick={() => field && toggleSort(field)}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        {field && <SortIcon field={field} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(r => (
                  <tr key={r.id} className="border-b border-white/5 table-row-hover">
                    <td className="px-4 py-3 text-sm text-slate-200 font-medium whitespace-nowrap">{r.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">{r.phone || '—'}</td>
                    <td className="px-4 py-3 text-sm font-bold whitespace-nowrap" style={{ color: settings.primaryColor }}>{formatCurrency(Number(r.amount))}</td>
                    <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getStatusColor(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">{r.reference_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewRecord(r)} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="عرض">
                          <FiEye size={15} />
                        </button>
                        <button onClick={() => setEditRecord(r)} className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="تعديل">
                          <FiEdit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="حذف">
                          <FiTrash2 size={15} />
                        </button>
                        <button onClick={() => setSelectedReceipt(r)} className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="إيصال">
                          <FiDownload size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-xs text-slate-500">الصفحة {page} من {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs btn-secondary disabled:opacity-40">
                السابق
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs btn-secondary disabled:opacity-40">
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedReceipt && <Receipt record={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}
      {editRecord && (
        <EditModal
          record={editRecord}
          onSave={updated => { setRecords(prev => prev.map(r => r.id === updated.id ? updated : r)); setEditRecord(null) }}
          onClose={() => setEditRecord(null)}
        />
      )}
      {viewRecord && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-overlay" onClick={() => setViewRecord(null)}>
          <div className="glass rounded-2xl w-full max-w-md animate-slide-up p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">تفاصيل السجل</h2>
              <button onClick={() => setViewRecord(null)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><FiX size={20} /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'الاسم', value: viewRecord.name },
                { label: 'الهاتف', value: viewRecord.phone || '—' },
                { label: 'المبلغ', value: formatCurrency(Number(viewRecord.amount)) },
                { label: 'التاريخ', value: viewRecord.date },
                {  label: 'الوقت',  value: viewRecord.time   ? new Date(`1970-01-01T${viewRecord.time}`).toLocaleTimeString('en-US', {    hour: 'numeric',    minute: '2-digit',    hour12: true    }) : '—'},
                { label: 'الحالة', value: viewRecord.status },
                { label: 'الرقم المرجعي', value: viewRecord.reference_number },
                { label: 'ملاحظات', value: viewRecord.notes || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-semibold text-slate-200 text-left max-w-[60%] break-words">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setViewRecord(null); setSelectedReceipt(viewRecord) }} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                <FiDownload size={14} /> عرض الإيصال
              </button>
              <button onClick={() => setViewRecord(null)} className="btn-secondary text-sm">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Records
