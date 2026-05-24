import { sql } from '@/lib/db'

export async function getSiteSettings(): Promise<Record<string, string>> {
  try {
    const rows = await sql`SELECT key, value FROM T_SITE_SETTINGS` as { key: string; value: string }[]
    const s: Record<string, string> = {}
    for (const r of rows) s[r.key] = r.value
    return s
  } catch {
    return {}
  }
}
