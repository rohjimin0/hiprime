import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const db = await getDb()
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('product_id')

  const rows = productId
    ? db.prepare(`
        SELECT * FROM T_COMPONENT
        WHERE product_id IS NULL OR product_id = ?
        ORDER BY deduct_amount DESC
      `).all(Number(productId))
    : db.prepare(`
        SELECT * FROM T_COMPONENT WHERE product_id IS NULL ORDER BY deduct_amount DESC
      `).all()

  return NextResponse.json(rows)
}

export async function PUT(req: NextRequest) {
  const db = await getDb()
  const { comp_id, deduct_amount, description } = await req.json()

  const old = db.prepare('SELECT * FROM T_COMPONENT WHERE comp_id = ?').get(comp_id)
  db.prepare('UPDATE T_COMPONENT SET deduct_amount = ?, description = ? WHERE comp_id = ?')
    .run(deduct_amount, description, comp_id)

  db.prepare(`
    INSERT INTO T_AUDIT_LOG (action, target_table, target_id, old_value, new_value, changed_by)
    VALUES ('UPDATE', 'T_COMPONENT', ?, ?, ?, 'admin')
  `).run(comp_id, JSON.stringify(old), JSON.stringify({ deduct_amount, description }))

  return NextResponse.json({ ok: true })
}
