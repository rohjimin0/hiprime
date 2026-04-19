# HiPRIME 하이프라임 매입 플랫폼

> 가장 간단하게, 가장 확실하게. 오늘 바로, 최고가로.

MVP v1.0 — 스마트폰 매입 전용 (개인 거래)

---

## 실행 방법

### 1. 사전 준비
- [Node.js 18+](https://nodejs.org) 설치 필요

### 2. 패키지 설치
```bash
cd hiprime
npm install
```

### 3. 개발 서버 시작
```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

---

## 페이지 구조

| URL | 설명 |
|-----|------|
| `/` | 메인 — 모델/등급 선택 (견적 위젯) |
| `/diagnose` | Step 2 — 상태 진단 체크리스트 |
| `/quote` | Step 3 — 즉시 견적 + 감가 내역 |
| `/deal` | Step 4 — 거래 신청 (방문/택배) |
| `/admin` | 관리자 대시보드 |
| `/admin/products` | 모델 활성/비활성 토글 |
| `/admin/pricing` | 가격표 CSV 업로드/수정 |
| `/admin/deals` | 거래 내역 조회 + CSV 내보내기 |
| `/admin/logs` | 수정 이력 (Audit Log) |

---

## DB 테이블 (SQLite, `data/hiprime.db`)

| 테이블 | 역할 |
|--------|------|
| `T_CATEGORY` | 카테고리 계층 (스마트폰 › iPhone/Galaxy) |
| `T_PRODUCT` | 매입 모델 목록 + 활성 여부 |
| `T_PRICING_RULE` | 등급별 기준 매입가 (S/A/B/C) |
| `T_COMPONENT` | 감가 항목 (액정파손, 배터리불량 등) |
| `T_DEAL_REQUEST` | 견적 신청 내역 |
| `T_AUDIT_LOG` | 수정 이력 로그 |

---

## CSV 가격표 업로드 형식

```csv
brand,model_name,storage,grade,base_price,valid_from,valid_to
Apple,iPhone 15 Pro Max,256GB,S,1350000,,
Apple,iPhone 15 Pro Max,256GB,A,1200000,,
Samsung,Galaxy S24 Ultra,256GB,S,1200000,2026-01-01,2026-12-31
```

- `valid_from` / `valid_to` 는 선택 사항
- 상품이 DB에 없으면 해당 행 건너뜀 (오류 응답에 목록 표시)
- 기존 가격 존재 시 업데이트, 없으면 신규 삽입

---

## 로드맵 (착수보고서 기준)

| Phase | 기간 | 내용 |
|-------|------|------|
| **Phase 1** (현재) | 1~2개월 | 스마트폰 MVP — iPhone 위주, 견적 위젯 + 가격 DB + 관리자 CSV |
| Phase 2 | +2개월 | 태블릿/iPad 추가, 챗봇 연동 |
| Phase 3 | +3개월 | MacBook/PC 부품, 기업 거래 모듈 |
| Phase 4 | 미정 | 자동차 매입 — 별도 법인/파트너십 방식 |
