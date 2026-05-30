export const generateReferenceNumber = (): string => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 9000 + 1000)
  return `SRS-${year}${month}${day}-${random}`
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

export const formatDateTime = (dtStr: string): string => {
  if (!dtStr) return ''
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dtStr))
  } catch {
    return dtStr
  }
}

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    'مكتمل': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'معلق': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'ملغي': 'bg-red-500/20 text-red-400 border-red-500/30',
    'قيد المعالجة': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }
  return map[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0]
}

export const getCurrentTime = (): string => {
  return new Date().toTimeString().slice(0, 5)
}
