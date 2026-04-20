import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const products = await sql`
    SELECT p.*, c.cat_name
    FROM T_PRODUCT p
    JOIN T_CATEGORY c ON p.cat_id = c.cat_id
    ORDER BY p.brand, p.model_name, p.storage
  `
  return NextResponse.json(products)
}

export async function PATCH(req: NextRequest) {
  const { product_id, is_active } = await req.json()

  const [old] = await sql`SELECT * FROM T_PRODUCT WHERE product_id = ${product_id}`
  await sql`UPDATE T_PRODUCT SET is_active = ${is_active ? 1 : 0} WHERE product_id = ${product_id}`
  await sql`
    INSERT INTO T_AUDIT_LOG (action, target_table, target_id, old_value, new_value, changed_by)
    VALUES ('UPDATE', 'T_PRODUCT', ${product_id}, ${JSON.stringify(old)}, ${JSON.stringify({ is_active })}, 'admin')
  `

  return NextResponse.json({ ok: true })
}
