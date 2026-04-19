import initSqlJs from 'sql.js'
import type { Database as SqlDatabase } from 'sql.js'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH  = path.join(DATA_DIR, 'hiprime.db')

// ── 싱글턴 ──────────────────────────────────────────────────────────────────
let _raw: SqlDatabase | null = null

// DB 파일로 저장
function persist(db: SqlDatabase) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()))
}

// ── Wrapper (better-sqlite3 호환 인터페이스) ────────────────────────────────
function makeWrapper(db: SqlDatabase) {
  let inTx = false

  /** SELECT → 배열 반환 */
  function queryAll(sql: string, params: unknown[]): Record<string, unknown>[] {
    const stmt = db.prepare(sql)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (params.length) stmt.bind(params as any)
    const rows: Record<string, unknown>[] = []
    while (stmt.step()) rows.push(stmt.getAsObject() as Record<string, unknown>)
    stmt.free()
    return rows
  }

  /** INSERT / UPDATE / DELETE */
  function runSql(sql: string, params: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db.run(sql, params as any)
    if (!inTx) persist(db)
    const res = db.exec('SELECT last_insert_rowid() AS id')
    const lastInsertRowid = (res[0]?.values[0]?.[0] ?? 0) as number
    return { lastInsertRowid }
  }

  return {
    /** PRAGMA / DDL */
    pragma(str: string) { db.run(`PRAGMA ${str}`) },

    /** 여러 구문 실행 (스키마 초기화용) */
    exec(sql: string) {
      db.exec(sql)
      if (!inTx) persist(db)
    },

    /** prepared-statement 스타일 */
    prepare(sql: string) {
      return {
        all:  (...p: unknown[]) => queryAll(sql, p),
        get:  (...p: unknown[]) => queryAll(sql, p)[0] as Record<string, unknown> | undefined,
        run:  (...p: unknown[]) => runSql(sql, p),
      }
    },

    /** 트랜잭션 (better-sqlite3 방식: db.transaction(fn)() ) */
    transaction(fn: () => void): () => void {
      return () => {
        inTx = true
        db.run('BEGIN')
        try   { fn(); db.run('COMMIT') }
        catch (e) { db.run('ROLLBACK'); throw e }
        finally { inTx = false; persist(db) }
      }
    },
  }
}

export type Db = ReturnType<typeof makeWrapper>

// ── 공개 API ─────────────────────────────────────────────────────────────────
export async function getDb(): Promise<Db> {
  if (_raw) return makeWrapper(_raw)

  const SQL = await initSqlJs()

  _raw = fs.existsSync(DB_PATH)
    ? new SQL.Database(fs.readFileSync(DB_PATH))
    : new SQL.Database()

  const db = makeWrapper(_raw)
  db.pragma('foreign_keys = ON')
  initSchema(db)
  return db
}

