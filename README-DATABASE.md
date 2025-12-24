# PostgreSQL 데이터베이스 설정 가이드

## 🚀 빠른 시작

### 1. 전체 시스템 시작 (처음 시작하는 경우)

```bash
# 모든 서비스 시작 (PostgreSQL, Backend, Frontend)
docker compose up -d

# 백엔드가 테이블을 생성할 때까지 대기 (약 30초)
docker compose logs -f backend

# 초기 데이터 로드
docker compose exec postgres psql -U robopilot -d robopilot -f /docker-entrypoint-initdb.d/init-data.sql
```

### 2. DB 초기화 (자동 스크립트 사용)

```bash
# 간편한 초기화 스크립트 실행
./reset-db.sh
```

이 스크립트는 자동으로:
- ✅ PostgreSQL 중지 및 볼륨 삭제
- ✅ 새로 시작하여 초기 데이터 로드
- ✅ 데이터 확인

## 📊 초기 데이터 내역

### 회사 (3개)
- **FPT Software** - 베트남 IT 서비스
- **현대중공업** - 조선/해양 플랜트
- **SK텔레콤** - 통신/ICT

### 현장 (6개)
각 회사당 2개의 현장 (하노이, 호치민, 울산, 군산, 서울, 판교)

### 드론 (8대)
- DJI Matrice 4E (3대)
- DJI Matrice 300 RTK (2대)
- DJI Mavic 3 Enterprise (1대)
- DJI Air 2S (1대)
- DJI Mini 3 Pro (1대)

### 미션 (6개)
보안 순찰, 시설 점검, 구조물 안전 점검, 환경 모니터링, 통신탑 점검, 네트워크 테스트

### 사용자 (5명)
모든 계정의 비밀번호: `password123`

| 사용자명 | 이름 | 역할 | 소속 |
|---------|------|------|------|
| admin | 시스템 관리자 | ADMIN | - |
| fpt.manager | Nguyen Van A | OPERATOR | FPT Software |
| hhi.manager | 김철수 | OPERATOR | 현대중공업 |
| skt.manager | 이민수 | OPERATOR | SK텔레콤 |
| viewer | 일반 사용자 | USER | - |

## 🔧 수동 설정

### PostgreSQL만 시작

```bash
docker compose up -d postgres
```

### 데이터베이스 접속

```bash
# psql 쉘 접속
docker compose exec postgres psql -U robopilot -d robopilot

# SQL 쿼리 실행
docker compose exec postgres psql -U robopilot -d robopilot -c "SELECT * FROM companies;"
```

### 초기 데이터 수동 로드

```bash
# 백엔드를 먼저 시작하여 테이블 생성
docker compose up -d backend

# 테이블 생성 대기 (약 30초)
sleep 30

# 초기 데이터 로드
docker compose exec -T postgres psql -U robopilot -d robopilot < docker/postgres/init-data.sql
```

## 🔄 DB 초기화 방법

### 방법 1: 자동 스크립트 (추천)

```bash
./reset-db.sh
```

### 방법 2: Docker Compose 명령어

```bash
# 완전 초기화
docker compose down -v
docker compose up -d

# PostgreSQL만 초기화
docker compose stop postgres
docker compose rm -f postgres
docker volume rm robopilot_postgres-data
docker compose up -d postgres
```

### 방법 3: 데이터만 삭제

```bash
# PostgreSQL 접속
docker compose exec postgres psql -U robopilot -d robopilot

# psql에서 실행
TRUNCATE TABLE missions CASCADE;
TRUNCATE TABLE robots CASCADE;
TRUNCATE TABLE sites CASCADE;
TRUNCATE TABLE companies CASCADE;
TRUNCATE TABLE users CASCADE;

# 초기 데이터 다시 로드
\i /docker-entrypoint-initdb.d/init-data.sql
```

## 📁 관련 파일

- `docker/postgres/init-data.sql` - 초기 데이터 SQL 스크립트
- `docker-compose.yml` - PostgreSQL 서비스 설정
- `backend/src/main/resources/application.yml` - DB 연결 설정
- `reset-db.sh` - 자동 초기화 스크립트

## 🔍 문제 해결

### PostgreSQL이 시작되지 않음

```bash
# 로그 확인
docker compose logs postgres

# 볼륨 완전 삭제 후 재시작
docker compose down -v
docker compose up -d postgres
```

### 초기 데이터가 로드되지 않음

```bash
# 백엔드가 테이블을 생성했는지 확인
docker compose exec postgres psql -U robopilot -d robopilot -c "\dt"

# 테이블이 없으면 백엔드 먼저 시작
docker compose up -d backend

# 잠시 대기 후 초기 데이터 수동 로드
sleep 30
docker compose exec -T postgres psql -U robopilot -d robopilot < docker/postgres/init-data.sql
```

### 연결 오류

```bash
# PostgreSQL 상태 확인
docker compose ps postgres

# 네트워크 확인
docker network ls | grep robopilot

# 포트 확인
netstat -an | grep 5432
```

## 🌐 외부 접속 설정

로컬 PostgreSQL 클라이언트(DBeaver, pgAdmin 등)에서 접속:

```
Host: localhost
Port: 5432
Database: robopilot
Username: robopilot
Password: robopilot
```

## 📚 유용한 쿼리

### 전체 데이터 확인

```sql
-- 회사 목록
SELECT * FROM companies;

-- 현장 목록 (회사별)
SELECT s.*, c.name as company_name
FROM sites s
JOIN companies c ON s.company_id = c.id;

-- 드론 목록 (상태별)
SELECT status, COUNT(*)
FROM robots
GROUP BY status;

-- 진행 중인 미션
SELECT * FROM missions WHERE status = 'RUNNING';

-- 사용자 목록
SELECT username, name, role, company, status FROM users;
```

### 통계 쿼리

```sql
-- 회사별 현장 및 드론 수
SELECT
    c.name as 회사명,
    COUNT(DISTINCT s.id) as 현장수,
    COUNT(DISTINCT r.id) as 드론수
FROM companies c
LEFT JOIN sites s ON c.id = s.company_id
LEFT JOIN robots r ON s.id = r.site_id
GROUP BY c.id, c.name;

-- 미션 상태별 통계
SELECT
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM missions
GROUP BY status;
```
