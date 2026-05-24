import { neon } from '@neondatabase/serverless'

/**
 * neon() 의 기본 반환 타입은 union(any[][] | Record<string,any>[] | FullQueryResults)이라
 * `const [row] = await sql\`...\`` 같은 destructuring 이 타입체크에서 깨진다.
 *
 * 실제 동작은 항상 Record<string, any>[] 이므로(default options) 타입을 단순화한다.
 */
type SqlRows = Record<string, any>[]
type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<SqlRows>

let _sql: SqlTag | null = null

export function getDb(): SqlTag {
  if (!_sql) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL 환경변수가 없습니다.')
    _sql = neon(url) as unknown as SqlTag
  }
  return _sql
}

// 기존 코드 호환: sql`` 태그 그대로 사용 가능 (lazy init)
// Proxy target은 반드시 callable 이어야 tagged template / 함수 호출이 동작함
const _target = function () {} as unknown as SqlTag

export const sql: SqlTag = new Proxy(_target, {
  get(_t, prop) {
    return (getDb() as unknown as Record<string, unknown>)[prop as string]
  },
  apply(_t, _thisArg, args) {
    return (getDb() as unknown as (...a: unknown[]) => unknown)(...args)
  },
}) as SqlTag
