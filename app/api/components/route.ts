import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('product_id')

  const rows = productId
    ? await sql`
        SELECT * FROM T_COMPONENT
        WHERE product_id IS NULL OR product_id = ${Number(productId)}
        ORDER BY deduct_amount DESC
      `
    : await sql`
        SELECT * FROM T_COMPONENT
        WHERE product_id IS NULL
        ORDER BY deduct_amount DESC
      `

  return NextResponse.json(rows)
}

export async function PUT(req: NextRequest) {
  const { comp_id, deduct_amount, description } = await req.json()

  const [old] = await sql`SELECT * FROM T_COMPONENT WHERE comp_id = ${comp_id}`
  await sql`
    UPDATE T_COMPONENT
    SET deduct_amount = ${deduct_amount}, description = ${description}
    WHERE comp_id = ${comp_id}
  `
  await sql`
    INSERT INTO T_AUDIT_LOG (action, target_table, target_id, old_value, new_value, changed_by)
    VALUES ('UPDATE', 'T_COMPONENT', ${comp_id}, ${JSON.stringify(old)}, ${JSON.stringify({ deduct_amount, description })}, 'admin')
  `

  return NextResponse.json({ ok: true })
}
