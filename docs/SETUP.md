# ROBOPILOT 설치 가이드

## 사전 요구사항

- Node.js 18+
- Java 17+
- Maven 3.8+
- Docker & Docker Compose
- AWS CLI (선택사항)
- Terraform (선택사항)

## 로컬 개발 환경 설정

### 1. Frontend 설정

```bash
cd frontend
npm install
npm run dev
```

Frontend는 http://localhost:5173 에서 실행됩니다.

### 2. Backend 설정

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend API는 http://localhost:8080/api 에서 실행됩니다.

### 3. Docker Compose로 전체 스택 실행

```bash
docker-compose up -d
```

서비스:
- Frontend: http://localhost
- Backend: http://localhost:8080/api
- MQTT: mqtt://localhost:1883

## AWS 배포

### 1. AWS 자격증명 설정

```bash
aws configure
```

### 2. Terraform으로 인프라 생성

```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

### 3. EC2에 애플리케이션 배포

```bash
# EC2에 SSH 접속
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>

# 저장소 클론
git clone https://github.com/jungkyun-dhive/ROBOPILOT.git
cd ROBOPILOT

# Docker Compose로 실행
docker-compose up -d
```

## 환경 변수

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
# AWS
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# JWT
JWT_SECRET=your-secret-key-here

# Database
DYNAMODB_ENDPOINT=http://localhost:8000
S3_BUCKET_NAME=robopilot-videos-dev
```

## API 문서

Backend API는 다음 엔드포인트를 제공합니다:

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보

### 대시보드
- `GET /api/dashboard/stats` - 통계 데이터
- `GET /api/dashboard/health` - 서비스 상태

### 관리
- `/api/companies` - 회사 관리
- `/api/sites` - 현장 관리
- `/api/missions` - 미션 관리
- `/api/users` - 사용자 관리
- `/api/robots` - 로봇/드론 관리

## 문제 해결

### Frontend 빌드 오류
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Backend 빌드 오류
```bash
cd backend
mvn clean install -U
```

### Docker 문제
```bash
docker-compose down
docker-compose up -d --build
```

## 지원

문제가 발생하면 [GitHub Issues](https://github.com/jungkyun-dhive/ROBOPILOT/issues)에 보고해주세요.
