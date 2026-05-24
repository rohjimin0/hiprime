import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// 공개: 견적 요청 제출 (GET 제거 — 거래내역 조회는 /api/admin/deals 사용)
export async function POST(req: NextRequest) {
  try {
    const { product_id, grade, final_price, selected_components, contact, method } = await req.json()
    if (!product_id || !grade || final_price === undefined) {
      return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 })
    }
    const [result] = await sql`
      INSERT INTO T_DEAL_REQUEST
        (product_id, grade, final_price, selected_components, contact, method)
      VALUES (${product_id}, ${grade}, ${final_price},
              ${JSON.stringify(selected_components ?? [])}, ${contact ?? null}, ${method ?? null})
      RETURNING request_id
    `
    return NextResponse.json({ ok: true, request_id: result.request_id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '요청 처리 실패' }, { status: 500 })
  }
}
