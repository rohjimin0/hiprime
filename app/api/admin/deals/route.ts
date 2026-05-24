import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500)

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
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { request_id, status, memo } = await req.json()
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태값' }, { status: 400 })
    }

    const [old] = await sql`SELECT * FROM T_DEAL_REQUEST WHERE request_id = ${request_id}`
    if (!old) return NextResponse.json({ error: '거래를 찾을 수 없습니다.' }, { status: 404 })

    await sql`
      UPDATE T_DEAL_REQUEST
      SET status = ${status}
      WHERE request_id = ${request_id}
    `
    await sql`
      INSERT INTO T_AUDIT_LOG (action, target_table, target_id, old_value, new_value, changed_by)
      VALUES ('UPDATE', 'T_DEAL_REQUEST', ${request_id},
              ${JSON.stringify({ status: old.status })},
              ${JSON.stringify({ status, memo })}, 'admin')
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 })
  }
}
