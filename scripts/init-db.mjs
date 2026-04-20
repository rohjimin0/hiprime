/**
 * 최초 1회 실행: npm run db:init
 * Neon PostgreSQL 스키마 및 초기 데이터를 생성합니다.
 */
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// .env.local 수동 파싱 (dotenv 없이)
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  // .env.local 없으면 환경변수 그대로 사용
}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ .env.local 에 DATABASE_URL 을 설정해주세요.')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function main() {
  console.log('🔧 스키마 생성 중...')

  await sql`
    CREATE TABLE IF NOT EXISTS T_CATEGORY (
      cat_id     SERIAL PRIMARY KEY,
      cat_name   TEXT    NOT NULL,
      parent_id  INTEGER REFERENCES T_CATEGORY(cat_id),
      sort_order INTEGER DEFAULT 0
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS T_PRODUCT (
      product_id SERIAL PRIMARY KEY,
      cat_id     INTEGER NOT NULL REFERENCES T_CATEGORY(cat_id),
      brand      TEXT    NOT NULL,
      model_name TEXT    NOT NULL,
      storage    TEXT    NOT NULL,
      color      TEXT,
      is_active  INTEGER NOT NULL DEFAULT 1
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS T_PRICING_RULE (
      rule_id    SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES T_PRODUCT(product_id),
      grade      TEXT    NOT NULL CHECK(grade IN ('S','A','B','C')),
      base_price INTEGER NOT NULL,
      valid_from TEXT,
      valid_to   TEXT,
      updated_by TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS T_COMPONENT (
      comp_id       SERIAL PRIMARY KEY,
      product_id    INTEGER REFERENCES T_PRODUCT(product_id),
      comp_type     TEXT    NOT NULL,
      deduct_amount INTEGER NOT NULL,
      description   TEXT
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS T_DEAL_REQUEST (
      request_id          SERIAL PRIMARY KEY,
      product_id          INTEGER NOT NULL REFERENCES T_PRODUCT(product_id),
      grade               TEXT    NOT NULL,
      final_price         INTEGER NOT NULL,
      selected_components TEXT,
      contact             TEXT,
      method              TEXT    CHECK(method IN ('visit','shipping')),
      status              TEXT    DEFAULT 'pending',
      created_at          TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS T_AUDIT_LOG (
      log_id       SERIAL PRIMARY KEY,
      action       TEXT NOT NULL,
      target_table TEXT,
      target_id    INTEGER,
      old_value    TEXT,
      new_value    TEXT,
      changed_by   TEXT,
      changed_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS T_SITE_SETTINGS (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `

  console.log('✅ 스키마 생성 완료')
  console.log('🌱 초기 데이터 삽입 중...')

  const [existing] = await sql`SELECT COUNT(*) AS cnt FROM T_CATEGORY`
  if (Number(existing.cnt) > 0) {
    console.log('ℹ️  이미 데이터가 있습니다. 시드를 건너뜁니다.')
    return
  }

  // ── 대분류 (L1) ───────────────────────────────────────────────────────────
  await sql`INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('데스크탑/노트북', NULL, 1)`
  await sql`INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('컴퓨터 부품', NULL, 2)`
  await sql`INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('모니터', NULL, 3)`
  await sql`INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('노트북/태블릿', NULL, 4)`
  await sql`INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('모바일/스마트폰', NULL, 5)`

  // ── 중분류 (L2) ───────────────────────────────────────────────────────────
  const l2 = [
    ['삼성', 1, 1],['LG', 1, 2],['HP', 1, 3],['DELL', 1, 4],['ASUS', 1, 5],['애플', 1, 6],
    ['인텔 CPU', 2, 1],['AMD CPU', 2, 2],['NVIDIA VGA', 2, 3],['AMD VGA', 2, 4],['RAM', 2, 5],['SSD / HDD', 2, 6],
    ['34인치 이상 (와이드)', 3, 1],['32인치', 3, 2],['27인치', 3, 3],['24인치 이하', 3, 4],
    ['삼성', 4, 1],['LG', 4, 2],['애플', 4, 3],['Microsoft', 4, 4],
    ['애플 (iPhone)', 5, 1],['삼성 (Galaxy)', 5, 2],
  ]
  for (const [name, pid, ord] of l2) {
    await sql`INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES (${name}, ${pid}, ${ord})`
  }

  // ── 소분류 (L3) — 브랜드별 시리즈 ────────────────────────────────────────
  const l3Data = [
    ['갤럭시북', '삼성', '데스크탑/노트북', 1],['올인원 PC', '삼성', '데스크탑/노트북', 2],
    ['그램', 'LG', '데스크탑/노트북', 1],['기타 LG', 'LG', '데스크탑/노트북', 2],
    ['EliteBook', 'HP', '데스크탑/노트북', 1],['기타 HP', 'HP', '데스크탑/노트북', 2],
    ['XPS', 'DELL', '데스크탑/노트북', 1],['Inspiron', 'DELL', '데스크탑/노트북', 2],
    ['ZenBook', 'ASUS', '데스크탑/노트북', 1],['VivoBook', 'ASUS', '데스크탑/노트북', 2],
    ['맥북 프로', '애플', '데스크탑/노트북', 1],['맥북 에어', '애플', '데스크탑/노트북', 2],['맥 미니/스튜디오', '애플', '데스크탑/노트북', 3],
    ['12세대 이상 (Alder Lake+)', '인텔 CPU', '컴퓨터 부품', 1],['10~11세대', '인텔 CPU', '컴퓨터 부품', 2],['8~9세대', '인텔 CPU', '컴퓨터 부품', 3],['7세대 이하', '인텔 CPU', '컴퓨터 부품', 4],
    ['라이젠 7000 시리즈', 'AMD CPU', '컴퓨터 부품', 1],['라이젠 5000 시리즈', 'AMD CPU', '컴퓨터 부품', 2],['라이젠 3000 이하', 'AMD CPU', '컴퓨터 부품', 3],
    ['RTX 40 시리즈', 'NVIDIA VGA', '컴퓨터 부품', 1],['RTX 30 시리즈', 'NVIDIA VGA', '컴퓨터 부품', 2],['RTX 20 / GTX 1660', 'NVIDIA VGA', '컴퓨터 부품', 3],['GTX 10 시리즈 이하', 'NVIDIA VGA', '컴퓨터 부품', 4],
    ['RX 7000 시리즈', 'AMD VGA', '컴퓨터 부품', 1],['RX 6000 시리즈', 'AMD VGA', '컴퓨터 부품', 2],['RX 500 이하', 'AMD VGA', '컴퓨터 부품', 3],
    ['DDR5', 'RAM', '컴퓨터 부품', 1],['DDR4', 'RAM', '컴퓨터 부품', 2],['DDR3 이하', 'RAM', '컴퓨터 부품', 3],
    ['NVMe SSD', 'SSD / HDD', '컴퓨터 부품', 1],['SATA SSD', 'SSD / HDD', '컴퓨터 부품', 2],['HDD', 'SSD / HDD', '컴퓨터 부품', 3],
    ['갤럭시탭', '삼성', '노트북/태블릿', 1],['갤럭시북', '삼성', '노트북/태블릿', 2],
    ['그램', 'LG', '노트북/태블릿', 1],
    ['아이패드', '애플', '노트북/태블릿', 1],['맥북', '애플', '노트북/태블릿', 2],
    ['서피스 Pro', 'Microsoft', '노트북/태블릿', 1],['서피스 Laptop', 'Microsoft', '노트북/태블릿', 2],
    ['아이폰 15 시리즈', '애플 (iPhone)', '모바일/스마트폰', 1],['아이폰 14 시리즈', '애플 (iPhone)', '모바일/스마트폰', 2],['아이폰 13 시리즈', '애플 (iPhone)', '모바일/스마트폰', 3],['아이폰 12 이전', '애플 (iPhone)', '모바일/스마트폰', 4],
    ['갤럭시 S24 시리즈', '삼성 (Galaxy)', '모바일/스마트폰', 1],['갤럭시 S23 시리즈', '삼성 (Galaxy)', '모바일/스마트폰', 2],['갤럭시 Z플립 / Z폴드', '삼성 (Galaxy)', '모바일/스마트폰', 3],['갤럭시 A시리즈', '삼성 (Galaxy)', '모바일/스마트폰', 4],
  ]

  for (const [catName, parentName, grandparentName, ord] of l3Data) {
    await sql`
      INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order)
      SELECT ${catName}, c.cat_id, ${ord}
      FROM T_CATEGORY c
      JOIN T_CATEGORY gp ON c.parent_id = gp.cat_id
      WHERE c.cat_name = ${parentName} AND gp.cat_name = ${grandparentName}
      LIMIT 1
    `
  }

  // 모니터 L3 (인치 분류 하위에 브랜드별)
  const monitorSizes = ['34인치 이상 (와이드)', '32인치', '27인치', '24인치 이하']
  const monitorBrands = [['삼성', 1], ['LG', 2], ['DELL', 3], ['기타', 4]]
  for (const size of monitorSizes) {
    for (const [brand, ord] of monitorBrands) {
      await sql`
        INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order)
        SELECT ${brand}, c.cat_id, ${ord}
        FROM T_CATEGORY c
        JOIN T_CATEGORY gp ON c.parent_id = gp.cat_id
        WHERE c.cat_name = ${size} AND gp.cat_name = '모니터'
        LIMIT 1
      `
    }
  }

  // ── 상품 데이터 ───────────────────────────────────────────────────────────
  const catId = async (name, parentName) => {
    const [row] = await sql`
      SELECT c.cat_id FROM T_CATEGORY c
      JOIN T_CATEGORY p ON c.parent_id = p.cat_id
      WHERE c.cat_name = ${name} AND p.cat_name = ${parentName}
    `
    return row?.cat_id ?? null
  }

  const cat15 = await catId('아이폰 15 시리즈', '애플 (iPhone)')
  const cat14 = await catId('아이폰 14 시리즈', '애플 (iPhone)')
  const cat13 = await catId('아이폰 13 시리즈', '애플 (iPhone)')
  const catS24 = await catId('갤럭시 S24 시리즈', '삼성 (Galaxy)')
  const catS23 = await catId('갤럭시 S23 시리즈', '삼성 (Galaxy)')

  const products = [
    [cat15, 'Apple', 'iPhone 15 Pro Max', '256GB', '블랙 타이타늄'],
    [cat15, 'Apple', 'iPhone 15 Pro Max', '512GB', '블랙 타이타늄'],
    [cat15, 'Apple', 'iPhone 15 Pro',     '256GB', '블랙 타이타늄'],
    [cat15, 'Apple', 'iPhone 15',         '128GB', '블랙'],
    [cat15, 'Apple', 'iPhone 15',         '256GB', '블루'],
    [cat14, 'Apple', 'iPhone 14 Pro Max', '256GB', '스페이스 블랙'],
    [cat14, 'Apple', 'iPhone 14 Pro',     '128GB', '스페이스 블랙'],
    [cat14, 'Apple', 'iPhone 14',         '128GB', '미드나이트'],
    [cat13, 'Apple', 'iPhone 13 Pro Max', '256GB', '그래파이트'],
    [cat13, 'Apple', 'iPhone 13',         '128GB', '미드나이트'],
    [catS24, 'Samsung', 'Galaxy S24 Ultra', '256GB', '티타늄 블랙'],
    [catS24, 'Samsung', 'Galaxy S24+',      '256GB', '오닉스 블랙'],
    [catS24, 'Samsung', 'Galaxy S24',       '256GB', '오닉스 블랙'],
    [catS23, 'Samsung', 'Galaxy S23 Ultra', '256GB', '팬텀 블랙'],
  ]

  const productIds = []
  for (const [cid, brand, model, storage, color] of products) {
    const [r] = await sql`
      INSERT INTO T_PRODUCT (cat_id, brand, model_name, storage, color, is_active)
      VALUES (${cid}, ${brand}, ${model}, ${storage}, ${color}, 1)
      RETURNING product_id
    `
    productIds.push(r.product_id)
  }

  // ── 가격 데이터 ───────────────────────────────────────────────────────────
  const prices = [
    [0,'S',1350000],[0,'A',1200000],[0,'B',1000000],[0,'C',750000],
    [1,'S',1500000],[1,'A',1350000],[1,'B',1150000],[1,'C',900000],
    [2,'S',1100000],[2,'A',950000], [2,'B',800000], [2,'C',600000],
    [3,'S',800000], [3,'A',700000], [3,'B',580000], [3,'C',420000],
    [4,'S',850000], [4,'A',740000], [4,'B',620000], [4,'C',460000],
    [5,'S',950000], [5,'A',820000], [5,'B',680000], [5,'C',500000],
    [6,'S',800000], [6,'A',680000], [6,'B',560000], [6,'C',400000],
    [7,'S',600000], [7,'A',500000], [7,'B',400000], [7,'C',300000],
    [8,'S',700000], [8,'A',600000], [8,'B',480000], [8,'C',350000],
    [9,'S',620000], [9,'A',530000], [9,'B',420000], [9,'C',300000],
    [10,'S',1200000],[10,'A',1050000],[10,'B',880000],[10,'C',650000],
    [11,'S',900000], [11,'A',780000],[11,'B',640000],[11,'C',480000],
    [12,'S',700000], [12,'A',600000],[12,'B',490000],[12,'C',370000],
    [13,'S',650000], [13,'A',560000],[13,'B',450000],[13,'C',340000],
  ]
  for (const [idx, grade, price] of prices) {
    await sql`
      INSERT INTO T_PRICING_RULE (product_id, grade, base_price, updated_by)
      VALUES (${productIds[idx]}, ${grade}, ${price}, 'system')
    `
  }

  // ── 감가 항목 ─────────────────────────────────────────────────────────────
  await sql`
    INSERT INTO T_COMPONENT (product_id, comp_type, deduct_amount, description) VALUES
      (NULL, '액정 파손',   150000, '액정 파손 또는 심한 스크래치'),
      (NULL, '배터리 불량',  50000, '배터리 효율 80% 미만'),
      (NULL, '후면 파손',    80000, '후면 유리 파손'),
      (NULL, '카메라 불량', 100000, '카메라 기능 이상'),
      (NULL, '버튼 불량',    30000, '전원/볼륨 버튼 불량'),
      (NULL, '충전 불량',    30000, '충전 포트 불량'),
      (NULL, '침수 이력',   200000, '침수 이력 있음 (물 접촉)'),
      (NULL, '외관 흠집',    20000, '외관 잔흠집 다수')
  `

  // ── 사이트 기본 설정 ──────────────────────────────────────────────────────
  const defaults = {
    'header.logo': 'HiPRIME',
    'header.subtitle': '하이프라임',
    'header.nav1_label': '견적 받기',
    'header.nav1_href': '/',
    'kakao.link': 'https://pf.kakao.com/_XXXXX',
    'main.hero_image': '',
    'choose.title': '어떤 분이신가요?',
    'choose.ind.image': '',
    'choose.ind.title': '개인 고객',
    'choose.ind.desc': '내 기기 시세 바로 확인하기',
    'choose.ind.cta': '즉시 자동 견적 →',
    'choose.ent.image': '',
    'choose.ent.title': '기업 / 기관',
    'choose.ent.desc': '대량 및 서버 매각 상담 (1:1)',
    'choose.ent.cta': '전문 상담원 연결 →',
    'footer.company': '영진매입 / 씨렉스 (C-RAX)',
    'footer.address': 'Gwangjin-gu, Seoul · MVP v1.0',
    'footer.copyright': '© 2026 HiPRIME. 가격은 실제 매입 시 최종 확인됩니다.',
  }
  for (const [k, v] of Object.entries(defaults)) {
    await sql`
      INSERT INTO T_SITE_SETTINGS (key, value) VALUES (${k}, ${v})
      ON CONFLICT (key) DO NOTHING
    `
  }

  console.log('✅ 초기 데이터 삽입 완료')
  console.log('🎉 DB 초기화가 완료되었습니다!')
}

main().catch(err => {
  console.error('❌ 오류:', err)
  process.exit(1)
})
