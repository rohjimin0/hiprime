'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { QuoteResult } from '@/lib/types'

function QuoteContent() {
  const router = useRouter()
  const params = useSearchParams()
  const product_id = Number(params.get('product_id'))
  const grade = params.get('grade') ?? 'A'
  const compIds = (params.get('comps') ?? '').split(',').filter(Boolean).map(Number)

  const [result, setResult] = useState<QuoteResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!product_id) { router.push('/'); return }
    fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id, grade, selected_component_ids: compIds }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setResult(data)
      })
      .catch(() => setError('서버 오류가 발생했습니다.'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-red-500">{error}</p>
      <button onClick={() => router.push('/')} className="mt-4 btn-outline">처음으로</button>
    </div>
  )
  if (!result) return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-400">견적 계산 중...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <span className="text-slate-300">① 모델 선택</span>
        <span>›</span>
        <span className="text-slate-300">② 상태 진단</span>
        <span>›</span>
        <span className="text-brand-500 font-semibold">③ 견적 확인</span>
        <span>›</span>
        <span>④ 거래 접수</span>
      </div>

      {/* Main quote card */}
      <div className="card mb-6">
        <div className="text-center py-4">
          <p className="text-sm text-slate-500">{result.product.brand} {result.product.model_name} · {result.product.storage}</p>
          <p className="text-xs text-slate-400 mt-0.5">{result.grade}등급</p>
          <div className="mt-6">
            <p className="text-sm text-slate-500">최종 견적가</p>
            <p className="text-5xl font-extrabold text-brand-500 mt-2">
              {result.final_price.toLocaleString()}
              <span className="text-2xl ml-1">원</span>
            </p>
          </div>
        </div>

        {/* Deduction breakdown */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-4">감가 내역 (투명 공개)</h3>
          <div className="space-y-2">
            {/* Base price */}
            <div className="flex justify-between text-sm py-2">
              <span className="text-slate-600">기준 매입가 ({result.grade}등급)</span>
              <span className="font-semibold text-slate-800">{result.base_price.toLocaleString()}원</span>
            </div>

            {/* Deductions */}
            {result.deductions.filter(d => d.selected).map(d => (
              <div key={d.comp.comp_id} className="flex justify-between text-sm py-2 border-t border-slate-50">
                <span className="text-slate-500 flex items-center gap-1">
                  <span className="text-red-400">−</span> {d.comp.comp_type}
                </span>
                <span className="text-red-500 font-medium">−{d.comp.deduct_amount.toLocaleString()}원</span>
              </div>
            ))}

            {result.deductions.filter(d => d.selected).length === 0 && (
              <div className="text-sm text-slate-400 py-2 border-t border-slate-50">
                감가 항목 없음 (최상 상태)
              </div>
            )}

            {/* Total deduction */}
            {result.total_deduction > 0 && (
              <div className="flex justify-between text-sm py-2 border-t border-slate-200 font-semibold">
                <span className="text-slate-600">총 감가</span>
                <span className="text-red-500">−{result.total_deduction.toLocaleString()}원</span>
              </div>
            )}

            {/* Final */}
            <div className="flex justify-between py-3 border-t-2 border-brand-500 font-extrabold">
              <span className="text-slate-800">최종 견적가</span>
              <span className="text-brand-500 text-lg">{result.final_price.toLocaleString()}원</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grade info */}
      <div className="bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-500 mb-6">
        💡 등급 기준: S(완전 새 것) · A(사용감 약간) · B(사용감 있음) · C(파손/불량)
      </div>

      {/* CTA */}
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={() => router.push(`/deal?product_id=${product_id}&grade=${grade}&price=${result.final_price}&comps=${compIds.join(',')}`)}
          className="btn-primary text-center"
        >
          거래 신청하기 →
        </button>
        <button
          onClick={() => router.push('/')}
          className="btn-outline text-center"
        >
          다시 견적 받기
        </button>
      </div>
    </div>
  )
}

export default function QuotePage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-400">견적 계산 중...</div>}>
      <QuoteContent />
    </Suspense>
  )
}
