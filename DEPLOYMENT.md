# ROBOPILOT AWS EC2 배포 가이드

## 사전 준비

### 1. EC2 인스턴스 접속
```bash
ssh -i your-key.pem ec2-user@13.125.59.147
```

### 2. 필수 소프트웨어 설치

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Node.js 20.x 설치 (이미 설치되어 있음)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Java 17 설치
sudo apt install -y openjdk-17-jdk

# Maven 설치
sudo apt install -y maven

# Nginx 설치
sudo apt install -y nginx

# Git 설치 (이미 설치되어 있을 것)
sudo apt install -y git
```

## 배포 단계

### 1. 저장소 클론 (이미 되어 있음)
```bash
cd ~
# git clone https://github.com/your-repo/ROBOPILOT.git
cd ROBOPILOT
```

### 2. 디렉토리 구조 설정
```bash
# Backend 배포 디렉토리 생성
sudo mkdir -p /opt/robopilot
sudo chown ec2-user:ec2-user /opt/robopilot

# Frontend 배포 디렉토리 생성
sudo mkdir -p /var/www/robopilot
sudo chown ec2-user:ec2-user /var/www/robopilot
```

### 3. Nginx 설정
```bash
# Nginx 설정 파일 복사
sudo cp deployment/nginx.conf /etc/nginx/sites-available/robopilot

# 기본 설정 비활성화
sudo rm -f /etc/nginx/sites-enabled/default

# ROBOPILOT 설정 활성화
sudo ln -sf /etc/nginx/sites-available/robopilot /etc/nginx/sites-enabled/

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 4. Backend Systemd 서비스 설정
```bash
# 서비스 파일 복사
sudo cp deployment/robopilot-backend.service /etc/systemd/system/

# Systemd 리로드
sudo systemctl daemon-reload

# 서비스 활성화
sudo systemctl enable robopilot-backend
```

### 5. 첫 배포
```bash
# 배포 스크립트 실행 권한 부여
chmod +x deploy.sh

# 배포 실행
./deploy.sh
```

## 개발 모드 실행 (테스트용)

### Frontend 개발 서버
```bash
cd frontend
npm install
npm run dev
# http://13.125.59.147:5173
```

### Backend 개발 서버
```bash
cd backend
./mvnw spring-boot:run
# http://13.125.59.147:8080
```

## 프로덕션 배포

### 방법 1: 배포 스크립트 사용 (권장)
```bash
cd ~/ROBOPILOT
./deploy.sh
```

### 방법 2: 수동 배포

#### Frontend 빌드 및 배포
```bash
cd ~/ROBOPILOT/frontend
npm install
npm run build
sudo rm -rf /var/www/robopilot/*
sudo cp -r dist/* /var/www/robopilot/
```

#### Backend 빌드 및 배포
```bash
cd ~/ROBOPILOT/backend
./mvnw clean package -DskipTests
sudo cp target/*.jar /opt/robopilot/robopilot-backend.jar
sudo systemctl restart robopilot-backend
```

## 서비스 관리

### 서비스 상태 확인
```bash
# Backend 상태
sudo systemctl status robopilot-backend

# Nginx 상태
sudo systemctl status nginx
```

### 서비스 재시작
```bash
# Backend 재시작
sudo systemctl restart robopilot-backend

# Nginx 재시작
sudo systemctl restart nginx
```

### 로그 확인
```bash
# Backend 로그
sudo journalctl -u robopilot-backend -f

# Nginx 액세스 로그
sudo tail -f /var/log/nginx/access.log

# Nginx 에러 로그
sudo tail -f /var/log/nginx/error.log
```

## 접속 주소

- **Frontend**: http://13.125.59.147
- **Backend API**: http://13.125.59.147:8080/api
- **개발 서버**: http://13.125.59.147:5173 (개발 모드)

## 환경 변수 설정 (필요시)

### Backend 환경 변수
`/etc/systemd/system/robopilot-backend.service` 파일에서 수정:
```ini
Environment="AWS_REGION=ap-northeast-2"
Environment="DYNAMODB_TABLE_PREFIX=robopilot"
Environment="S3_BUCKET=robopilot-videos"
Environment="JWT_SECRET=your-secret-key"
```

수정 후:
```bash
sudo systemctl daemon-reload
sudo systemctl restart robopilot-backend
```

## 보안 그룹 설정 (AWS Console)

EC2 인스턴스의 보안 그룹에서 다음 포트를 열어야 합니다:

- **80** (HTTP) - Frontend/Nginx
- **8080** (Backend API) - 선택사항, Nginx를 통해 프록시
- **5173** (Vite Dev Server) - 개발 모드만
- **22** (SSH) - 관리용
- **1883** (MQTT) - 로봇/드론 통신용

## 트러블슈팅

### Frontend가 로드되지 않을 때
```bash
# Nginx 상태 확인
sudo systemctl status nginx

# 빌드 파일 확인
ls -la /var/www/robopilot/

# Nginx 재시작
sudo systemctl restart nginx
```

### Backend가 시작되지 않을 때
```bash
# 로그 확인
sudo journalctl -u robopilot-backend -n 100

# Java 버전 확인
java -version

# 포트 사용 확인
sudo netstat -tulpn | grep 8080
```

### 메모리 부족 시 (t3.micro)
Backend 서비스 파일에 메모리 제한 추가:
```ini
Environment="JAVA_OPTS=-Xmx512m -Xms256m"
```

## CI/CD 파이프라인 (향후)

GitHub Actions를 통한 자동 배포 설정 가능:
1. GitHub에 코드 푸시
2. 자동 빌드 및 테스트
3. EC2에 자동 배포
4. 서비스 재시작

## 백업 및 복구

### 데이터 백업
```bash
# DynamoDB 백업 (AWS CLI 사용)
aws dynamodb create-backup --table-name robopilot-users --backup-name backup-$(date +%Y%m%d)

# S3 비디오 백업 (자동 버저닝 설정)
```

## 모니터링

### 시스템 리소스 확인
```bash
# CPU/메모리 사용량
htop

# 디스크 사용량
df -h

# 네트워크 연결
sudo netstat -tulpn
```

## 성능 최적화

1. **Frontend**: Gzip 압축 활성화 (Nginx)
2. **Backend**: JVM 메모리 튜닝
3. **Database**: DynamoDB 캐싱 설정
4. **CDN**: CloudFront 사용 (선택사항)

## 업데이트 절차

```bash
# 1. 코드 업데이트
cd ~/ROBOPILOT
git pull origin main

# 2. 배포 스크립트 실행
./deploy.sh

# 3. 서비스 확인
sudo systemctl status robopilot-backend
sudo systemctl status nginx
```
