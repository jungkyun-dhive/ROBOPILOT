# ROBOPILOT 아키텍처

## 시스템 개요

ROBOPILOT은 Unitree Go2 로봇과 DJI Matrice 4E 드론을 위한 클라우드 기반 관제 시스템입니다.

## 아키텍처 다이어그램

```
┌─────────────────┐
│   Frontend      │
│  React + Vite   │
│  Tailwind CSS   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│     Nginx       │
│  Reverse Proxy  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Spring │ │  MQTT  │
│  Boot  │ │Mosquitto│
└───┬────┘ └───┬────┘
    │          │
    ▼          ▼
┌─────────────────┐
│   AWS Services  │
│ - DynamoDB      │
│ - S3            │
│ - IoT Core      │
│ - Lambda        │
└─────────────────┘
```

## 컴포넌트

### Frontend
- **기술**: React 18, Vite, Tailwind CSS
- **역할**: 사용자 인터페이스
- **주요 기능**:
  - 대시보드 (통계, 실시간 모니터링)
  - 회사/현장/사이트/사용자 관리
  - 미션 관리
  - 라이브 스트리밍

### Backend
- **기술**: Spring Boot 3.x, Java 17
- **역할**: REST API, 비즈니스 로직
- **주요 기능**:
  - 인증/인가 (JWT)
  - CRUD API
  - WebSocket (실시간 통신)
  - AWS 서비스 연동

### MQTT Broker
- **기술**: Eclipse Mosquitto
- **역할**: 로봇/드론과의 실시간 통신
- **프로토콜**: MQTT over TCP/WebSocket

### Database
- **기술**: Amazon DynamoDB
- **테이블**:
  - users (사용자)
  - companies (회사)
  - sites (현장)
  - robots (로봇/드론)
  - missions (미션)

### Storage
- **기술**: Amazon S3
- **용도**: 비디오 스트림 저장, 이미지 저장

### AI Processing
- **기술**: AWS Lambda + Python
- **역할**: 비디오 분석, AI 객체 검출

## 데이터 플로우

### 1. 사용자 로그인
```
User → Frontend → Backend → JWT Token → Frontend
```

### 2. 로봇 데이터 수신
```
Robot → MQTT → Backend → DynamoDB
                      → Frontend (WebSocket)
```

### 3. 비디오 스트리밍
```
Drone → RTSP → Backend → S3
                      → Frontend (HLS/WebRTC)
```

### 4. AI 분석
```
Video → S3 → Lambda (Python) → AI Model → DynamoDB
                                        → Alert (SNS/Slack)
```

## 보안

- HTTPS/TLS 암호화
- JWT 기반 인증
- AWS IAM 역할 기반 접근 제어
- VPC 네트워크 격리
- Security Group 방화벽

## 확장성

- DynamoDB Auto Scaling
- EC2 Auto Scaling Group (추후)
- CloudFront CDN (비디오 배포)
- Lambda 자동 스케일링

## AWS Free Tier 최적화

- EC2: t3.micro (1GB RAM, 2 vCPU)
- DynamoDB: PAY_PER_REQUEST (사용량 기반)
- S3: 5GB 무료 스토리지
- Lambda: 100만 요청/월 무료
- 데이터 전송: 15GB/월 무료

## 모니터링

- CloudWatch Logs
- CloudWatch Metrics
- CloudWatch Alarms
- Application Performance Monitoring
