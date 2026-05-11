#!/bin/bash
# ============================================================
# PostgreSQL DB 및 사용자 생성 스크립트
# 실행: sudo bash 3_setup_db.sh
# ============================================================

set -e

# ── 설정값 (필요 시 수정) ────────────────────────────────────
DB_NAME="robopilot"
DB_USER="robopilot"
DB_PASSWORD="robopilot123!"   # ← 실제 운영 시 강력한 비밀번호로 변경

echo "============================================"
echo "  PostgreSQL DB 설정"
echo "  DB: $DB_NAME  /  USER: $DB_USER"
echo "============================================"

# DB 사용자 및 데이터베이스 생성
sudo -u postgres psql <<EOF
-- 사용자 이미 있으면 비밀번호만 갱신
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    RAISE NOTICE '사용자 $DB_USER 생성됨';
  ELSE
    ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    RAISE NOTICE '사용자 $DB_USER 비밀번호 업데이트';
  END IF;
END
\$\$;

-- DB 이미 있으면 스킵
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo ""
echo "✓ DB 설정 완료"
echo ""
echo "접속 테스트:"
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "\l $DB_NAME"

echo ""
echo "■ 환경변수 파일 생성: /etc/robopilot.env"
cat > /etc/robopilot.env <<ENVEOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
ENVEOF

chmod 600 /etc/robopilot.env
echo "✓ /etc/robopilot.env 생성 (JWT_SECRET 자동 생성됨)"
echo ""
echo "⚠  AWS에서 기존 데이터를 가져오려면:"
echo "   로컬: pg_dump -h [AWS RDS 주소] -U robopilot robopilot > dump.sql"
echo "   서버: PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER $DB_NAME < dump.sql"
echo ""
echo "다음 단계: bash 4_deploy.sh"
