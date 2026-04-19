'use client'
import { useEffect, useState } from 'react'
import type { Category } from '@/lib/types'

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([])
  const [editing, setEditing] = useState<Category | null>(null)
  const [adding, setAdding] = useState<{ parentId: number | null } | null>(null)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const data = await fetch('/api/admin/categories').then(r => r.json())
    setCats(data)
  }

  useEffect(() => { load() }, [])

  function children(parentId: number | null): Category[] {
    return cats.filter(c => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order)
  }

  async function handleAdd() {
    if (!newName.trim()) return
    setError('')
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cat_name: newName.trim(), parent_id: adding?.parentId ?? null, sort_order: 0 }),
    })
    if (res.ok) { setAdding(null); setNewName(''); load() }
  }

  async function handleEdit() {
    if (!editing || !editing.cat_name.trim()) return
    await fetch('/api/admin/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cat_id: editing.cat_id, cat_name: editing.cat_name, sort_order: editing.sort_order }),
    })
    setEditing(null)
    load()
  }

  async function handleDelete(catId: number) {
    setError('')
    const res = await fetch('/api/admin/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cat_id: catId }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    load()
  }

  function depth(cat: Category): number {
    if (cat.parent_id === null) return 0
    const parent = cats.find(c => c.cat_id === cat.parent_id)
    return parent ? depth(parent) + 1 : 0
  }

  function CatRow({ cat, level }: { cat: Category; level: number }) {
    const sub = children(cat.cat_id)
    const isLeaf = sub.length === 0
    const depthColors = ['text-slate-800', 'text-slate-600', 'text-slate-500']
    const depthBg     = ['bg-white', 'bg-slate-50', 'bg-slate-100']

    return (
      <>
        <tr className={`border-b border-slate-100 ${depthBg[level] || 'bg-slate-100'}`}>
          <td className="py-2 px-4">
            <span style={{ marginLeft: level * 20 }} className={`font-medium ${depthColors[level] || 'text-slate-500'}`}>
              {level > 0 && <span className="text-slate-300 mr-1">{'└'}</span>}
              {cat.cat_name}
            </span>
          </td>
          <td className="py-2 px-4 text-xs text-slate-400">
            {level === 0 ? '대분류' : level === 1 ? '중분류' : '소분류'}
          </td>
          <td className="py-2 px-4">
            <div className="flex items-center gap-2 justify-end">
              {level < 2 && (
                <button onClick={() => { setAdding({ parentId: cat.cat_id }); setNewName('') }}
                  className="text-xs px-2 py-1 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100">
                  + 하위 추가
                </button>
              )}
              <button onClick={() => setEditing(cat)}
                className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                수정
              </button>
              {isLeaf && (
                <button onClick={() => { if (confirm(`"${cat.cat_name}" 삭제하시겠습니까?`)) handleDelete(cat.cat_id) }}
                  className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                  삭제
                </button>
              )}
            </div>
          </td>
        </tr>
        {/* 하위 카테고리 추가 인라인 */}
        {adding?.parentId === cat.cat_id && (
          <tr className="bg-brand-50 border-b border-brand-100">
            <td colSpan={3} className="py-2 px-4">
              <div style={{ marginLeft: (level + 1) * 20 }} className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(null) }}
                  placeholder="카테고리명 입력"
                  className="border border-brand-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button onClick={handleAdd} className="text-sm px-3 py-1 rounded-lg bg-brand-500 text-white hover:bg-brand-600">추가</button>
                <button onClick={() => setAdding(null)} className="text-sm px-2 py-1 text-slate-400 hover:text-slate-600">취소</button>
              </div>
            </td>
          </tr>
        )}
        {sub.map(c => <CatRow key={c.cat_id} cat={c} level={level + 1} />)}
      </>
    )
  }

  const l1 = children(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800">카테고리 관리</h1>
        <button onClick={() => { setAdding({ parentId: null }); setNewName('') }}
          className="btn-primary text-sm">
          + 대분류 추가
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{error}</div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="text-left py-3 px-4 font-semibold text-slate-600">카테고리명</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">레벨</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-600">관리</th>
            </tr>
          </thead>
          <tbody>
            {/* 대분류 직접 추가 인라인 */}
            {adding?.parentId === null && (
              <tr className="bg-brand-50 border-b border-brand-100">
                <td colSpan={3} className="py-2 px-4">
                  <div className="flex items-center gap-2">
                    <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(null) }}
                      placeholder="대분류명 입력"
                      className="border border-brand-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    <button onClick={handleAdd} className="text-sm px-3 py-1 rounded-lg bg-brand-500 text-white">추가</button>
                    <button onClick={() => setAdding(null)} className="text-sm px-2 py-1 text-slate-400">취소</button>
                  </div>
                </td>
              </tr>
            )}
            {l1.map(cat => <CatRow key={cat.cat_id} cat={cat} level={0} />)}
          </tbody>
        </table>
        {cats.length === 0 && (
          <p className="text-center text-slate-400 py-10 text-sm">카테고리가 없습니다.</p>
        )}
      </div>

      {/* 수정 모달 */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-slate-800 mb-4">카테고리 수정</h3>
            <input
              autoFocus
              value={editing.cat_name}
              onChange={e => setEditing({ ...editing, cat_name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={handleEdit} className="flex-1 btn-primary text-sm">저장</button>
              <button onClick={() => setEditing(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
