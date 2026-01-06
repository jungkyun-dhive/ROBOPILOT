# ROBOPILOT AWS EC2 배포 가이드

## 아키텍처

- **Frontend**: Nginx에서 정적 파일 직접 서빙
- **Backend**: Docker Compose (Spring Boot)
- **Database**: Docker Compose (PostgreSQL)
- **MQTT**: Docker Compose (Mosquitto)

## 사전 준비

### 1. EC2 인스턴스 접속
```bash
ssh -i your-key.pem ec2-user@13.125.59.147
```

### 2. 필수 소프트웨어 설치

```bash
# 시스템 업데이트
sudo yum update -y

# Node.js 20.x 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Docker 설치
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Nginx 설치
sudo yum install -y nginx
sudo systemctl enable nginx

# Git 설치 (이미 설치되어 있을 것)
sudo yum install -y git

# 재로그인하여 docker 그룹 적용
exit
# 다시 ssh 접속
```

## 배포 단계

### 1. 저장소 클론 (처음 한 번만)
```bash
cd ~
git clone https://github.com/jungkyun-dhive/ROBOPILOT.git
cd ROBOPILOT
git checkout claude/setup-postgresql-database-vrPI3
```

### 2. Nginx 설정
```bash
# Nginx 설정 파일 복사
sudo cp deployment/nginx.conf /etc/nginx/conf.d/robopilot.conf

# 기본 설정 비활성화 (충돌 방지)
sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.disabled || true

# Nginx 설정 테스트
sudo nginx -t

# Nginx 시작
sudo systemctl start nginx
```

### 3. 첫 배포
```bash
# 배포 스크립트 실행 권한 부여
chmod +x deploy.sh

# 배포 실행
./deploy.sh
```

## 배포 스크립트 (deploy.sh)

배포 스크립트는 다음 작업을 자동으로 수행합니다:

1. Git 저장소 업데이트
2. Frontend 빌드 (npm run build)
3. Nginx 설정 업데이트
4. Docker Compose로 백엔드/PostgreSQL 재시작
5. Nginx 재시작
6. 서비스 상태 확인

```bash
cd ~/ROBOPILOT
./deploy.sh
```

## 수동 배포

### Frontend 빌드 및 배포
```bash
cd ~/ROBOPILOT/frontend
npm install
npm run build

# dist 폴더가 /home/ec2-user/ROBOPILOT/frontend/dist에 생성됨
# Nginx가 직접 이 경로에서 파일을 서빙
```

### Backend 및 Database 시작
```bash
cd ~/ROBOPILOT

# 컨테이너 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f backend
```

## 서비스 관리

### Docker 컨테이너 상태 확인
```bash
cd ~/ROBOPILOT
docker-compose ps
```

### 서비스 재시작
```bash
# 백엔드만 재시작
docker-compose restart backend

# 전체 재시작
docker-compose restart

# 전체 중지 및 재시작
docker-compose down
docker-compose up -d
```

### 로그 확인
```bash
# 백엔드 로그 (실시간)
docker-compose logs -f backend

# PostgreSQL 로그
docker-compose logs -f postgres

# 최근 50줄
docker-compose logs --tail=50 backend

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Nginx 관리
```bash
# 상태 확인
sudo systemctl status nginx

# 재시작 (설정 변경 후)
sudo systemctl reload nginx

# 설정 테스트
sudo nginx -t
```

## 접속 주소

- **Frontend**: http://13.125.59.147
- **Backend API**: http://13.125.59.147/api
- **개발 서버**: http://13.125.59.147:5173 (개발 모드)

## 환경 변수 설정

docker-compose.yml 파일에서 환경 변수를 수정할 수 있습니다:

```yaml
backend:
  environment:
    - SPRING_PROFILES_ACTIVE=docker
    - AWS_REGION=ap-northeast-2
    - JWT_SECRET=your-secret-key
    - DB_HOST=postgres
    - DB_PORT=5432
    - DB_NAME=robopilot
    - DB_USER=robopilot
    - DB_PASSWORD=robopilot
