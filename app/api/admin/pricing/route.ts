import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = await getDb()
  const rules = db.prepare(`
    SELECT r.*, p.brand, p.model_name, p.storage
    FROM T_PRICING_RULE r
    JOIN T_PRODUCT p ON r.product_id = p.product_id
    ORDER BY p.brand, p.model_name, p.storage, r.grade
  `).all()
  return NextResponse.json(rules)
}

export async function PUT(req: NextRequest) {
  const db = await getDb()
  const { rule_id, base_price, valid_from, valid_to, updated_by } = await req.json()

  const old = db.prepare('SELECT * FROM T_PRICING_RULE WHERE rule_id = ?').get(rule_id)
  db.prepare(`
    UPDATE T_PRICING_RULE
    SET base_price = ?, valid_from = ?, valid_to = ?, updated_by = ?, updated_at = datetime('now')
    WHERE rule_id = ?
  `).run(base_price, valid_from ?? null, valid_to ?? null, updated_by ?? 'admin', rule_id)

  db.prepare(`
    INSERT INTO T_AUDIT_LOG (action, target_table, target_id, old_value, new_value, changed_by)
    VALUES ('UPDATE', 'T_PRICING_RULE', ?, ?, ?, ?)
  `).run(rule_id, JSON.stringify(old), JSON.stringify({ base_price, valid_from, valid_to }), updated_by ?? 'admin')

  return NextResponse.json({ ok: true })
}
