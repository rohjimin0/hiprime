import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { product_id, grade, final_price, selected_components, contact, method } = await req.json()

  const [result] = await sql`
    INSERT INTO T_DEAL_REQUEST
      (product_id, grade, final_price, selected_components, contact, method)
    VALUES (${product_id}, ${grade}, ${final_price}, ${JSON.stringify(selected_components)}, ${contact}, ${method})
    RETURNING request_id
  `

  return NextResponse.json({ ok: true, request_id: result.request_id })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = Number(searchParams.get('limit') ?? 100)

  const rows = status
    ? await sql`
        SELECT d.*, p.brand, p.model_name, p.storage
        FROM T_DEAL_REQUEST d
        JOIN T_PRODUCT p ON d.product_id = p.product_id
        WHERE d.status = ${status}
        ORDER BY d.created_at DESC LIMIT ${limit}
      `
    : await sql`
        SELECT d.*, p.brand, p.model_name, p.storage
        FROM T_DEAL_REQUEST d
        JOIN T_PRODUCT p ON d.product_id = p.product_id
        ORDER BY d.created_at DESC LIMIT ${limit}
      `

  return NextResponse.json(rows)
}
