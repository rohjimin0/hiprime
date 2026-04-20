import { sql } from '@/lib/db'
import HomeWidget from './HomeWidget'

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

export default async function HomePage() {
  const s = await getSiteSettings()

  const heroImage = s['main.hero_image'] || ''
  const kakaoLink = s['kakao.link']      || 'https://pf.kakao.com/_XXXXX'

  const choose = {
    title:    s['choose.title']     || '어떤 분이신가요?',
    indImage: s['choose.ind.image'] || '',
    indTitle: s['choose.ind.title'] || '개인 고객',
    indDesc:  s['choose.ind.desc']  || '내 기기 시세 바로 확인하기',
    indCta:   s['choose.ind.cta']   || '즉시 자동 견적 →',
    entImage: s['choose.ent.image'] || '',
    entTitle: s['choose.ent.title'] || '기업 / 기관',
    entDesc:  s['choose.ent.desc']  || '대량 및 서버 매각 상담 (1:1)',
    entCta:   s['choose.ent.cta']   || '전문 상담원 연결 →',
  }

  return (
    <div>
      {heroImage && (
        <section className="w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt="메인 배너" className="w-full block" />
        </section>
      )}
      <HomeWidget kakaoLink={kakaoLink} choose={choose} />
    </div>
  )
}
