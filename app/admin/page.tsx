'use client'
import { useEffect, useState } from 'react'

interface Stats {
  products: number
  activeProducts: number
  pricingRules: number
  pendingDeals: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/products').then(r => r.json()),
      fetch('/api/admin/pricing').then(r => r.json()),
      fetch('/api/deals?status=pending').then(r => r.json()),
    ]).then(([products, pricing, deals]) => {
      setStats({
        products: products.length,
        activeProducts: products.filter((p: { is_active: number }) => p.is_active === 1).length,
        pricingRules: pricing.length,
        pendingDeals: deals.length,
      })
    })
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-800 mb-8">대시보드</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: '전체 모델',         value: stats?.products,       icon: '📱', color: 'text-blue-600' },
          { label: '활성 모델',         value: stats?.activeProducts, icon: '✅', color: 'text-emerald-600' },
          { label: '가격 규칙',         value: stats?.pricingRules,   icon: '💰', color: 'text-amber-600' },
          { label: '대기 중인 거래',    value: stats?.pendingDeals,   icon: '📋', color: 'text-red-500' },
        ].map(card => (
          <div key={card.label} className="card">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-3xl font-extrabold ${card.color}`}>
                {card.value ?? '—'}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: '/admin/products', title: '모델 관리', desc: '매입 모델 활성/비활성 토글', icon: '📱' },
          { href: '/admin/pricing',  title: '가격표 관리', desc: 'CSV 일괄 업로드 · 개별 수정', icon: '💰' },
          { href: '/admin/deals',    title: '거래 내역', desc: '견적 요청 조회 및 엑셀 내보내기', icon: '📋' },
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
