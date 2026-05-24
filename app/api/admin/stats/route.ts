import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const [stats] = await sql`
      SELECT
        (SELECT COUNT(*) FROM T_PRODUCT) AS total_products,
        (SELECT COUNT(*) FROM T_PRODUCT WHERE is_active = 1) AS active_products,
        (SELECT COUNT(*) FROM T_PRICING_RULE) AS pricing_rules,
        (SELECT COUNT(*) FROM T_DEAL_REQUEST WHERE status = 'pending') AS pending_deals,
        (SELECT COUNT(*) FROM T_DEAL_REQUEST) AS total_deals
    `
    return NextResponse.json(stats)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 })
  }
}
