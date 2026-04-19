'use client'
import { useEffect, useState } from 'react'

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

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/deals').then(r => r.json()).then(data => {
      setDeals(data)
      setLoading(false)
    })
  }, [])

  function downloadCsv() {
    const headers = ['접수번호', '브랜드', '모델명', '용량', '등급', '견적가', '연락처', '방식', '상태', '접수일시']
    const rows = deals.map(d => [
      d.request_id, d.brand, d.model_name, d.storage, d.grade,
      d.final_price, d.contact ?? '', d.method ?? '', d.status, d.created_at,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'deals.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800">거래 내역</h1>
        <button onClick={downloadCsv} className="btn-outline py-2 text-sm">⬇ 엑셀(CSV) 내보내기</button>
      </div>

      {loading ? (
        <p className="text-slate-400">불러오는 중...</p>
      ) : deals.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">아직 거래 신청이 없습니다.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {['#', '모델', '등급', '견적가', '방식', '연락처', '상태', '접수일'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-slate-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map(d => (
                <tr key={d.request_id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 px-3 text-slate-400">#{d.request_id}</td>
                  <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                    {d.brand} {d.model_name} {d.storage}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      d.grade === 'S' ? 'bg-emerald-100 text-emerald-700' :
                      d.grade === 'A' ? 'bg-blue-100 text-blue-700' :
                      d.grade === 'B' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                    }`}>{d.grade}</span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-brand-500">
                    {d.final_price.toLocaleString()}원
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {d.method === 'visit' ? '방문' : d.method === 'shipping' ? '택배' : '—'}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{d.contact ?? '—'}</td>
                  <td className="py-3 px-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      d.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      d.status === 'done'    ? 'bg-emerald-100 text-emerald-700' :
                                              'bg-slate-100 text-slate-500'
                    }`}>{d.status}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-xs whitespace-nowrap">
                    {d.created_at.slice(0, 16).replace('T', ' ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