```

변경 후:
```bash
docker-compose down
docker-compose up -d
```

## 보안 그룹 설정 (AWS Console)

EC2 인스턴스의 보안 그룹에서 다음 포트를 열어야 합니다:

- **80** (HTTP) - Frontend/Nginx
- **443** (HTTPS) - SSL/TLS (선택사항)
- **5173** (Vite Dev Server) - 개발 모드만
- **22** (SSH) - 관리용
- **1883** (MQTT) - 로봇/드론 통신용

## 데이터베이스 관리

### PostgreSQL 접속
```bash
# Docker 컨테이너를 통해 접속
docker-compose exec postgres psql -U robopilot -d robopilot
```

### 데이터베이스 초기화
```bash
# 초기 데이터 삽입
docker-compose exec postgres psql -U robopilot -d robopilot -f /docker-scripts/init-data.sql
```

### 데이터 백업
```bash
# 데이터베이스 덤프
docker-compose exec postgres pg_dump -U robopilot robopilot > backup.sql

# 복구
docker-compose exec -T postgres psql -U robopilot -d robopilot < backup.sql
```

## 트러블슈팅

### Frontend가 로드되지 않을 때
```bash
# 1. 빌드 파일 확인
ls -la /home/ec2-user/ROBOPILOT/frontend/dist/

# 2. Nginx 설정 확인
sudo nginx -t

# 3. Nginx 로그 확인
sudo tail -f /var/log/nginx/error.log

# 4. Nginx 재시작
sudo systemctl restart nginx
```

### Backend가 시작되지 않을 때
```bash
# 1. 컨테이너 상태 확인
docker-compose ps

# 2. 로그 확인
docker-compose logs backend

# 3. 컨테이너 재시작
docker-compose restart backend

# 4. 전체 재빌드
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

### 디스크 공간 부족 시
```bash
# Docker 시스템 정리
docker system prune -a --volumes -f

# 빌드 캐시 정리
docker builder prune -a -f

# 로그 정리
sudo journalctl --vacuum-time=1d
sudo journalctl --vacuum-size=50M

# 디스크 사용량 확인
df -h
du -h /var/lib/docker | sort -rh | head -20
```

### 포트 충돌 시
```bash
# 포트 사용 확인
sudo netstat -tulpn | grep -E '80|8080|5432|1883'

# 사용 중인 프로세스 종료
sudo lsof -ti:8080 | xargs sudo kill -9
```

## 모니터링

### 시스템 리소스 확인
```bash
# CPU/메모리 사용량
docker stats

# 디스크 사용량
df -h

# 네트워크 연결
sudo netstat -tulpn

# 컨테이너별 리소스 사용량
docker stats --no-stream
```

### 헬스 체크
```bash
# 백엔드 API 테스트
curl http://localhost:8080/actuator/health

# 프론트엔드 접근 테스트
curl -I http://localhost
```

## 성능 최적화

1. **Frontend**:
   - Gzip 압축 활성화 (Nginx 설정에 포함됨)
   - 정적 파일 캐싱 (1년)

2. **Backend**:
   - JVM 메모리 튜닝 (docker-compose.yml에서 JAVA_OPTS 설정)
   - Connection pool 설정

3. **Database**:
   - PostgreSQL 튜닝 (shared_buffers, work_mem)

4. **CDN**: CloudFront 사용 (선택사항)

## 업데이트 절차

```bash
# 1. 코드 업데이트
cd ~/ROBOPILOT
git pull origin claude/setup-postgresql-database-vrPI3

# 2. 배포 스크립트 실행
./deploy.sh

# 3. 서비스 확인
docker-compose ps
docker-compose logs --tail=50 backend
sudo systemctl status nginx
```

## 로그인 계정

시스템에 기본 제공되는 테스트 계정:

- **System Admin**: admin@robopilot.com / admin123
- **Company Admin**: manager@fpt.com.vn / admin123
- **Operator**: viewer@fpt.com.vn / operator123

## 개발 모드

### Frontend 개발 서버
```bash
cd ~/ROBOPILOT/frontend
npm install
npm run dev
# http://13.125.59.147:5173
```

### Backend 개발 서버 (로컬)
```bash
# PostgreSQL은 Docker로 실행
docker-compose up -d postgres

# Backend는 로컬에서 실행
cd ~/ROBOPILOT/backend
mvn spring-boot:run
```
