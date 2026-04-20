import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const rows = await sql`
    SELECT * FROM T_CATEGORY
    ORDER BY parent_id ASC NULLS FIRST, sort_order ASC
  `
  return NextResponse.json(rows)
}
