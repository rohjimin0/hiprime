'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function DealContent() {
  const router = useRouter()
  const params = useSearchParams()
  const product_id = Number(params.get('product_id'))
  const grade = params.get('grade') ?? ''
  const price = Number(params.get('price') ?? 0)
  const compIds = (params.get('comps') ?? '').split(',').filter(Boolean).map(Number)

  const [method, setMethod] = useState<'visit' | 'shipping' | null>(null)
  const [contact, setContact] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [requestId, setRequestId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!method) { setError('거래 방식을 선택해주세요.'); return }
    if (!contact.trim()) { setError('연락처를 입력해주세요.'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id, grade, final_price: price, selected_components: compIds, contact, method }),
      })
      const data = await res.json()
      if (data.ok) { setRequestId(data.request_id); setSubmitted(true) }
      else setError('신청 중 오류가 발생했습니다.')
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-6">✅</div>
      <h2 className="text-2xl font-extrabold text-slate-800">거래 신청 완료!</h2>
      <p className="text-slate-500 mt-3">접수번호: <strong className="text-brand-500">#{requestId}</strong></p>
      <p className="text-slate-500 mt-2 text-sm">
        {method === 'visit' ? '방문 일정은 연락처로 안내 드립니다.' : '택배 접수 방법을 연락처로 안내 드립니다.'}
      </p>
      <div className="card mt-8 text-left">
        <div className="text-sm text-slate-600 space-y-2">
          <div className="flex justify-between"><span>최종 견적가</span><span className="font-bold text-brand-500">{price.toLocaleString()}원</span></div>
          <div className="flex justify-between"><span>거래 방식</span><span className="font-medium">{method === 'visit' ? '방문 매입' : '택배 매입'}</span></div>
          <div className="flex justify-between"><span>연락처</span><span className="font-medium">{contact}</span></div>
        </div>
      </div>
      <button onClick={() => router.push('/')} className="btn-primary mt-8">처음으로</button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <span className="text-slate-300">① 모델 선택</span><span>›</span>
        <span className="text-slate-300">② 상태 진단</span><span>›</span>
        <span className="text-slate-300">③ 견적 확인</span><span>›</span>
        <span className="text-brand-500 font-semibold">④ 거래 접수</span>
      </div>

      {/* Price summary */}
      <div className="card mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{grade}등급 · 최종 견적가</p>
          <p className="text-3xl font-extrabold text-brand-500 mt-1">{price.toLocaleString()}원</p>
        </div>
        <div className="text-4xl">💰</div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <h2 className="text-xl font-bold text-slate-800">거래 방식 선택</h2>

        {/* Method */}
        <div className="grid sm:grid-cols-2 gap-3">
          {([
            { val: 'visit',    icon: '🏪', title: '방문 매입', desc: '지정 장소로 직접 방문 · 즉시 현금 지급' },
            { val: 'shipping', icon: '📦', title: '택배 매입', desc: '안전 포장 후 발송 · 검수 후 입금' },
          ] as const).map(opt => (
            <button
              key={opt.val}
              type="button"
              onClick={() => setMethod(opt.val)}
              className={`text-left p-4 rounded-xl border-2 transition-colors ${
                method === opt.val
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-slate-200 hover:border-brand-300'
              }`}
            >
              <div className="text-2xl mb-2">{opt.icon}</div>
              <div className="font-semibold text-slate-800">{opt.title}</div>
              <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">연락처 (전화번호 또는 카카오ID)</label>
          <input
            type="text"
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="010-0000-0000"
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="grid sm:grid-cols-2 gap-3">
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? '처리 중...' : '거래 신청 완료 →'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-outline">
            이전으로
          </button>
        </div>

        <p className="text-xs text-slate-400">
          * 실제 매입가는 기기 수령 후 최종 검수를 통해 확정됩니다. 견적가와 크게 다를 경우 거래를 취소할 수 있습니다.
        </p>
      </form>
    </div>
  )
}

export default function DealPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-400">불러오는 중...</div>}>
      <DealContent />
    </Suspense>
  )
}
