#!/bin/bash

# PostgreSQL DB 초기화 스크립트
# 사용법: ./reset-db.sh

set -e

echo "======================================"
echo "PostgreSQL DB 초기화 시작"
echo "======================================"

# 현재 디렉토리 확인
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml 파일을 찾을 수 없습니다."
    echo "프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

# 사용자 확인
echo ""
echo "⚠️  경고: 모든 데이터베이스 데이터가 삭제됩니다!"
echo ""
read -p "계속하시겠습니까? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "취소되었습니다."
    exit 0
fi

# 1. PostgreSQL 서비스 중지
echo ""
echo "1. PostgreSQL 중지 중..."
docker-compose stop postgres

# 2. PostgreSQL 볼륨 삭제
echo "2. 데이터베이스 볼륨 삭제 중..."
docker-compose rm -f postgres
docker volume rm robopilot_postgres-data 2>/dev/null || true

# 3. PostgreSQL 재시작 (초기 데이터 자동 로드)
echo "3. PostgreSQL 재시작 및 초기 데이터 로드 중..."
docker-compose up -d postgres

# 4. PostgreSQL이 준비될 때까지 대기
echo "4. PostgreSQL 준비 대기 중..."
for i in {1..30}; do
    if docker exec robopilot-postgres-1 pg_isready -U robopilot -d robopilot >/dev/null 2>&1; then
        echo "✅ PostgreSQL 준비 완료!"
        break
    fi
    echo -n "."
    sleep 1
done

# 5. 데이터 확인
echo ""
echo "5. 초기화된 데이터 확인:"
echo ""

docker exec robopilot-postgres-1 psql -U robopilot -d robopilot -c "
SELECT
    '회사' as 구분, COUNT(*)::text as 개수 FROM companies
UNION ALL
SELECT '현장', COUNT(*)::text FROM sites
UNION ALL
SELECT '로봇', COUNT(*)::text FROM robots
UNION ALL
SELECT '미션', COUNT(*)::text FROM missions
UNION ALL
SELECT '사용자', COUNT(*)::text FROM users;
"

echo ""
echo "======================================"
echo "✅ DB 초기화 완료!"
echo "======================================"
echo ""
echo "접속 정보:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: robopilot"
echo "  User: robopilot"
echo "  Password: robopilot"
echo ""
echo "샘플 로그인 계정 (비밀번호: password123):"
echo "  - admin (관리자)"
echo "  - fpt.manager (FPT 운영자)"
echo "  - hhi.manager (현대중공업 운영자)"
echo "  - skt.manager (SK텔레콤 운영자)"
echo "  - viewer (일반 사용자)"
echo ""
