'use client'
import { useEffect, useState } from 'react'

interface Log {
  log_id: number
  action: string
  target_table: string | null
  target_id: number | null
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_at: string
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/audit-log?limit=200').then(r => r.json()).then(data => {
      setLogs(data)
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-800 mb-8">수정 이력 (Audit Log)</h1>
      {loading ? (
        <p className="text-slate-400">불러오는 중...</p>
      ) : logs.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">이력이 없습니다.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {['시각', '작업', '테이블', 'ID', '변경자', '이전값', '신규값'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-slate-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.log_id} className="border-b border-slate-50 hover:bg-slate-50 align-top">
                  <td className="py-2 px-3 text-slate-400 text-xs whitespace-nowrap">
                    {log.changed_at.slice(0, 16).replace('T', ' ')}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      log.action.includes('INSERT') ? 'bg-blue-100 text-blue-700' :
                      log.action.includes('UPDATE') ? 'bg-amber-100 text-amber-700' :
                                                      'bg-red-100 text-red-700'
                    }`}>{log.action}</span>
                  </td>
                  <td className="py-2 px-3 text-slate-500 text-xs">{log.target_table ?? '—'}</td>
                  <td className="py-2 px-3 text-slate-500 text-xs">{log.target_id ?? '—'}</td>
                  <td className="py-2 px-3 text-slate-600 text-xs">{log.changed_by ?? '—'}</td>
                  <td className="py-2 px-3 text-xs text-slate-400 max-w-xs truncate" title={log.old_value ?? ''}>
                    {log.old_value ? log.old_value.slice(0, 60) : '—'}
                  </td>
                  <td className="py-2 px-3 text-xs text-slate-600 max-w-xs truncate" title={log.new_value ?? ''}>
                    {log.new_value ? log.new_value.slice(0, 60) : '—'}
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
