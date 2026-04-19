'use client'
import { useEffect, useRef, useState } from 'react'

type Settings = Record<string, string>

const HEADER_FIELDS = [
  { key: 'header.logo',       label: '로고 텍스트',  placeholder: 'HiPRIME' },
  { key: 'header.subtitle',   label: '로고 부제목',  placeholder: '하이프라임' },
  { key: 'header.nav1_label', label: '메뉴 1 이름',  placeholder: '견적 받기' },
  { key: 'header.nav1_href',  label: '메뉴 1 링크',  placeholder: '/' },
]

const FOOTER_FIELDS = [
  { key: 'footer.company',   label: '상호명',       placeholder: '영진매입 / 씨렉스 (C-RAX)' },
  { key: 'footer.address',   label: '주소 / 버전',  placeholder: 'Gwangjin-gu, Seoul · MVP v1.0' },
  { key: 'footer.copyright', label: '저작권 문구',  placeholder: '© 2026 HiPRIME.' },
]

const CHOOSE_TEXT = [
  { key: 'choose.title',    label: '섹션 제목',         placeholder: '어떤 분이신가요?' },
  { key: 'choose.ind.title', label: '개인 카드 제목',    placeholder: '개인 고객' },
  { key: 'choose.ind.desc',  label: '개인 카드 설명',    placeholder: '내 기기 시세 바로 확인하기' },
  { key: 'choose.ind.cta',   label: '개인 버튼 텍스트',  placeholder: '즉시 자동 견적 →' },
  { key: 'choose.ent.title', label: '기업 카드 제목',    placeholder: '기업 / 기관' },
  { key: 'choose.ent.desc',  label: '기업 카드 설명',    placeholder: '대량 및 서버 매각 상담 (1:1)' },
  { key: 'choose.ent.cta',   label: '기업 버튼 텍스트',  placeholder: '전문 상담원 연결 →' },
]

function ImageUpload({
  value, onChange, label,
}: { value: string; onChange: (url: string) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const { url } = await res.json()
    onChange(url)
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-600 mb-2">{label}</label>
      <div
        className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden cursor-pointer hover:border-brand-400 transition-colors"
        style={{ minHeight: 120 }}
        onClick={() => ref.current?.click()}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-full block" style={{ maxHeight: 200, objectFit: 'cover' }} />
        ) : (
          <div className="flex flex-col items-center justify-center h-28 text-slate-400 text-sm gap-1">
            <span className="text-2xl">📷</span>
            <span>클릭하여 이미지 업로드</span>
            <span className="text-xs">JPG, PNG, WebP, GIF</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm text-slate-600">업로드 중...</div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value && (
        <button onClick={() => onChange('')} className="mt-1 text-xs text-red-400 hover:text-red-600">이미지 제거</button>
      )}
    </div>
  )
}

