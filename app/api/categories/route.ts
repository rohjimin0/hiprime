import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = await getDb()
  const categories = db.prepare('SELECT * FROM T_CATEGORY ORDER BY sort_order').all()
  return NextResponse.json(categories)
}
