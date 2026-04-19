import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'

export async function GET() {
  const db = await getDb()
  const rules = db.prepare(`
    SELECT p.brand, p.model_name, p.storage, r.grade, r.base_price, r.valid_from, r.valid_to
    FROM T_PRICING_RULE r
    JOIN T_PRODUCT p ON r.product_id = p.product_id
    ORDER BY p.brand, p.model_name, p.storage, r.grade
  `).all() as Record<string, unknown>[]

  const csv = stringify(rules, {
    header: true,
    columns: ['brand', 'model_name', 'storage', 'grade', 'base_price', 'valid_from', 'valid_to'],
  })

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="hiprime_pricing_${new Date().toISOString().slice(0,10)}.csv"`,
    },
  })
}

export async function POST(req: NextRequest) {
  const db = await getDb()
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'CSV 파일이 없습니다.' }, { status: 400 })

  let rows: Record<string, string>[]
  try {
    rows = parse(await file.text(), { columns: true, skip_empty_lines: true, trim: true })
  } catch {
    return NextResponse.json({ error: 'CSV 파싱 오류: 형식을 확인해주세요.' }, { status: 400 })
  }

  let updated = 0, skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    const { brand, model_name, storage, grade, base_price, valid_from, valid_to } = row
    if (!['S','A','B','C'].includes(grade)) { errors.push(`등급 오류: ${model_name} ${grade}`); skipped++; continue }
    const price = Number(base_price)
    if (isNaN(price) || price < 0)          { errors.push(`가격 오류: ${model_name} ${grade}`); skipped++; continue }

    const product = db.prepare(
      'SELECT product_id FROM T_PRODUCT WHERE brand = ? AND model_name = ? AND storage = ?'
    ).get(brand, model_name, storage) as { product_id: number } | undefined

    if (!product) { errors.push(`상품 없음: ${brand} ${model_name} ${storage}`); skipped++; continue }

    const existing = db.prepare(
      'SELECT rule_id FROM T_PRICING_RULE WHERE product_id = ? AND grade = ?'
    ).get(product.product_id, grade) as { rule_id: number } | undefined

    if (existing) {
      const old = db.prepare('SELECT * FROM T_PRICING_RULE WHERE rule_id = ?').get(existing.rule_id)
      db.prepare(`
        UPDATE T_PRICING_RULE
        SET base_price=?, valid_from=?, valid_to=?, updated_by='csv_upload', updated_at=datetime('now')
        WHERE rule_id=?
      `).run(price, valid_from || null, valid_to || null, existing.rule_id)
      db.prepare(`INSERT INTO T_AUDIT_LOG (action,target_table,target_id,old_value,new_value,changed_by) VALUES (?,?,?,?,?,?)`)
        .run('CSV_UPDATE','T_PRICING_RULE', existing.rule_id, JSON.stringify(old), JSON.stringify({ base_price: price }), 'csv_upload')
    } else {
      const res = db.prepare(`
        INSERT INTO T_PRICING_RULE (product_id, grade, base_price, valid_from, valid_to, updated_by)
        VALUES (?, ?, ?, ?, ?, 'csv_upload')
      `).run(product.product_id, grade, price, valid_from || null, valid_to || null)
      db.prepare(`INSERT INTO T_AUDIT_LOG (action,target_table,target_id,new_value,changed_by) VALUES (?,?,?,?,?)`)
        .run('CSV_INSERT','T_PRICING_RULE', res.lastInsertRowid, JSON.stringify({ grade, base_price: price }), 'csv_upload')
    }
    updated++
  }

  return NextResponse.json({ ok: true, updated, skipped, errors })
}
