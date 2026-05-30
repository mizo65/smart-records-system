import React, { useEffect, useRef, useState } from 'react'
import { FiDownload, FiPrinter, FiShare2, FiX, FiLoader } from 'react-icons/fi'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Record } from '../lib/supabase'
import { formatCurrency, formatDate, getStatusColor } from '../lib/utils'
import { useSettings } from '../lib/SettingsContext'
import { useToast } from './Toast'

type Props = {
  record: Record
  onClose: () => void
}

const FILE_PREFIX = 'mizo-mo'

const Receipt: React.FC<Props> = ({ record, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [qrUrl, setQrUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const { settings } = useSettings()
  const { showToast } = useToast()

  useEffect(() => {
    const text = `SRS | ${record.reference_number} | ${record.name} | ${record.amount} | ${record.date}`
    QRCode.toDataURL(text, { width: 120, margin: 1, color: { dark: '#1e3a8a', light: '#ffffff' } })
      .then(setQrUrl)
  }, [record])

  // التقاط صورة الإيصال بجودة عالية
  const captureCanvas = async (): Promise<HTMLCanvasElement> => {
    if (!receiptRef.current) throw new Error('No receipt ref')
    return await html2canvas(receiptRef.current, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0f172a',
      logging: false,
      imageTimeout: 0,
    })
  }

  // تنزيل الصورة مباشرة بدون أي قيود
  const triggerDownload = (dataUrl: string, filename: string) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => document.body.removeChild(a), 300)
  }

  // ---- تنزيل PNG ----
  const downloadPNG = async () => {
    if (busy) return
    setBusy(true)
    try {
      const canvas = await captureCanvas()
      triggerDownload(canvas.toDataURL('image/png'), `${FILE_PREFIX}-receipt-${record.reference_number}.png`)
      showToast('success', '✅ تم تنزيل الإيصال PNG')
    } catch { showToast('error', 'فشل تنزيل PNG') }
    setBusy(false)
  }

  // ---- تنزيل JPG ----
  const downloadJPG = async () => {
    if (busy) return
    setBusy(true)
    try {
      const canvas = await captureCanvas()
      triggerDownload(canvas.toDataURL('image/jpeg', 0.95), `${FILE_PREFIX}-receipt-${record.reference_number}.jpg`)
      showToast('success', '✅ تم تنزيل الإيصال JPG')
    } catch { showToast('error', 'فشل تنزيل JPG') }
    setBusy(false)
  }

  // ---- تنزيل PDF ----
  const downloadPDF = async () => {
    if (busy) return
    setBusy(true)
    try {
      const canvas = await captureCanvas()
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
      const w = pdf.internal.pageSize.getWidth()
      const h = (canvas.height / canvas.width) * w
      pdf.addImage(imgData, 'PNG', 0, 0, w, h)
      pdf.save(`${FILE_PREFIX}-receipt-${record.reference_number}.pdf`)
      showToast('success', '✅ تم تنزيل الإيصال PDF')
    } catch { showToast('error', 'فشل تنزيل PDF') }
    setBusy(false)
  }

  // ---- طباعة ----
  const print = async () => {
    if (busy) return
    setBusy(true)
    try {
      const canvas = await captureCanvas()
      const win = window.open('', '_blank')
      if (!win) { showToast('error', 'يرجى السماح بالنوافذ المنبثقة'); setBusy(false); return }
      win.document.write(`<html><head><title>إيصال</title><style>*{margin:0;padding:0}body{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000}img{max-width:100%;height:auto}</style></head><body><img src="${canvas.toDataURL('image/png')}" /></body></html>`)
      win.document.close()
      setTimeout(() => { win.focus(); win.print() }, 500)
    } catch { showToast('error', 'فشلت الطباعة') }
    setBusy(false)
  }

  // ---- المشاركة: ينزّل الصورة دائماً ثم يفتح التطبيق ----
  const shareToApp = async (appUrl: string, appName: string) => {
    if (busy) return
    setBusy(true)
    showToast('info', `⏳ جاري تجهيز صورة الإيصال...`)
    try {
      const canvas = await captureCanvas()
      const filename = `${FILE_PREFIX}-receipt-${record.reference_number}.png`

      // 1️⃣ إنشاء الـ Blob من الصورة
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(), 'image/png', 1.0)
      )

      // 2️⃣ محاولة استخدام Web Share API (موبايل)
      if (navigator.share) {
        try {
          const file = new File([blob], filename, { type: 'image/png' })
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: `إيصال - ${record.reference_number}` })
            showToast('success', '✅ تم مشاركة صورة الإيصال')
            setBusy(false)
            return
          }
        } catch (e) {
          console.log('Share API error:', e)
        }
      }

      // 3️⃣ كمبيوتر: نزّل الصورة وافتح التطبيق
      triggerDownload(canvas.toDataURL('image/png'), filename)
      showToast('success', `✅ تم حفظ الصورة — جاري فتح ${appName}...`)
      
      // افتح التطبيق بعد تحميل الصورة
      setTimeout(() => window.open(appUrl, '_blank'), 1200)
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === 'AbortError')) {
        showToast('error', 'حدث خطأ أثناء التجهيز')
      }
    }
    setBusy(false)
  }

  // ---- مشاركة عامة ----
  const shareGeneral = async () => {
    if (busy) return
    setBusy(true)
    showToast('info', '⏳ جاري تجهيز صورة الإيصال...')
    try {
      const canvas = await captureCanvas()
      const filename = `${FILE_PREFIX}-receipt-${record.reference_number}.png`
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(), 'image/png', 1.0)
      )
      const file = new File([blob], filename, { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `إيصال - ${record.reference_number}` })
      } else {
        triggerDownload(canvas.toDataURL('image/png'), filename)
        showToast('success', '✅ تم تنزيل صورة الإيصال')
      }
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === 'AbortError')) {
        showToast('error', 'حدث خطأ')
      }
    }
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-overlay">
      <div className="glass rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">الإيصال</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <FiX size={20} />
          </button>
        </div>

        {/* Receipt Card */}
        <div className="p-5">
          <div ref={receiptRef} className="receipt-card p-6 mx-auto" style={{ maxWidth: '480px' }}>

            {/* Card Header */}
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-blue-800/40">
              <div>
                {settings.orgLogo ? (
                  <img src={settings.orgLogo} alt="logo" className="w-14 h-14 rounded-xl object-cover mb-2" />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-2"
                    style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}>
                    <span className="text-white text-2xl font-black">S</span>
                  </div>
                )}
                <h1 className="text-lg font-black text-white leading-tight">{settings.orgName}</h1>
                <p className="text-xs text-blue-400">نظام السجلات الذكي</p>
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-500 mb-1">رقم الإيصال</div>
                <div className="text-sm font-mono font-bold text-blue-400">{record.reference_number}</div>
                <div className="text-xs text-slate-500 mt-2">الحالة</div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getStatusColor(record.status)}`}>
                  {record.status}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'الاسم', value: record.name },
                { label: 'رقم الهاتف', value: record.phone || '—' },
                { label: 'التاريخ', value: formatDate(record.date) },
                { label: 'الوقت', value: record.time || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-800/50 rounded-xl p-3">
                  <div className="text-xs text-slate-500 mb-1">{label}</div>
                  <div className="text-sm font-semibold text-slate-100">{value}</div>
                </div>
              ))}
            </div>

            {/* Amount */}
            <div className="rounded-xl p-4 mb-5 text-center"
              style={{ background: `linear-gradient(135deg, ${settings.primaryColor}20, ${settings.secondaryColor}20)`, border: `1px solid ${settings.primaryColor}30` }}>
              <div className="text-xs text-slate-400 mb-1">المبلغ الإجمالي</div>
              <div className="text-3xl font-black" style={{ color: settings.primaryColor }}>
                {formatCurrency(record.amount)}
              </div>
            </div>

            {/* Notes */}
            {record.notes && (
              <div className="bg-slate-800/30 rounded-xl p-3 mb-5">
                <div className="text-xs text-slate-500 mb-1">ملاحظات</div>
                <p className="text-sm text-slate-300">{record.notes}</p>
              </div>
            )}

            {/* QR + Date */}
            <div className="flex items-end justify-between pt-5 border-t border-blue-800/40">
              <div>
                <div className="text-xs text-slate-500 mb-1">تاريخ الإنشاء</div>
                <div className="text-xs text-slate-400">
                  {new Date(record.created_at).toLocaleDateString('ar-EG', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
              {qrUrl && (
                <div className="bg-white rounded-lg p-2">
                  <img src={qrUrl} alt="QR" className="w-20 h-20" />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center mt-4">
              <p className="text-xs text-slate-600">{settings.footerText}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-white/5">

          {/* Download */}
          <p className="text-xs text-slate-500 mb-3 font-semibold">تنزيل الإيصال</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'PNG', action: downloadPNG, color: 'from-blue-600 to-blue-700' },
              { label: 'JPG', action: downloadJPG, color: 'from-violet-600 to-violet-700' },
              { label: 'PDF', action: downloadPDF, color: 'from-red-600 to-red-700' },
            ].map(btn => (
              <button key={btn.label} onClick={btn.action} disabled={busy}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:scale-[1.02] disabled:opacity-60 bg-gradient-to-r ${btn.color}`}>
                <FiDownload size={15} />
                {btn.label}
              </button>
            ))}
          </div>

          {/* Print */}
          <button onClick={print} disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:text-white font-semibold text-sm transition-all">
            <FiPrinter size={15} />
            طباعة الإيصال
          </button>

          {/* Share */}
          <p className="text-xs text-slate-500 mb-3 font-semibold mt-4">
            مشاركة الإيصال كصورة
            {busy && <span className="mr-2 text-blue-400 animate-pulse">⏳ جاري التجهيز...</span>}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => shareToApp('https://wa.me/', 'واتساب')} disabled={busy}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{ background: '#25d366' }}>
              <span>📱</span> واتساب
            </button>
            <button onClick={() => shareToApp('https://t.me/', 'تيليجرام')} disabled={busy}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{ background: '#0088cc' }}>
              <span>✈️</span> تيليجرام
            </button>
            <button onClick={() => shareToApp('https://www.facebook.com/', 'فيسبوك')} disabled={busy}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{ background: '#1877f2' }}>
              <span>📘</span> فيسبوك
            </button>
            <button onClick={shareGeneral} disabled={busy}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:text-white font-semibold text-sm transition-all">
              <FiShare2 size={15} />
              مشاركة عامة
            </button>
          </div>

          {/* Info note */}
          <p className="text-xs text-slate-600 text-center mt-3 leading-relaxed">
            📌 على الموبايل: تُرسل الصورة مباشرة • على الكمبيوتر: تُنزَّل الصورة ثم يُفتح التطبيق
          </p>
        </div>
      </div>
    </div>
  )
}

export default Receipt
