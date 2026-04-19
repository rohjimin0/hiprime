'use client'
import { useEffect, useState, useRef } from 'react'

interface PricingRule {
  rule_id: number
  product_id: number
  brand: string
  model_name: string
  storage: string
  grade: string
  base_price: number
  valid_from: string | null
  valid_to: string | null
  updated_at: string
}

export default function AdminPricingPage() {
  const [rules, setRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<number | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadRules() {
    const data = await fetch('/api/admin/pricing').then(r => r.json())
    setRules(data)
    setLoading(false)
  }
  useEffect(() => { loadRules() }, [])

  async function savePrice(rule_id: number) {
    setSaving(true)
    await fetch('/api/admin/pricing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule_id, base_price: Number(editPrice), updated_by: 'admin' }),
    })
    setEditing(null)
    setSaving(false)
    loadRules()
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadStatus('')

    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/admin/csv', { method: 'POST', body: formData })
    const data = await res.json()

    if (data.error) {
      setUploadStatus(`❌ 오류: ${data.error}`)
    } else {
      setUploadStatus(`✅ 완료: ${data.updated}건 반영 / ${data.skipped}건 건너뜀${data.errors?.length ? '\n⚠️ ' + data.errors.join(', ') : ''}`)
      loadRules()
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function downloadCsv() {
    const res = await fetch('/api/admin/csv')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hiprime_pricing_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Group by model
  const models = [...new Map(rules.map(r => [`${r.brand}|${r.model_name}|${r.storage}`, r])).values()]
  const GRADES = ['S', 'A', 'B', 'C']

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-extrabold text-slate-800">가격표 관리</h1>
        <div className="flex gap-3 flex-wrap">
          <button onClick={downloadCsv} className="btn-outline py-2 text-sm">
            ⬇ CSV 다운로드
          </button>
          <label className={`btn-primary py-2 text-sm cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
            {uploading ? '업로드 중...' : '⬆ CSV 업로드'}
            <input ref={fileRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {/* CSV format guide */}
      <div className="card mb-6 bg-slate-800 text-slate-200 text-xs font-mono">
        <p className="text-slate-400 mb-2"># CSV 양식 (첫 행: 헤더)</p>
        <p>brand,model_name,storage,grade,base_price,valid_from,valid_to</p>
        <p className="text-slate-400 mt-1">Apple,iPhone 15 Pro Max,256GB,S,1350000,,</p>
        <p className="text-slate-400">Samsung,Galaxy S24 Ultra,256GB,A,1050000,2026-01-01,2026-12-31</p>
      </div>

      {uploadStatus && (
        <div className={`rounded-xl px-4 py-3 text-sm mb-6 whitespace-pre-wrap ${
          uploadStatus.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
        }`}>
          {uploadStatus}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">불러오는 중...</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-3 text-slate-500 font-medium">모델</th>
                <th className="text-left py-3 px-2 text-slate-500 font-medium">용량</th>
                {GRADES.map(g => (
                  <th key={g} className="text-right py-3 px-3 text-slate-500 font-medium">{g}등급</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {models.map(m => {
                const modelRules = rules.filter(r => r.brand === m.brand && r.model_name === m.model_name && r.storage === m.storage)
                return (
                  <tr key={`${m.brand}|${m.model_name}|${m.storage}`} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-3 font-medium text-slate-800">{m.brand} {m.model_name}</td>
                    <td className="py-3 px-2 text-slate-500">{m.storage}</td>
                    {GRADES.map(g => {
                      const rule = modelRules.find(r => r.grade === g)
                      if (!rule) return <td key={g} className="py-3 px-3 text-right text-slate-300">—</td>
                      return (
                        <td key={g} className="py-3 px-3 text-right">
                          {editing === rule.rule_id ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                value={editPrice}
                                onChange={e => setEditPrice(e.target.value)}
                                className="w-28 border border-brand-400 rounded-lg px-2 py-1 text-right text-slate-800 focus:outline-none"
                                autoFocus
                              />
                              <button onClick={() => savePrice(rule.rule_id)} disabled={saving}
                                className="text-xs bg-brand-500 text-white px-2 py-1 rounded-lg">저장</button>
                              <button onClick={() => setEditing(null)}
                                className="text-xs text-slate-400 px-1">취소</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditing(rule.rule_id); setEditPrice(String(rule.base_price)) }}
                              className="font-semibold text-slate-700 hover:text-brand-500 transition-colors"
                            >
                              {rule.base_price.toLocaleString()}원
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
