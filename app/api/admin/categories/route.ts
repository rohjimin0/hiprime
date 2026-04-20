import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const rows = await sql`
    SELECT * FROM T_CATEGORY
    ORDER BY parent_id ASC NULLS FIRST, sort_order ASC
  `
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const { cat_name, parent_id, sort_order } = await req.json()
  const [result] = await sql`
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order)
    VALUES (${cat_name}, ${parent_id ?? null}, ${sort_order ?? 0})
    RETURNING cat_id
  `
  return NextResponse.json({ cat_id: result.cat_id })
}

export async function PUT(req: Request) {
  const { cat_id, cat_name, sort_order } = await req.json()
  await sql`
    UPDATE T_CATEGORY
    SET cat_name = ${cat_name}, sort_order = ${sort_order ?? 0}
    WHERE cat_id = ${cat_id}
  `
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { cat_id } = await req.json()

  const [children] = await sql`SELECT COUNT(*) AS cnt FROM T_CATEGORY WHERE parent_id = ${cat_id}`
  if (Number(children.cnt) > 0)
    return NextResponse.json({ error: '하위 카테고리가 있어 삭제할 수 없습니다.' }, { status: 400 })

  const [products] = await sql`SELECT COUNT(*) AS cnt FROM T_PRODUCT WHERE cat_id = ${cat_id}`
  if (Number(products.cnt) > 0)
    return NextResponse.json({ error: '연결된 상품이 있어 삭제할 수 없습니다.' }, { status: 400 })

  await sql`DELETE FROM T_CATEGORY WHERE cat_id = ${cat_id}`
  return NextResponse.json({ ok: true })
}
