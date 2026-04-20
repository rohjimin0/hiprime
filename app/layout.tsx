import type { Metadata } from 'next'
import './globals.css'
import { sql } from '@/lib/db'

export const metadata: Metadata = {
  title: 'HiPRIME 하이프라임 — 스마트폰 최고가 매입',
  description: '가장 간단하게, 가장 확실하게. 오늘 바로, 최고가로.',
}

async function getSiteSettings(): Promise<Record<string, string>> {
  try {
    const rows = await sql`SELECT key, value FROM T_SITE_SETTINGS` as { key: string; value: string }[]
    const s: Record<string, string> = {}
    for (const r of rows) s[r.key] = r.value
    return s
  } catch {
    return {}
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSiteSettings()

  const logo      = s['header.logo']       || 'HiPRIME'
  const subtitle  = s['header.subtitle']   || '하이프라임'
  const nav1Label = s['header.nav1_label'] || '견적 받기'
  const nav1Href  = s['header.nav1_href']  || '/'
  const company   = s['footer.company']    || '영진매입 / 씨렉스 (C-RAX)'
  const address   = s['footer.address']    || 'Gwangjin-gu, Seoul · MVP v1.0'
  const copyright = s['footer.copyright']  || '© 2026 HiPRIME. 가격은 실제 매입 시 최종 확인됩니다.'

  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-brand-500 font-extrabold text-xl tracking-tight">{logo}</span>
              <span className="text-slate-400 text-sm hidden sm:block">{subtitle}</span>
            </a>
            <nav className="flex items-center gap-4 text-sm">
              <a href={nav1Href} className="text-slate-600 hover:text-brand-500 transition-colors">{nav1Label}</a>
              <a href="/admin" className="text-slate-400 hover:text-slate-600 transition-colors text-xs">관리자</a>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-white border-t border-slate-200 mt-16">
          <div className="max-w-5xl mx-auto px-4 py-8 text-sm text-slate-400">
            <p className="font-medium text-slate-600">{company}</p>
            <p className="mt-1">{address}</p>
            <p className="mt-3 text-xs">{copyright}</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
