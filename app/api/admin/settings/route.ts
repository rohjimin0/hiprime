import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const rows = await sql`SELECT key, value FROM T_SITE_SETTINGS` as { key: string; value: string }[]
  const settings: Record<string, string> = {}
  for (const r of rows) settings[r.key] = r.value
  return NextResponse.json(settings)
}

export async function PUT(req: Request) {
  const body = await req.json() as Record<string, string>
  for (const [k, v] of Object.entries(body)) {
    await sql`
      INSERT INTO T_SITE_SETTINGS (key, value) VALUES (${k}, ${String(v)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `
  }
  return NextResponse.json({ ok: true })
}
