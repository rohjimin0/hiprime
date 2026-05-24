import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const limit = Number(new URL(req.url).searchParams.get('limit') ?? 100)
    const logs = await sql`
      SELECT * FROM T_AUDIT_LOG ORDER BY changed_at DESC LIMIT ${limit}
    `
    return NextResponse.json(logs)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 })
  }
}