// ── 스키마 ────────────────────────────────────────────────────────────────────
function initSchema(db: Db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS T_CATEGORY (
      cat_id     INTEGER PRIMARY KEY AUTOINCREMENT,
      cat_name   TEXT    NOT NULL,
      parent_id  INTEGER REFERENCES T_CATEGORY(cat_id),
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS T_PRODUCT (
      product_id INTEGER PRIMARY KEY AUTOINCREMENT,
      cat_id     INTEGER NOT NULL REFERENCES T_CATEGORY(cat_id),
      brand      TEXT    NOT NULL,
      model_name TEXT    NOT NULL,
      storage    TEXT    NOT NULL,
      color      TEXT,
      is_active  INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS T_PRICING_RULE (
      rule_id    INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES T_PRODUCT(product_id),
      grade      TEXT    NOT NULL CHECK(grade IN ('S','A','B','C')),
      base_price INTEGER NOT NULL,
      valid_from TEXT,
      valid_to   TEXT,
      updated_by TEXT,
      updated_at TEXT    DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS T_COMPONENT (
      comp_id       INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id    INTEGER REFERENCES T_PRODUCT(product_id),
      comp_type     TEXT    NOT NULL,
      deduct_amount INTEGER NOT NULL,
      description   TEXT
    );
    CREATE TABLE IF NOT EXISTS T_DEAL_REQUEST (
      request_id          INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id          INTEGER NOT NULL REFERENCES T_PRODUCT(product_id),
      grade               TEXT    NOT NULL,
      final_price         INTEGER NOT NULL,
      selected_components TEXT,
      contact             TEXT,
      method              TEXT    CHECK(method IN ('visit','shipping')),
      status              TEXT    DEFAULT 'pending',
      created_at          TEXT    DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS T_AUDIT_LOG (
      log_id       INTEGER PRIMARY KEY AUTOINCREMENT,
      action       TEXT NOT NULL,
      target_table TEXT,
      target_id    INTEGER,
      old_value    TEXT,
      new_value    TEXT,
      changed_by   TEXT,
      changed_at   TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS T_SITE_SETTINGS (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  const row = db.prepare('SELECT COUNT(*) as count FROM T_CATEGORY').get() as { count: number }
  if (row.count === 0) seedData(db)
  seedSettings(db)
}

// ── 사이트 설정 초기값 (없는 키만 삽입) ──────────────────────────────────────
function seedSettings(db: Db) {
  const defaults: Record<string, string> = {
    'header.logo':        'HiPRIME',
    'header.subtitle':    '하이프라임',
    'header.nav1_label':  '견적 받기',
    'header.nav1_href':   '/',
    'kakao.link':              'https://pf.kakao.com/_XXXXX',
    'main.hero_image':         '',
    'choose.title':            '어떤 분이신가요?',
    'choose.ind.image':        '',
    'choose.ind.title':        '개인 고객',
    'choose.ind.desc':         '내 기기 시세 바로 확인하기',
    'choose.ind.cta':          '즉시 자동 견적 →',
    'choose.ent.image':        '',
    'choose.ent.title':        '기업 / 기관',
    'choose.ent.desc':         '대량 및 서버 매각 상담 (1:1)',
    'choose.ent.cta':          '전문 상담원 연결 →',
    'footer.company':     '영진매입 / 씨렉스 (C-RAX)',
    'footer.address':     'Gwangjin-gu, Seoul · MVP v1.0',
    'footer.copyright':   '© 2026 HiPRIME. 가격은 실제 매입 시 최종 확인됩니다.',
  }
  const ins = db.prepare('INSERT OR IGNORE INTO T_SITE_SETTINGS (key, value) VALUES (?, ?)')
  for (const [k, v] of Object.entries(defaults)) ins.run(k, v)
}

// ── 초기 데이터 ───────────────────────────────────────────────────────────────
function seedData(db: Db) {
  // ── L1: 대분류 (cat_id 1~5) ─────────────────────────────────────────────────
  db.exec(`
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('데스크탑/노트북',    NULL, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('컴퓨터 부품',        NULL, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('모니터',             NULL, 3);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('노트북/태블릿',      NULL, 4);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('모바일/스마트폰',    NULL, 5);
  `)

  // ── L2: 중분류 ──────────────────────────────────────────────────────────────
  db.exec(`
    -- 데스크탑/노트북(1) 하위
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('삼성',    1, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('LG',      1, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('HP',      1, 3);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('DELL',    1, 4);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('ASUS',    1, 5);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('애플',    1, 6);
    -- 컴퓨터 부품(2) 하위
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('인텔 CPU',     2, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('AMD CPU',      2, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('NVIDIA VGA',   2, 3);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('AMD VGA',      2, 4);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('RAM',          2, 5);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('SSD / HDD',    2, 6);
    -- 모니터(3) 하위 — 인치수 우선
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('34인치 이상 (와이드)', 3, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('32인치',               3, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('27인치',               3, 3);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('24인치 이하',          3, 4);
    -- 노트북/태블릿(4) 하위
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('삼성',      4, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('LG',        4, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('애플',      4, 3);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('Microsoft', 4, 4);
    -- 모바일/스마트폰(5) 하위
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('애플 (iPhone)',   5, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('삼성 (Galaxy)',   5, 2);
  `)

  // ── L3: 소분류 ──────────────────────────────────────────────────────────────
  // cat_id 6~27 이 L2. L3 은 28번부터 시작.
  db.exec(`
    -- 데스크탑>삼성(6)
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('갤럭시북',     6, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('올인원 PC',    6, 2);
    -- 데스크탑>LG(7)
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('그램',         7, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('기타 LG',      7, 2);
    -- 데스크탑>HP(8)
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('EliteBook',    8, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('기타 HP',      8, 2);
    -- 데스크탑>DELL(9)
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('XPS',          9, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('Inspiron',     9, 2);
    -- 데스크탑>ASUS(10)
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('ZenBook',     10, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('VivoBook',    10, 2);
    -- 데스크탑>애플(11)
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('맥북 프로',   11, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('맥북 에어',   11, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('맥 미니/스튜디오', 11, 3);
    -- 인텔CPU(12)
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('12세대 이상 (Alder Lake+)', 12, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('10~11세대',   12, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('8~9세대',     12, 3);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('7세대 이하',  12, 4);
    -- AMD CPU(13)
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('라이젠 7000 시리즈', 13, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('라이젠 5000 시리즈', 13, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('라이젠 3000 이하',   13, 3);
    -- NVIDIA VGA(14)
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('RTX 40 시리즈', 14, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('RTX 30 시리즈', 14, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('RTX 20 / GTX 1660', 14, 3);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('GTX 10 시리즈 이하', 14, 4);
    -- AMD VGA(15)
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('RX 7000 시리즈', 15, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('RX 6000 시리즈', 15, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('RX 500 이하',    15, 3);
    -- RAM(16)
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('DDR5',  16, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('DDR4',  16, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('DDR3 이하', 16, 3);
    -- SSD/HDD(17)
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('NVMe SSD', 17, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('SATA SSD', 17, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('HDD',      17, 3);
    -- 모니터 L3 (브랜드)
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('삼성', 18, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('LG',   18, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('DELL', 18, 3);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('기타', 18, 4);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('삼성', 19, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('LG',   19, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('DELL', 19, 3);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('기타', 19, 4);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('삼성', 20, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('LG',   20, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('DELL', 20, 3);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('기타', 20, 4);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('삼성', 21, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('LG',   21, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('DELL', 21, 3);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('기타', 21, 4);
    -- 노트북/태블릿 L3
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('갤럭시탭',    22, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('갤럭시북',    22, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('그램',        23, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('아이패드',    24, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('맥북',        24, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('서피스 Pro',  25, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('서피스 Laptop', 25, 2);
    -- 모바일 iPhone L3 (26)
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('아이폰 15 시리즈', 26, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('아이폰 14 시리즈', 26, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('아이폰 13 시리즈', 26, 3);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('아이폰 12 이전',   26, 4);
    -- 모바일 Galaxy L3 (27)
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('갤럭시 S24 시리즈',  27, 1);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('갤럭시 S23 시리즈',  27, 2);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('갤럭시 Z플립 / Z폴드', 27, 3);
    INSERT INTO T_CATEGORY (cat_name, parent_id, sort_order) VALUES ('갤럭시 A시리즈',     27, 4);
  `)

  // ── 상품 (L3 카테고리에 연결) ────────────────────────────────────────────────
  // L3 iPhone 시리즈 cat_id: 아이폰15=89, 아이폰14=90, 아이폰13=91
  // L3 Galaxy 시리즈 cat_id: S24=93, S23=94, Z플립폴드=95, A시리즈=96
  // (L3 시작이 28이고 순서대로 증가, iPhone L3은 28+59=87번째부터)
  // SQL에서 서브쿼리로 ID를 직접 조회하는 방식 사용

  const ic = (name: string, parentName: string) => {
    const row = db.prepare(
      `SELECT c.cat_id FROM T_CATEGORY c
       JOIN T_CATEGORY p ON c.parent_id = p.cat_id
       WHERE c.cat_name = ? AND p.cat_name = ?`
    ).get(name, parentName) as { cat_id: number } | undefined
    return row?.cat_id ?? 0
  }

  const ip = db.prepare(
    'INSERT INTO T_PRODUCT (cat_id, brand, model_name, storage, color, is_active) VALUES (?, ?, ?, ?, ?, 1)'
  )

  const catIPhone15 = ic('아이폰 15 시리즈', '애플 (iPhone)')
  const catIPhone14 = ic('아이폰 14 시리즈', '애플 (iPhone)')
  const catIPhone13 = ic('아이폰 13 시리즈', '애플 (iPhone)')
  const catS24      = ic('갤럭시 S24 시리즈', '삼성 (Galaxy)')
  const catS23      = ic('갤럭시 S23 시리즈', '삼성 (Galaxy)')

  db.transaction(() => {
    ip.run(catIPhone15, 'Apple',   'iPhone 15 Pro Max', '256GB', '블랙 타이타늄')
    ip.run(catIPhone15, 'Apple',   'iPhone 15 Pro Max', '512GB', '블랙 타이타늄')
    ip.run(catIPhone15, 'Apple',   'iPhone 15 Pro',     '256GB', '블랙 타이타늄')
    ip.run(catIPhone15, 'Apple',   'iPhone 15',         '128GB', '블랙')
    ip.run(catIPhone15, 'Apple',   'iPhone 15',         '256GB', '블루')
    ip.run(catIPhone14, 'Apple',   'iPhone 14 Pro Max', '256GB', '스페이스 블랙')
    ip.run(catIPhone14, 'Apple',   'iPhone 14 Pro',     '128GB', '스페이스 블랙')
    ip.run(catIPhone14, 'Apple',   'iPhone 14',         '128GB', '미드나이트')
    ip.run(catIPhone13, 'Apple',   'iPhone 13 Pro Max', '256GB', '그래파이트')
    ip.run(catIPhone13, 'Apple',   'iPhone 13',         '128GB', '미드나이트')
    ip.run(catS24,      'Samsung', 'Galaxy S24 Ultra',  '256GB', '티타늄 블랙')
    ip.run(catS24,      'Samsung', 'Galaxy S24+',       '256GB', '오닉스 블랙')
    ip.run(catS24,      'Samsung', 'Galaxy S24',        '256GB', '오닉스 블랙')
    ip.run(catS23,      'Samsung', 'Galaxy S23 Ultra',  '256GB', '팬텀 블랙')
  })()

  const ir = db.prepare(
    `INSERT INTO T_PRICING_RULE (product_id, grade, base_price, updated_by) VALUES (?, ?, ?, 'system')`
  )
  db.transaction(() => {
    const data: [number, string, number][] = [
      [1,'S',1350000],[1,'A',1200000],[1,'B',1000000],[1,'C',750000],
      [2,'S',1500000],[2,'A',1350000],[2,'B',1150000],[2,'C',900000],
      [3,'S',1100000],[3,'A',950000], [3,'B',800000], [3,'C',600000],
      [4,'S',800000], [4,'A',700000], [4,'B',580000], [4,'C',420000],
      [5,'S',850000], [5,'A',740000], [5,'B',620000], [5,'C',460000],
      [6,'S',950000], [6,'A',820000], [6,'B',680000], [6,'C',500000],
      [7,'S',800000], [7,'A',680000], [7,'B',560000], [7,'C',400000],
      [8,'S',600000], [8,'A',500000], [8,'B',400000], [8,'C',300000],
      [9,'S',700000], [9,'A',600000], [9,'B',480000], [9,'C',350000],
      [10,'S',620000],[10,'A',530000],[10,'B',420000],[10,'C',300000],
      [11,'S',1200000],[11,'A',1050000],[11,'B',880000],[11,'C',650000],
      [12,'S',900000],[12,'A',780000],[12,'B',640000],[12,'C',480000],
      [13,'S',700000],[13,'A',600000],[13,'B',490000],[13,'C',370000],
      [14,'S',650000],[14,'A',560000],[14,'B',450000],[14,'C',340000],
    ]
    for (const [pid, grade, price] of data) ir.run(pid, grade, price)
  })()

  db.exec(`
    INSERT INTO T_COMPONENT (product_id, comp_type, deduct_amount, description) VALUES
      (NULL, '액정 파손',   150000, '액정 파손 또는 심한 스크래치'),
      (NULL, '배터리 불량',  50000, '배터리 효율 80% 미만'),
      (NULL, '후면 파손',    80000, '후면 유리 파손'),
      (NULL, '카메라 불량', 100000, '카메라 기능 이상'),
      (NULL, '버튼 불량',    30000, '전원/볼륨 버튼 불량'),
      (NULL, '충전 불량',    30000, '충전 포트 불량'),
      (NULL, '침수 이력',   200000, '침수 이력 있음 (물 접촉)'),
      (NULL, '외관 흠집',    20000, '외관 잔흠집 다수');
  `)
}
