import { neon } from '@neondatabase/serverless'

let _sql: ReturnType<typeof neon> | null = null

export function getDb() {
  if (!_sql) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL 환경변수가 없습니다.')
    _sql = neon(url)
  }
  return _sql
}

// 기존 코드 호환: sql`` 태그 그대로 사용 가능 (lazy init)
export const sql: ReturnType<typeof neon> = new Proxy(
  {} as ReturnType<typeof neon>,
  {
    get(_target, prop) {
      return getDb()[prop as keyof ReturnType<typeof neon>]
    },
    apply(_target, _thisArg, args) {
      return (getDb() as unknown as (...a: unknown[]) => unknown)(...args)
    },
  }
) as ReturnType<typeof neon>
