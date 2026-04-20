import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const catId = searchParams.get('cat_id')
  const activeOnly = searchParams.get('active') !== 'false'

  let rows
  if (catId && activeOnly) {
    rows = await sql`
      SELECT * FROM T_PRODUCT
      WHERE cat_id = ${Number(catId)} AND is_active = 1
      ORDER BY brand, model_name, storage
    `
  } else if (catId) {
    rows = await sql`
      SELECT * FROM T_PRODUCT
      WHERE cat_id = ${Number(catId)}
      ORDER BY brand, model_name, storage
    `
  } else if (activeOnly) {
    rows = await sql`
      SELECT * FROM T_PRODUCT
      WHERE is_active = 1
      ORDER BY brand, model_name, storage
    `
  } else {
    rows = await sql`
      SELECT * FROM T_PRODUCT
      ORDER BY brand, model_name, storage
    `
  }

  return NextResponse.json(rows)
}
