import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  const db = await getDb()
  const { product_id, grade, final_price, selected_components, contact, method } = await req.json()

  const result = db.prepare(`
    INSERT INTO T_DEAL_REQUEST
      (product_id, grade, final_price, selected_components, contact, method)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(product_id, grade, final_price, JSON.stringify(selected_components), contact, method)

  return NextResponse.json({ ok: true, request_id: result.lastInsertRowid })
}

export async function GET(req: NextRequest) {
  const db = await getDb()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit  = Number(searchParams.get('limit') ?? 100)

  let query = `
    SELECT d.*, p.brand, p.model_name, p.storage
    FROM T_DEAL_REQUEST d
    JOIN T_PRODUCT p ON d.product_id = p.product_id
  `
  const params: unknown[] = []
  if (status) { query += ' WHERE d.status = ?'; params.push(status) }
  query += ' ORDER BY d.created_at DESC LIMIT ?'
  params.push(limit)

  return NextResponse.json(db.prepare(query).all(...params))
}
