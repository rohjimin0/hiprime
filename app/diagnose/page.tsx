'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Component, Product } from '@/lib/types'

function DiagnoseContent() {
  const router = useRouter()
  const params = useSearchParams()
  const product_id = Number(params.get('product_id'))
  const grade = params.get('grade') ?? 'A'

  const [product, setProduct] = useState<Product | null>(null)
  const [components, setComponents] = useState<Component[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!product_id) { router.push('/'); return }
    fetch(`/api/products`).then(r => r.json()).then((ps: Product[]) => {
      setProduct(ps.find(p => p.product_id === product_id) ?? null)
    })
    fetch(`/api/components?product_id=${product_id}`).then(r => r.json()).then(setComponents)
  }, [product_id, router])

  function toggle(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSubmit() {
    setLoading(true)
    const ids = [...selected]
    router.push(
      `/quote?product_id=${product_id}&grade=${grade}&comps=${ids.join(',')}`
    )
  }

  if (!product) return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-400">불러오는 중...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <span className="text-slate-300">① 모델 선택</span>
        <span>›</span>
        <span className="text-brand-500 font-semibold">② 상태 진단</span>
        <span>›</span>
        <span>③ 견적 확인</span>
        <span>›</span>
        <span>④ 거래 접수</span>
      </div>

      <div className="card">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">상태 진단 체크리스트</h2>
          <p className="text-sm text-slate-500 mt-1">
            해당되는 항목을 모두 선택해주세요. 투명하게 감가에 반영됩니다.
          </p>
        </div>

        {/* Product summary */}
        <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 mb-6">
          <div>
            <span className="font-semibold text-slate-800">{product.brand} {product.model_name}</span>
            <span className="ml-2 text-sm text-slate-500">{product.storage}</span>
          </div>
          <span className={`badge-grade text-sm font-bold px-3 py-1 rounded-full ${
            grade === 'S' ? 'bg-emerald-100 text-emerald-700' :
            grade === 'A' ? 'bg-blue-100 text-blue-700' :
            grade === 'B' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
          }`}>{grade}등급</span>
        </div>

        {/* Checklist */}
        <div className="space-y-3 mb-8">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">결함 항목 선택 (없으면 아무것도 선택 안 해도 됩니다)</p>
          {components.map(c => (
            <label
              key={c.comp_id}
              className={`flex items-center gap-4 px-4 py-4 rounded-xl border-2 cursor-pointer transition-colors ${
                selected.has(c.comp_id)
                  ? 'border-red-400 bg-red-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(c.comp_id)}
                onChange={() => toggle(c.comp_id)}
                className="w-5 h-5 accent-red-500 shrink-0"
              />
              <div className="flex-1">
                <span className="font-semibold text-slate-800">{c.comp_type}</span>
                {c.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                )}
              </div>
              <span className="text-sm font-semibold text-red-500 shrink-0">
                −{c.deduct_amount.toLocaleString()}원
              </span>
            </label>
          ))}
        </div>

        {/* Summary */}
        {selected.size > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6 text-sm">
            <span className="text-slate-600">선택된 감가 항목 {selected.size}개 · 예상 감가: </span>
            <span className="font-bold text-red-600">
              −{components.filter(c => selected.has(c.comp_id)).reduce((s, c) => s + c.deduct_amount, 0).toLocaleString()}원
            </span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50"
        >
          {loading ? '계산 중...' : '견적 확인하기 →'}
        </button>
      </div>
    </div>
  )
}

export default function DiagnosePage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-400">불러오는 중...</div>}>
      <DiagnoseContent />
    </Suspense>
  )
}
