import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const rows = await sql`SELECT key, value FROM T_SITE_SETTINGS` as { key: string; value: string }[]
    const settings: Record<string, string> = {}
    for (const r of rows) settings[r.key] = r.value
    return NextResponse.json(settings)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json() as Record<string, string>
    for (const [k, v] of Object.entries(body)) {
      await sql`
        INSERT INTO T_SITE_SETTINGS (key, value) VALUES (${k}, ${String(v)})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 })
  }
}
