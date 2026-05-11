#!/bin/bash
# ============================================================
# ROBOPILOT 초기 데이터 삽입 스크립트
# 실행: sudo bash 5_init_data.sh
# 사전 조건: 4_deploy.sh 실행 후 백엔드가 기동된 상태
# 참고: ON CONFLICT DO NOTHING — 이미 있는 데이터는 건드리지 않음
# ============================================================

set -e

ENV_FILE="/etc/robopilot.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "[ERROR] $ENV_FILE 없음 → 먼저 3_setup_db.sh 를 실행하세요"
  exit 1
fi
source "$ENV_FILE"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-robopilot}"
DB_USER="${DB_USER:-robopilot}"
DB_PASSWORD="${DB_PASSWORD:-robopilot123!}"

echo "============================================"
echo "  ROBOPILOT 초기 데이터 삽입"
echo "  DB: $DB_NAME @ $DB_HOST:$DB_PORT"
echo "============================================"

# 백엔드가 테이블을 생성할 시간을 기다림
echo ""
echo "■ 백엔드 기동 대기 (테이블 생성 확인)..."
for i in $(seq 1 30); do
  TABLE_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='users');" 2>/dev/null || echo "f")
  if [ "$TABLE_EXISTS" = "t" ]; then
    echo "  ✓ users 테이블 확인됨"
    break
  fi
  echo "  대기 중... ($i/30)"
  sleep 2
done

if [ "$TABLE_EXISTS" != "t" ]; then
  echo "[ERROR] users 테이블이 없습니다. 백엔드가 정상 기동되었는지 확인하세요:"
  echo "  sudo systemctl status robopilot-backend"
  echo "  sudo journalctl -u robopilot-backend -n 50"
  exit 1
fi

# 초기 데이터 삽입
echo ""
echo "■ 샘플 데이터 삽입..."

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'SQL'

