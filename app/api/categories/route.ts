import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM T_CATEGORY
      ORDER BY parent_id ASC NULLS FIRST, sort_order ASC
    `
    return NextResponse.json(rows)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 })
  }
}
