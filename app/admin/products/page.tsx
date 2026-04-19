'use client'
import { useEffect, useState } from 'react'

interface Product {
  product_id: number
  brand: string
  model_name: string
  storage: string
  color: string | null
  is_active: number
  cat_name: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<number | null>(null)

  async function loadProducts() {
    const data = await fetch('/api/admin/products').then(r => r.json())
    setProducts(data)
    setLoading(false)
  }

  useEffect(() => { loadProducts() }, [])

  async function toggleActive(product_id: number, is_active: number) {
    setToggling(product_id)
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id, is_active: is_active === 1 ? 0 : 1 }),
    })
    await loadProducts()
    setToggling(null)
  }

  const brands = [...new Set(products.map(p => p.brand))]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800">모델 관리</h1>
        <span className="text-sm text-slate-500">
          활성 {products.filter(p => p.is_active === 1).length} / 전체 {products.length}
        </span>
      </div>

      {loading ? (
        <p className="text-slate-400">불러오는 중...</p>
      ) : (
        <div className="space-y-6">
          {brands.map(brand => (
            <div key={brand} className="card">
              <h2 className="font-bold text-slate-700 mb-4">{brand}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 text-slate-500 font-medium">모델명</th>
                      <th className="text-left py-2 text-slate-500 font-medium">용량</th>
                      <th className="text-left py-2 text-slate-500 font-medium">색상</th>
                      <th className="text-center py-2 text-slate-500 font-medium">상태</th>
                      <th className="text-center py-2 text-slate-500 font-medium">노출</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter(p => p.brand === brand).map(p => (
                      <tr key={p.product_id} className="border-b border-slate-50">
                        <td className="py-3 font-medium text-slate-800">{p.model_name}</td>
                        <td className="py-3 text-slate-600">{p.storage}</td>
                        <td className="py-3 text-slate-500">{p.color ?? '—'}</td>
                        <td className="py-3 text-center">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {p.is_active ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => toggleActive(p.product_id, p.is_active)}
                            disabled={toggling === p.product_id}
                            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                              p.is_active ? 'bg-brand-500' : 'bg-slate-300'
                            } disabled:opacity-50`}
                          >
                            <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              p.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
