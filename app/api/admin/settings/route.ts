import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = await getDb()
  const rows = db.prepare('SELECT key, value FROM T_SITE_SETTINGS').all() as { key: string; value: string }[]
  const settings: Record<string, string> = {}
  for (const r of rows) settings[r.key] = r.value
  return NextResponse.json(settings)
}

export async function PUT(req: Request) {
  const db = await getDb()
  const body = await req.json() as Record<string, string>
  const upsert = db.prepare('INSERT INTO T_SITE_SETTINGS (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
  for (const [k, v] of Object.entries(body)) upsert.run(k, String(v))
  return NextResponse.json({ ok: true })
}
