import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const rules = await sql`
    SELECT r.*, p.brand, p.model_name, p.storage
    FROM T_PRICING_RULE r
    JOIN T_PRODUCT p ON r.product_id = p.product_id
    ORDER BY p.brand, p.model_name, p.storage, r.grade
  `
  return NextResponse.json(rules)
}

export async function PUT(req: NextRequest) {
  const { rule_id, base_price, valid_from, valid_to, updated_by } = await req.json()

  const [old] = await sql`SELECT * FROM T_PRICING_RULE WHERE rule_id = ${rule_id}`
  await sql`
    UPDATE T_PRICING_RULE
    SET base_price  = ${base_price},
        valid_from  = ${valid_from ?? null},
        valid_to    = ${valid_to ?? null},
        updated_by  = ${updated_by ?? 'admin'},
        updated_at  = NOW()
    WHERE rule_id = ${rule_id}
  `
  await sql`
    INSERT INTO T_AUDIT_LOG (action, target_table, target_id, old_value, new_value, changed_by)
    VALUES ('UPDATE', 'T_PRICING_RULE', ${rule_id}, ${JSON.stringify(old)}, ${JSON.stringify({ base_price, valid_from, valid_to })}, ${updated_by ?? 'admin'})
  `

  return NextResponse.json({ ok: true })
}
