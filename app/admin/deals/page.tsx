'use client'
import { useEffect, useState, useCallback } from 'react'

const STATUS_LABELS: Record<string, string> = {
  pending:    '대기 중',
  processing: '처리 중',
  completed:  '완료',
  cancelled:  '취소',
}
const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed:  'bg-green-100 text-green-800',
  cancelled:  'bg-slate-100 text-slate-500',
}

interface Deal {
  request_id: number
  brand: string
  model_name: string
  storage: string
  grade: string
  final_price: number
  contact: string | null
  method: string | null
  status: string
  created_at: string
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    const url = filter ? `/api/admin/deals?status=${filter}` : '/api/admin/deals'
    fetch(url)
      .then(r => r.json())
      .then(data => { setDeals(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const updateStatus = async (request_id: number, status: string) => {
    await fetch('/api/admin/deals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id, status }),
    })
    load()
  }

  const fmt = (n: number) => n.toLocaleString('ko-KR') + '원'
  const date = (s: string) => new Date(s).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">거래 내역</h1>
        <div className="flex gap-2">
          {['', 'pending', 'processing', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === s
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s === '' ? '전체' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400 text-center py-12">불러오는 중...</p>
      ) : deals.length === 0 ? (
        <p className="text-slate-400 text-center py-12">거래 내역이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {deals.map(d => (
            <div key={d.request_id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[d.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {STATUS_LABELS[d.status] ?? d.status}
                  </span>
                  <span className="text-xs text-slate-400">{date(d.created_at)}</span>
                </div>
                <p className="font-semibold text-slate-800">
                  {d.brand} {d.model_name} {d.storage} · {d.grade}등급
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  제시가: <strong className="text-slate-800">{fmt(d.final_price)}</strong>
                  {d.contact && <> · {d.contact}</>}
                  {d.method && <> · {d.method === 'visit' ? '방문' : '택배'}</>}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['pending', 'processing', 'completed', 'cancelled']
                  .filter(s => s !== d.status)
                  .map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(d.request_id, s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      {`→ ${STATUS_LABELS[s]}`}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}