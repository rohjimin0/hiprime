'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Category, Product } from '@/lib/types'

const GRADES = [
  { grade: 'S', label: 'S등급', desc: '완전 새 것 수준 / 흠집 없음', color: 'bg-emerald-100 text-emerald-700' },
  { grade: 'A', label: 'A등급', desc: '사용감 약간 / 기능 정상',      color: 'bg-blue-100 text-blue-700' },
  { grade: 'B', label: 'B등급', desc: '사용감 있음 / 잔흠집',         color: 'bg-yellow-100 text-yellow-700' },
  { grade: 'C', label: 'C등급', desc: '파손/불량 있음',                color: 'bg-red-100 text-red-700' },
]

type Mode = 'choose' | 'individual' | 'enterprise'

interface ChooseSettings {
  title: string
  indImage: string; indTitle: string; indDesc: string; indCta: string
  entImage: string; entTitle: string; entDesc: string; entCta: string
}

export default function HomeWidget({ kakaoLink, choose }: { kakaoLink: string; choose: ChooseSettings }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('choose')
  const [showKakaoPopup, setShowKakaoPopup] = useState(false)

  // 카테고리 3단계 선택
  const [allCats, setAllCats] = useState<Category[]>([])
  const [sel, setSel] = useState<(number | null)[]>([null, null, null]) // [L1, L2, L3]
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setAllCats)
  }, [])

  // 해당 depth의 자식 카테고리 반환
  function children(parentId: number | null): Category[] {
    return allCats.filter(c => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order)
  }

  function handleCatSelect(depth: number, catId: number) {
    const next: (number | null)[] = [null, null, null]
    next[depth] = catId
    setSel(next)
    setProducts([])
    setSelectedProduct(null)
    setSelectedGrade(null)

    // L3 선택 시 상품 로드
    if (depth === 2) {
      fetch(`/api/products?cat_id=${catId}`).then(r => r.json()).then(setProducts)
    }
  }

  function handleStart() {
    if (!selectedProduct || !selectedGrade) return
    router.push(`/diagnose?product_id=${selectedProduct}&grade=${selectedGrade}`)
  }

  const l1List = children(null)
  const l2List = sel[0] != null ? children(sel[0]) : []
  const l3List = sel[1] != null ? children(sel[1]) : []

  // Steps 표시
  const stepIndex =
    mode !== 'individual' ? -1
    : !sel[0] ? 0
    : !sel[1] ? 1
    : !sel[2] ? 2
    : !selectedProduct ? 3
    : !selectedGrade ? 4
    : 5

  if (mode === 'choose') {
    return (
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-center text-xl font-bold text-slate-700 mb-8">{choose.title}</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* 개인 */}
          <button
            onClick={() => setMode('individual')}
            className="group card border-2 border-transparent hover:border-brand-400 hover:shadow-lg transition-all text-left p-0 overflow-hidden"
          >
            {choose.indImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={choose.indImage} alt="" className="w-full object-cover" style={{ maxHeight: 180 }} />
            ) : (
              <div className="flex items-center justify-center bg-brand-50 h-32 text-5xl">📱</div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-extrabold text-slate-800 group-hover:text-brand-600">{choose.indTitle}</h3>
              <p className="mt-2 text-slate-500 text-sm">{choose.indDesc}</p>
              <div className="mt-4 text-brand-500 text-sm font-semibold">{choose.indCta}</div>
            </div>
          </button>

          {/* 기업 */}
          <button
            onClick={() => setShowKakaoPopup(true)}
            className="group card border-2 border-transparent hover:border-amber-400 hover:shadow-lg transition-all text-left p-0 overflow-hidden"
          >
            {choose.entImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={choose.entImage} alt="" className="w-full object-cover" style={{ maxHeight: 180 }} />
            ) : (
              <div className="flex items-center justify-center bg-amber-50 h-32 text-5xl">🏢</div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-extrabold text-slate-800 group-hover:text-amber-600">{choose.entTitle}</h3>
              <p className="mt-2 text-slate-500 text-sm">{choose.entDesc}</p>
              <div className="mt-4 text-amber-500 text-sm font-semibold">{choose.entCta}</div>
            </div>
          </button>
        </div>

        {/* 카카오 팝업 */}
        {showKakaoPopup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-lg font-extrabold text-slate-800">기업 전용 1:1 매입 상담</h3>
              <p className="mt-2 text-slate-500 text-sm">
                서버, 워크스테이션, 기업 불용 PC, 네트워크 장비 등<br />대량 매입은 전문 상담원이 직접 안내드립니다.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <a
                  href={kakaoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 font-bold text-slate-900 transition-colors"
                >
                  카카오톡 상담 시작하기
                </a>
                <button
                  onClick={() => setShowKakaoPopup(false)}
                  className="w-full py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors text-sm"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="max-w-2xl mx-auto px-4 py-8">
      {/* 뒤로 */}
      <button onClick={() => { setMode('choose'); setSel([null,null,null]); setProducts([]); setSelectedProduct(null); setSelectedGrade(null) }}
        className="text-sm text-slate-400 hover:text-brand-500 mb-6 flex items-center gap-1">
        ← 처음으로
      </button>

      {/* Steps */}
      <div className="flex items-center gap-1 text-xs mb-8 overflow-x-auto pb-1">
        {['대분류', '중분류', '소분류', '모델', '등급', '견적'].map((s, i) => (
          <div key={i} className="flex items-center gap-1 flex-shrink-0">
            {i > 0 && <span className="text-slate-300">›</span>}
            <span className={i <= stepIndex ? 'text-brand-500 font-semibold' : 'text-slate-400'}>{s}</span>
          </div>
        ))}
      </div>

      <div className="card space-y-6">
        {/* L1: 대분류 */}
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-3">대분류 선택</label>
          <div className="flex flex-wrap gap-2">
            {l1List.map(cat => (
              <button key={cat.cat_id} onClick={() => handleCatSelect(0, cat.cat_id)}
                className={`px-4 py-2 rounded-xl border-2 font-medium text-sm transition-colors ${
                  sel[0] === cat.cat_id ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-600 hover:border-brand-300'
                }`}>
                {cat.cat_name}
              </button>
            ))}
          </div>
        </div>

        {/* L2: 중분류 */}
        {l2List.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">중분류 선택</label>
            <div className="flex flex-wrap gap-2">
              {l2List.map(cat => (
                <button key={cat.cat_id} onClick={() => handleCatSelect(1, cat.cat_id)}
                  className={`px-4 py-2 rounded-xl border-2 font-medium text-sm transition-colors ${
                    sel[1] === cat.cat_id ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}>
                  {cat.cat_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* L3: 소분류 */}
        {l3List.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">소분류 선택</label>
            <div className="flex flex-wrap gap-2">
              {l3List.map(cat => (
                <button key={cat.cat_id} onClick={() => handleCatSelect(2, cat.cat_id)}
                  className={`px-4 py-2 rounded-xl border-2 font-medium text-sm transition-colors ${
                    sel[2] === cat.cat_id ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}>
                  {cat.cat_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* L3 선택 후 상품이 없을 때 안내 */}
        {sel[2] != null && products.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-sm">
            등록된 모델이 없습니다.<br />
            <a href="tel:010-0000-0000" className="text-brand-500 font-semibold mt-2 block">📞 전화로 문의하기</a>
          </div>
        )}

        {/* 상품 선택 */}
        {products.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">모델 선택</label>
            <div className="grid gap-2">
              {products.map(p => (
                <button key={p.product_id} onClick={() => { setSelectedProduct(p.product_id); setSelectedGrade(null) }}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                    selectedProduct === p.product_id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300'
                  }`}>
                  <span className="font-medium text-slate-800">{p.model_name}</span>
                  <span className="ml-2 text-sm text-slate-500">{p.storage}</span>
                  {p.color && <span className="ml-2 text-xs text-slate-400">{p.color}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 등급 선택 */}
        {selectedProduct && (
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">기기 상태 (등급)</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {GRADES.map(g => (
                <button key={g.grade} onClick={() => setSelectedGrade(g.grade)}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                    selectedGrade === g.grade ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300'
                  }`}>
                  <span className={`badge-grade ${g.color} mr-2`}>{g.grade}</span>
                  <span className="font-medium text-slate-800">{g.label}</span>
                  <p className="mt-1 text-xs text-slate-500 ml-10">{g.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleStart} disabled={!selectedProduct || !selectedGrade}
          className="w-full btn-primary text-center disabled:opacity-40 disabled:cursor-not-allowed">
          상태 진단 시작하기 →
        </button>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-4 mt-8 text-center text-sm">
        {[
          { icon: '🔍', title: '투명한 가격', desc: '감가 항목 전부 공개' },
          { icon: '⚡', title: '즉시 견적',   desc: '3단계, 30초 완료' },
          { icon: '💰', title: '최고가 보장', desc: '흥정 없이 처음부터' },
        ].map(b => (
          <div key={b.title} className="card py-4">
            <div className="text-2xl">{b.icon}</div>
            <div className="font-semibold text-slate-700 mt-2">{b.title}</div>
            <div className="text-xs text-slate-500 mt-1">{b.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
