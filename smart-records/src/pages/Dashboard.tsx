import React, { useEffect, useState } from 'react'
import { FiUsers, FiDollarSign, FiTrendingUp, FiClock, FiSearch, FiRefreshCw, FiCalendar } from 'react-icons/fi'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../lib/supabase'
import type { Record as SRSRecord } from '../lib/supabase'
import { formatCurrency, getStatusColor } from '../lib/utils'
import { useSettings } from '../lib/SettingsContext'
import Receipt from '../components/Receipt'

const Dashboard: React.FC = () => {
  const [records, setRecords] = useState<SRSRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<SRSRecord | null>(null)
  const { settings } = useSettings()

  const fetchRecords = async () => {
    setLoading(true)
    const { data } = await supabase.from('records').select('*').order('created_at', { ascending: false })
    if (data) setRecords(data)
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [])

  const totalAmount = records.reduce((sum, r) => sum + Number(r.amount), 0)
  const today = new Date().toISOString().split('T')[0]
  const todayRecords = records.filter(r => r.date === today)
  const todayAmount = todayRecords.reduce((sum, r) => sum + Number(r.amount), 0)

  // Monthly chart data
  const monthlyData = (() => {
    const map: Record<string, { name: string; amount: number; count: number }> = {}
    records.forEach(r => {
      const month = r.date?.slice(0, 7) || ''
      if (!month) return
      if (!map[month]) {
        const [y, m] = month.split('-')
        const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('ar-EG', { month: 'short' })
        map[month] = { name: label, amount: 0, count: 0 }
      }
      map[month].amount += Number(r.amount)
      map[month].count++
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, v]) => v)
  })()

  // Status pie data
  const statusData = (() => {
    const map: Record<string, number> = {}
    records.forEach(r => { map[r.status] = (map[r.status] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  })()

  const PIE_COLORS = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444']

  const filteredRecent = records.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.phone?.includes(search) ||
    r.reference_number?.includes(search)
  ).slice(0, 8)

  const stats = [
    { label: 'إجمالي السجلات', value: records.length.toString(), icon: FiUsers, color: 'from-blue-600 to-blue-700', glow: 'glow-blue', sub: `${todayRecords.length} اليوم` },
    { label: 'إجمالي المبالغ', value: formatCurrency(totalAmount), icon: FiDollarSign, color: 'from-violet-600 to-violet-700', glow: 'glow-purple', sub: `${formatCurrency(todayAmount)} اليوم` },
    { label: 'معدل اليومي', value: formatCurrency(records.length ? totalAmount / Math.max(1, new Set(records.map(r => r.date)).size) : 0), icon: FiTrendingUp, color: 'from-emerald-600 to-emerald-700', glow: 'glow-green', sub: `${new Set(records.map(r => r.date)).size} يوم نشط` },
    { label: 'آخر إضافة', value: records[0] ? new Date(records[0].created_at).toLocaleDateString('ar-EG') : '—', icon: FiClock, color: 'from-amber-600 to-amber-700', glow: 'glow-amber', sub: records[0]?.name || '—' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">لوحة التحكم</h1>
          <p className="text-slate-400 text-sm mt-1">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onClick={fetchRecords} disabled={loading} className="flex items-center gap-2 btn-secondary text-sm">
          <FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          تحديث
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className={`stat-card glass rounded-2xl p-5 card-hover ${stat.glow}`} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.color}`}>
                  <Icon className="text-white" size={18} />
                </div>
              </div>
              <div className="text-xl font-black text-white mb-1 leading-tight">{stat.value}</div>
              <div className="text-xs text-slate-400 font-semibold">{stat.label}</div>
              <div className="text-xs text-slate-600 mt-1">{stat.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <FiCalendar size={16} className="text-blue-400" />
            المبالغ الشهرية
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="amtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={settings.primaryColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={settings.primaryColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="amount" stroke={settings.primaryColor} strokeWidth={2} fill="url(#amtGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">توزيع الحالات</h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {statusData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-400">{s.name}</span>
                    </div>
                    <span className="text-slate-300 font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">لا توجد بيانات</div>
          )}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">عدد السجلات الشهرية</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#e2e8f0' }} />
            <Bar dataKey="count" fill={settings.secondaryColor} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Records */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white">آخر السجلات</h3>
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <input
              type="text"
              placeholder="بحث سريع..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-sm rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">جاري التحميل...</p>
          </div>
        ) : filteredRecent.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">لا توجد سجلات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['الاسم', 'الهاتف', 'المبلغ', 'التاريخ', 'الحالة', 'المرجع', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecent.map(r => (
                  <tr key={r.id} className="border-b border-white/5 table-row-hover">
                    <td className="px-4 py-3 text-sm text-slate-200 font-medium whitespace-nowrap">{r.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">{r.phone}</td>
                    <td className="px-4 py-3 text-sm font-bold whitespace-nowrap" style={{ color: settings.primaryColor }}>{formatCurrency(Number(r.amount))}</td>
                    <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${getStatusColor(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">{r.reference_number}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedRecord(r)} className="text-xs px-3 py-1.5 rounded-lg text-blue-400 hover:text-white hover:bg-blue-500/20 transition-colors font-semibold whitespace-nowrap">
                        إيصال
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRecord && <Receipt record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
    </div>
  )
}

export default Dashboard
