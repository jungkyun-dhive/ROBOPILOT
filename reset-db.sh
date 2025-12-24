#!/bin/bash

# PostgreSQL DB 초기화 스크립트
# 사용법: ./reset-db.sh

echo "======================================"
echo "PostgreSQL DB 초기화 시작"
echo "======================================"

# 현재 디렉토리 확인
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml 파일을 찾을 수 없습니다."
    echo "프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

# Docker Compose 명령어 감지 (docker-compose vs docker compose)
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Error: Docker Compose를 찾을 수 없습니다."
    echo "Docker와 Docker Compose가 설치되어 있는지 확인해주세요."
    exit 1
fi

echo "ℹ️  Docker Compose 명령어: $DOCKER_COMPOSE"

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
$DOCKER_COMPOSE stop postgres 2>/dev/null || true

# 2. PostgreSQL 볼륨 삭제
echo "2. 데이터베이스 볼륨 삭제 중..."
$DOCKER_COMPOSE rm -f postgres 2>/dev/null || true

# 볼륨 이름 찾기 및 삭제
PROJECT_NAME=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')
VOLUME_NAME="${PROJECT_NAME}_postgres-data"
docker volume rm "$VOLUME_NAME" 2>/dev/null || true
docker volume rm "robopilot_postgres-data" 2>/dev/null || true

# 3. PostgreSQL 재시작 (초기 데이터 자동 로드)
echo "3. PostgreSQL 재시작 및 초기 데이터 로드 중..."
$DOCKER_COMPOSE up -d postgres

# 컨테이너 이름 찾기
echo "4. PostgreSQL 컨테이너 확인 중..."
sleep 2
CONTAINER_NAME=$($DOCKER_COMPOSE ps -q postgres 2>/dev/null | head -1)

if [ -z "$CONTAINER_NAME" ]; then
    # ps -q가 작동하지 않으면 다른 방법 시도
    CONTAINER_NAME=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)
fi

if [ -z "$CONTAINER_NAME" ]; then
    echo "❌ Error: PostgreSQL 컨테이너를 찾을 수 없습니다."
    echo ""
    echo "수동으로 확인해보세요:"
    echo "  docker ps"
    exit 1
fi

echo "✅ 컨테이너 발견: $CONTAINER_NAME"

# 5. PostgreSQL이 준비될 때까지 대기
echo "5. PostgreSQL 준비 대기 중..."
MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker exec "$CONTAINER_NAME" pg_isready -U robopilot -d robopilot >/dev/null 2>&1; then
        echo ""
        echo "✅ PostgreSQL 준비 완료!"
        break
    fi
    echo -n "."
    sleep 1
    ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo ""
    echo "⚠️  Warning: PostgreSQL이 준비되지 않았습니다."
    echo "로그를 확인해보세요:"
    echo "  $DOCKER_COMPOSE logs postgres"
    exit 1
fi

# 6. 잠시 대기 (초기 스크립트 실행 시간)
echo "6. 초기 데이터 로딩 대기 중..."
sleep 3

# 7. 데이터 확인
echo ""
echo "7. 초기화된 데이터 확인:"
echo ""

if docker exec "$CONTAINER_NAME" psql -U robopilot -d robopilot -c "
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
" 2>/dev/null; then
    :
else
    echo "⚠️  Warning: 데이터 확인 실패. 테이블이 아직 생성되지 않았을 수 있습니다."
    echo ""
    echo "백엔드가 시작되면 자동으로 테이블이 생성됩니다:"
    echo "  $DOCKER_COMPOSE up -d backend"
    echo ""
    echo "또는 수동으로 초기 데이터를 로드하세요:"
    echo "  docker exec -i $CONTAINER_NAME psql -U robopilot -d robopilot < docker/postgres/init-data.sql"
fi

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
