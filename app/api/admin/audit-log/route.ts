import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const db = await getDb()
  const limit = Number(new URL(req.url).searchParams.get('limit') ?? 100)
  const logs = db.prepare('SELECT * FROM T_AUDIT_LOG ORDER BY changed_at DESC LIMIT ?').all(limit)
  return NextResponse.json(logs)
}
