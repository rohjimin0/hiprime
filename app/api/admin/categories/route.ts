import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = await getDb()
  const rows = db.prepare('SELECT * FROM T_CATEGORY ORDER BY parent_id ASC, sort_order ASC').all()
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const db = await getDb()
  const { cat_name, parent_id, sort_order } = await req.json()
  const result = db.prepare(
    'INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES (?, ?, ?)'
  ).run(cat_name, parent_id ?? null, sort_order ?? 0)
  return NextResponse.json({ cat_id: result.lastInsertRowid })
}

export async function PUT(req: Request) {
  const db = await getDb()
  const { cat_id, cat_name, sort_order } = await req.json()
  db.prepare('UPDATE T_CATEGORY SET cat_name=?, sort_order=? WHERE cat_id=?').run(cat_name, sort_order ?? 0, cat_id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const db = await getDb()
  const { cat_id } = await req.json()
  // 하위 카테고리 있으면 거부
  const children = db.prepare('SELECT COUNT(*) as cnt FROM T_CATEGORY WHERE parent_id=?').get(cat_id) as { cnt: number }
  if (children.cnt > 0) return NextResponse.json({ error: '하위 카테고리가 있어 삭제할 수 없습니다.' }, { status: 400 })
  const products = db.prepare('SELECT COUNT(*) as cnt FROM T_PRODUCT WHERE cat_id=?').get(cat_id) as { cnt: number }
  if (products.cnt > 0) return NextResponse.json({ error: '연결된 상품이 있어 삭제할 수 없습니다.' }, { status: 400 })
  db.prepare('DELETE FROM T_CATEGORY WHERE cat_id=?').run(cat_id)
  return NextResponse.json({ ok: true })
}
