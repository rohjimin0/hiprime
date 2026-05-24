'use client'
import { useEffect, useState } from 'react'

interface Stats {
  total_products: number
  active_products: number
  pricing_rules: number
  pending_deals: number
  total_deals: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const cards = [
    { label: '전체 모델',    value: stats?.total_products,  icon: '📱', color: 'text-blue-600' },
    { label: '활성 모델',    value: stats?.active_products, icon: '✅', color: 'text-emerald-600' },
    { label: '가격 규칙',    value: stats?.pricing_rules,   icon: '💰', color: 'text-amber-600' },
    { label: '대기 중 거래', value: stats?.pending_deals,   icon: '📋', color: 'text-red-500' },
    { label: '전체 거래',    value: stats?.total_deals,     icon: '🤝', color: 'text-purple-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-800 mb-8">대시보드</h1>
      <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {cards.map(card => (
          <div key={card.label} className="card">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-3xl font-extrabold ${card.color}`}>
                {loading ? '…' : (card.value ?? '—')}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/admin/products',   title: '모델 관리',     desc: '매입 모델 활성/비활성 · 신규 등록',  icon: '📱' },
          { href: '/admin/pricing',    title: '가격표 관리',   desc: 'CSV 일괄 업로드 · 개별 수정',        icon: '💰' },
          { href: '/admin/deals',      title: '거래 내역',     desc: '견적 요청 조회 및 상태 관리',        icon: '📋' },
          { href: '/admin/categories', title: '카테고리 관리', desc: '분류 체계 편집',                     icon: '🗂️' },
          { href: '/admin/content',    title: '화면 수정',     desc: '헤더/푸터/이미지 관리',              icon: '✏️' },
          { href: '/admin/logs',       title: '수정 이력',     desc: '모든 변경 내역 감사 로그',           icon: '🔍' },
        ].map(item => (
          <a key={item.href} href={item.href} className="card hover:shadow-md transition-shadow block">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-bold text-slate-800">{item.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
