'use client'
import { signOut } from 'next-auth/react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-slate-900 text-slate-300 flex-shrink-0 hidden md:flex flex-col">
        <div className="px-5 py-5 border-b border-slate-700">
          <p className="font-extrabold text-white text-lg">HiPRIME</p>
          <p className="text-xs text-slate-500 mt-0.5">관리자 패널</p>
        </div>
        <nav className="px-3 py-4 space-y-1 text-sm flex-1">
          {[
            { href: '/admin',            label: '대시보드',       icon: '📊' },
            { href: '/admin/products',   label: '모델 관리',       icon: '📱' },
            { href: '/admin/pricing',    label: '가격표 관리',     icon: '💰' },
            { href: '/admin/deals',      label: '거래 내역',       icon: '📋' },
            { href: '/admin/categories', label: '카테고리 관리',   icon: '🗂️' },
            { href: '/admin/content',    label: '상단/하단 수정',  icon: '✏️' },
            { href: '/admin/logs',       label: '수정 이력',       icon: '🔍' },
            { href: '/',                 label: '사용자 화면',     icon: '↗' },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-700">
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>🚪</span>
            로그아웃
          </button>
        </div>
      </aside>

      <div className="flex-1 bg-slate-50 overflow-auto">
        <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <span className="font-bold">HiPRIME 관리자</span>
          <div className="flex gap-4 text-xs text-slate-400">
            <a href="/admin">대시보드</a>
            <a href="/admin/products">모델</a>
            <a href="/admin/pricing">가격표</a>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="text-slate-400 hover:text-white"
            >
              로그아웃
            </button>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