export default function ContentPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(setSettings)
  }, [])

  function handleChange(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
  }

  const s = settings
  const heroImage  = s['main.hero_image'] || ''
  const indImage   = s['choose.ind.image'] || ''
  const entImage   = s['choose.ent.image'] || ''

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800">콘텐츠 수정</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? '저장 중...' : saved ? '✓ 저장됨' : '저장하기'}
        </button>
      </div>

      {/* ── 메인 히어로 이미지 ─────────────────────────────────── */}
      <section className="card mb-6">
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span>🖼️</span> 메인 배너 이미지
        </h2>
        <ImageUpload value={heroImage} onChange={url => handleChange('main.hero_image', url)} label="배너 이미지 (이미지 없으면 배경색만 표시)" />
        {heroImage && (
          <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden">
            <p className="text-xs text-slate-400 px-3 py-2 bg-slate-50">미리보기</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt="hero preview" className="w-full block" />
          </div>
        )}
      </section>

      {/* ── 어떤 분이신가요 섹션 ───────────────────────────────── */}
      <section className="card mb-6">
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span>👥</span> "어떤 분이신가요?" 섹션
        </h2>

        {/* 텍스트 필드 */}
        <div className="space-y-4 mb-6">
          {CHOOSE_TEXT.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-slate-600 mb-1">{f.label}</label>
              <input
                type="text"
                value={s[f.key] ?? ''}
                onChange={e => handleChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          ))}
        </div>

        {/* 이미지 업로드 */}
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <ImageUpload value={indImage} onChange={url => handleChange('choose.ind.image', url)} label="개인 카드 이미지" />
          <ImageUpload value={entImage} onChange={url => handleChange('choose.ent.image', url)} label="기업 카드 이미지" />
        </div>

        {/* 미리보기 */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-400 mb-3">미리보기</p>
          <p className="text-center font-bold text-slate-700 mb-3">{s['choose.title'] || '어떤 분이신가요?'}</p>
          <div className="grid grid-cols-2 gap-3">
            {/* 개인 */}
            <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden text-center p-4">
              {indImage
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={indImage} alt="" className="w-full rounded-lg mb-2 object-cover" style={{ height: 80 }} />
                : <div className="text-3xl mb-2">📱</div>
              }
              <p className="font-bold text-slate-800 text-sm">{s['choose.ind.title'] || '개인 고객'}</p>
              <p className="text-slate-500 text-xs mt-1">{s['choose.ind.desc'] || '내 기기 시세 바로 확인하기'}</p>
              <p className="text-brand-500 text-xs font-semibold mt-2">{s['choose.ind.cta'] || '즉시 자동 견적 →'}</p>
            </div>
            {/* 기업 */}
            <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden text-center p-4">
              {entImage
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={entImage} alt="" className="w-full rounded-lg mb-2 object-cover" style={{ height: 80 }} />
                : <div className="text-3xl mb-2">🏢</div>
              }
              <p className="font-bold text-slate-800 text-sm">{s['choose.ent.title'] || '기업 / 기관'}</p>
              <p className="text-slate-500 text-xs mt-1">{s['choose.ent.desc'] || '대량 및 서버 매각 상담 (1:1)'}</p>
              <p className="text-amber-500 text-xs font-semibold mt-2">{s['choose.ent.cta'] || '전문 상담원 연결 →'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 카카오 링크 ────────────────────────────────────────── */}
      <section className="card mb-6">
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span>💬</span> 기업 상담 (카카오톡)
        </h2>
        <label className="block text-sm font-semibold text-slate-600 mb-1">카카오톡 채널 링크</label>
        <input
          type="text"
          value={s['kakao.link'] ?? ''}
          onChange={e => handleChange('kakao.link', e.target.value)}
          placeholder="https://pf.kakao.com/_XXXXX"
          className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <p className="mt-2 text-xs text-slate-400">채널 개설 후 링크만 교체하면 즉시 연동됩니다.</p>
      </section>

      {/* ── 상단 헤더 ──────────────────────────────────────────── */}
      <section className="card mb-6">
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span>🔝</span> 상단 헤더
        </h2>
        <div className="space-y-4">
          {HEADER_FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-slate-600 mb-1">{f.label}</label>
              <input type="text" value={s[f.key] ?? ''} onChange={e => handleChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
          <p className="text-xs text-slate-400 px-4 pt-3 pb-1">미리보기</p>
          <div className="bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-brand-500 font-extrabold text-xl">{s['header.logo'] || 'HiPRIME'}</span>
              <span className="text-slate-400 text-sm">{s['header.subtitle'] || '하이프라임'}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-600">{s['header.nav1_label'] || '견적 받기'}</span>
              <span className="text-slate-400 text-xs">관리자</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 하단 푸터 ──────────────────────────────────────────── */}
      <section className="card">
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span>🔽</span> 하단 푸터
        </h2>
        <div className="space-y-4">
          {FOOTER_FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-slate-600 mb-1">{f.label}</label>
              <input type="text" value={s[f.key] ?? ''} onChange={e => handleChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
          <p className="text-xs text-slate-400 px-4 pt-3 pb-1">미리보기</p>
          <div className="bg-white border-t border-slate-200 px-4 py-6 text-sm text-slate-400">
            <p className="font-medium text-slate-600">{s['footer.company'] || '상호명'}</p>
            <p className="mt-1">{s['footer.address'] || '주소'}</p>
            <p className="mt-3 text-xs">{s['footer.copyright'] || '저작권 문구'}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
