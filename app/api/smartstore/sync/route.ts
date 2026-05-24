import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

/**
 * 스마트스토어 연동 API
 * GET  /api/smartstore/sync — 동기화 상태 확인
 * POST /api/smartstore/sync — 수동 동기화 트리거
 *
 * 실제 스마트스토어 등록은 Python 도구(smartstore/dist)가 담당.
 * 여기서는 inventory.db → T_PRODUCT 방향 동기화를 위한 뼈대.
 */

interface SyncLog {
  synced_at: string
  products_synced: number
  status: 'ok' | 'error'
  message?: string
}

// 마지막 동기화 정보 (간단히 T_SITE_SETTINGS에 저장)
export async function GET() {
  try {
    const rows = await sql`
      SELECT value FROM T_SITE_SETTINGS WHERE key = 'smartstore.last_sync'
    ` as { value: string }[]
    const last: SyncLog | null = rows[0] ? JSON.parse(rows[0].value) : null
    return NextResponse.json({ ok: true, last_sync: last })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    // TODO: inventory.db (SQLite) → T_PRODUCT 동기화 로직
    // 현재는 뼈대만 — 실제 구현 시 아래 단계를 채울 것:
    // 1. inventory.db에서 정상 재고 품목 읽기
    // 2. T_PRODUCT와 비교하여 신규/변경 항목 upsert
    // 3. 스마트스토어 API 호출 (Python 도구 또는 직접 호출)

    const log: SyncLog = {
      synced_at: new Date().toISOString(),
      products_synced: 0,
      status: 'ok',
      message: '동기화 뼈대 — 아직 구현되지 않았습니다.',
    }

    await sql`
      INSERT INTO T_SITE_SETTINGS (key, value)
      VALUES ('smartstore.last_sync', ${JSON.stringify(log)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `

    return NextResponse.json({ ok: true, ...log })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '동기화 실패' }, { status: 500 })
  }
}
