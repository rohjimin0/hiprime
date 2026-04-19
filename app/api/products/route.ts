import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const db = await getDb()
  const { searchParams } = new URL(req.url)
  const catId = searchParams.get('cat_id')
  const activeOnly = searchParams.get('active') !== 'false'

  let query = 'SELECT * FROM T_PRODUCT WHERE 1=1'
  const params: unknown[] = []

  if (catId)     { query += ' AND cat_id = ?';    params.push(Number(catId)) }
  if (activeOnly) { query += ' AND is_active = 1' }
  query += ' ORDER BY brand, model_name, storage'

  const products = db.prepare(query).all(...params)
  return NextResponse.json(products)
}
