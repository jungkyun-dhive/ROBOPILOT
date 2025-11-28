# ROBOPILOT

AWS 클라우드 기반 로봇 및 드론 관제 시스템

## 개요

Unitree Go2 로봇과 DJI Matrice 4E 드론을 위한 통합 관제 서비스

## 주요 기능

- 🤖 로봇 및 드론 연결 관리
- 👥 사용자 및 권한 관리
- 📹 실시간 라이브 스트리밍
- 🎥 비디오 재생 및 AI 검출
- 🚨 이상 상황 알림 (SMS/Slack)
- 📊 대시보드 및 모니터링

## 기술 스택

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router
- Axios
- WebSocket (실시간 통신)

### Backend
- Java Spring Boot 3.x
- Spring Security (인증/인가)
- Spring WebSocket (실시간)
- DynamoDB (NoSQL)
- AWS S3 (비디오 저장)

### Infrastructure
- AWS EC2 (t3.micro - Free Tier)
- AWS Lambda (Python - AI 처리)
- AWS DynamoDB
- AWS S3
- AWS IoT Core (MQTT)
- Terraform (IaC)

### DevOps
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Nginx (웹 서버)

## 프로젝트 구조

```
ROBOPILOT/
├── frontend/           # React + Tailwind CSS
├── backend/           # Spring Boot API
├── functions/         # AWS Lambda (Python)
├── infrastructure/    # Terraform IaC
├── docker/           # Docker 설정
└── docs/             # 문서
```

## AWS Free Tier 최적화

- EC2: t3.micro (1GB RAM, 2 vCPU)
- DynamoDB: 25GB 스토리지
- S3: 5GB 스토리지
- Lambda: 100만 요청/월
- 데이터 전송: 15GB/월

## 시작하기

### 사전 요구사항

- Node.js 18+
- Java 17+
- Docker & Docker Compose
- AWS CLI
- Terraform

### 로컬 개발 환경 설정

1. 저장소 클론
```bash
git clone https://github.com/jungkyun-dhive/ROBOPILOT.git
cd ROBOPILOT
```

2. Frontend 실행
```bash
cd frontend
npm install
npm run dev
```

3. Backend 실행
```bash
cd backend
./gradlew bootRun
```

4. Docker Compose 실행
```bash
docker-compose up -d
```

## 라이선스

MIT License

## 작성자

DHIVE Team
