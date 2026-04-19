import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = await getDb()
  const products = db.prepare(`
    SELECT p.*, c.cat_name
    FROM T_PRODUCT p
    JOIN T_CATEGORY c ON p.cat_id = c.cat_id
    ORDER BY p.brand, p.model_name, p.storage
  `).all()
  return NextResponse.json(products)
}

export async function PATCH(req: NextRequest) {
  const db = await getDb()
  const { product_id, is_active } = await req.json()

  const old = db.prepare('SELECT * FROM T_PRODUCT WHERE product_id = ?').get(product_id)
  db.prepare('UPDATE T_PRODUCT SET is_active = ? WHERE product_id = ?').run(is_active ? 1 : 0, product_id)
  db.prepare(`
    INSERT INTO T_AUDIT_LOG (action, target_table, target_id, old_value, new_value, changed_by)
    VALUES ('UPDATE', 'T_PRODUCT', ?, ?, ?, 'admin')
  `).run(product_id, JSON.stringify(old), JSON.stringify({ is_active }))

  return NextResponse.json({ ok: true })
}
