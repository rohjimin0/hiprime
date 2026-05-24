import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const products = await sql`
      SELECT p.*, c.cat_name
      FROM T_PRODUCT p
      JOIN T_CATEGORY c ON p.cat_id = c.cat_id
      ORDER BY p.brand, p.model_name, p.storage
    `
    return NextResponse.json(products)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { cat_id, brand, model_name, storage, color } = await req.json()
    if (!cat_id || !brand || !model_name || !storage) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
    }
    const [result] = await sql`
      INSERT INTO T_PRODUCT (cat_id, brand, model_name, storage, color, is_active)
      VALUES (${cat_id}, ${brand}, ${model_name}, ${storage}, ${color ?? null}, 1)
      RETURNING product_id
    `
    await sql`
      INSERT INTO T_AUDIT_LOG (action, target_table, target_id, new_value, changed_by)
      VALUES ('INSERT', 'T_PRODUCT', ${result.product_id},
              ${JSON.stringify({ cat_id, brand, model_name, storage })}, 'admin')
    `
    return NextResponse.json({ product_id: result.product_id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { product_id, is_active } = await req.json()

    const [old] = await sql`SELECT * FROM T_PRODUCT WHERE product_id = ${product_id}`
    await sql`UPDATE T_PRODUCT SET is_active = ${is_active ? 1 : 0} WHERE product_id = ${product_id}`
    await sql`
      INSERT INTO T_AUDIT_LOG (action, target_table, target_id, old_value, new_value, changed_by)
      VALUES ('UPDATE', 'T_PRODUCT', ${product_id}, ${JSON.stringify(old)}, ${JSON.stringify({ is_active })}, 'admin')
    `

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { product_id } = await req.json()
    const [deals] = await sql`SELECT COUNT(*) AS cnt FROM T_DEAL_REQUEST WHERE product_id = ${product_id}`
    if (Number(deals.cnt) > 0)
      return NextResponse.json({ error: '거래 내역이 있어 삭제할 수 없습니다.' }, { status: 400 })
    await sql`DELETE FROM T_PRICING_RULE WHERE product_id = ${product_id}`
    await sql`DELETE FROM T_PRODUCT WHERE product_id = ${product_id}`
    await sql`
      INSERT INTO T_AUDIT_LOG (action, target_table, target_id, changed_by)
      VALUES ('DELETE', 'T_PRODUCT', ${product_id}, 'admin')
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 })
  }
}
