import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { QuoteRequest, QuoteResult, Component } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body: QuoteRequest = await req.json()
  const { product_id, grade, selected_component_ids } = body

  const [product] = await sql`
    SELECT * FROM T_PRODUCT WHERE product_id = ${product_id} AND is_active = 1
  `
  if (!product) return NextResponse.json({ error: '해당 제품을 찾을 수 없습니다.' }, { status: 404 })

  const [rule] = await sql`
    SELECT * FROM T_PRICING_RULE
    WHERE product_id = ${product_id} AND grade = ${grade}
      AND (valid_from IS NULL OR valid_from <= CURRENT_DATE::text)
      AND (valid_to   IS NULL OR valid_to   >= CURRENT_DATE::text)
    ORDER BY updated_at DESC LIMIT 1
  ` as { base_price: number }[] | undefined[]

  if (!rule) return NextResponse.json({ error: '해당 등급의 가격 정보가 없습니다.' }, { status: 404 })

  const allComponents = await sql`
    SELECT * FROM T_COMPONENT
    WHERE product_id IS NULL OR product_id = ${product_id}
    ORDER BY deduct_amount DESC
  ` as unknown as Component[]

  const deductions = allComponents.map(comp => ({
    comp,
    selected: selected_component_ids.includes(comp.comp_id),
  }))

  const total_deduction = deductions
    .filter(d => d.selected)
    .reduce((s, d) => s + d.comp.deduct_amount, 0)

  const final_price = Math.max(0, (rule as { base_price: number }).base_price - total_deduction)

  const result: QuoteResult = {
    product: product as never,
    grade,
    base_price: (rule as { base_price: number }).base_price,
    deductions,
    total_deduction,
    final_price,
  }

  return NextResponse.json(result)
}