-- ── 회사 ──────────────────────────────────────────────────
INSERT INTO companies (id, name, type, site_count, robot_count, contact, email, address, created_at, updated_at)
VALUES
    ('fpt-software-001', 'FPT Software', 'IT Service', 2, 2, '+84-24-7300-8866', 'contact@fpt.com.vn',
     'FPT Tower, 10 Pham Van Bach, Cau Giay, Hanoi, Vietnam', NOW(), NOW()),
    ('hyundai-heavy-001', '현대중공업', 'Manufacturing', 2, 3, '052-202-2114', 'info@hhi.co.kr',
     '울산광역시 동구 방어진순환도로 1000', NOW(), NOW()),
    ('sk-telecom-001', 'SK텔레콤', 'Telecom', 2, 3, '02-6100-2114', 'customer@sktelecom.com',
     '서울특별시 중구 을지로 65', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ── 현장 ──────────────────────────────────────────────────
INSERT INTO sites (id, name, company_id, company_name, location, manager, contact, latitude, longitude, status, created_at, updated_at)
VALUES
    ('site-fpt-hanoi', 'FPT 하노이 본사', 'fpt-software-001', 'FPT Software',
     '하노이, 베트남', 'Nguyen Van A', 'hanoi@fpt.com.vn', 21.0285, 105.8542, 'ACTIVE', NOW(), NOW()),
    ('site-fpt-hcm', 'FPT 호치민 지사', 'fpt-software-001', 'FPT Software',
     '호치민, 베트남', 'Tran Thi B', 'hcm@fpt.com.vn', 10.7756, 106.7019, 'ACTIVE', NOW(), NOW()),
    ('site-hhi-ulsan', '울산 조선소', 'hyundai-heavy-001', '현대중공업',
     '울산광역시', '김철수', 'shipyard@hhi.co.kr', 35.5372, 129.3414, 'ACTIVE', NOW(), NOW()),
    ('site-hhi-gunsan', '군산 조선소', 'hyundai-heavy-001', '현대중공업',
     '전라북도 군산시', '박영희', 'gunsan@hhi.co.kr', 35.9784, 126.7365, 'ACTIVE', NOW(), NOW()),
    ('site-skt-ttower', 'T타워 본사', 'sk-telecom-001', 'SK텔레콤',
     '서울특별시 중구', '이민수', 'ttower@sktelecom.com', 37.5665, 126.9780, 'ACTIVE', NOW(), NOW()),
    ('site-skt-pangyo', '판교 R&D 센터', 'sk-telecom-001', 'SK텔레콤',
     '경기도 성남시', '최지영', 'pangyo@sktelecom.com', 37.3996, 127.1009, 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ── 사용자 ────────────────────────────────────────────────
-- BCrypt 해시: admin123  → $2a$10$IGOtkzW2HDzTbvTSXtBWV.02KidpAkz4W.f2PTByjCWmZkwCTdqDa
-- BCrypt 해시: operator123 → $2a$10$MmoKzDvofLvOScOvvCoL6e0EmWjMir5XKMyQ0eHc4clxryrWLs8FK
INSERT INTO users (id, username, password, name, email, role, company_id, company_name, status, created_at, updated_at)
VALUES
    ('user-admin-001', 'admin',
     '$2a$10$IGOtkzW2HDzTbvTSXtBWV.02KidpAkz4W.f2PTByjCWmZkwCTdqDa',
     '시스템 관리자', 'admin@robopilot.com', 'SYSTEM_ADMIN', NULL, NULL, 'ACTIVE', NOW(), NOW()),
    ('user-fpt-001', 'fpt.manager',
     '$2a$10$IGOtkzW2HDzTbvTSXtBWV.02KidpAkz4W.f2PTByjCWmZkwCTdqDa',
     'Nguyen Van A', 'manager@fpt.com.vn', 'COMPANY_ADMIN', 'fpt-software-001', 'FPT Software', 'ACTIVE', NOW(), NOW()),
    ('user-hhi-001', 'hhi.manager',
     '$2a$10$IGOtkzW2HDzTbvTSXtBWV.02KidpAkz4W.f2PTByjCWmZkwCTdqDa',
     '김철수', 'manager@hhi.co.kr', 'COMPANY_ADMIN', 'hyundai-heavy-001', '현대중공업', 'ACTIVE', NOW(), NOW()),
    ('user-skt-001', 'skt.manager',
     '$2a$10$IGOtkzW2HDzTbvTSXtBWV.02KidpAkz4W.f2PTByjCWmZkwCTdqDa',
     '이민수', 'manager@sktelecom.com', 'COMPANY_ADMIN', 'sk-telecom-001', 'SK텔레콤', 'ACTIVE', NOW(), NOW()),
    ('user-operator-001', 'operator',
     '$2a$10$MmoKzDvofLvOScOvvCoL6e0EmWjMir5XKMyQ0eHc4clxryrWLs8FK',
     '현장 운영자', 'operator@fpt.com.vn', 'OPERATOR', 'fpt-software-001', 'FPT Software', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Operator 현장 할당 ─────────────────────────────────────
INSERT INTO user_sites (user_id, site_id)
VALUES ('user-operator-001', 'site-fpt-hanoi')
ON CONFLICT DO NOTHING;

-- ── 결과 확인 ─────────────────────────────────────────────
SELECT '회사: ' || COUNT(*) FROM companies;
SELECT '현장: ' || COUNT(*) FROM sites;
SELECT '사용자: ' || COUNT(*) FROM users;

SQL

echo ""
echo "============================================"
echo "  초기 데이터 삽입 완료"
echo "============================================"
echo ""
echo "로그인 가능 계정:"
echo "  System Admin : admin@robopilot.com   / admin123"
echo "  Company Admin: manager@fpt.com.vn    / admin123"
echo "  Operator     : operator@fpt.com.vn  / operator123"
echo ""
