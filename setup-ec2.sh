#!/bin/bash

# ROBOPILOT EC2 초기 설정 스크립트
# EC2 인스턴스에서 최초 1회만 실행

set -e

echo "======================================"
echo "ROBOPILOT EC2 초기 설정"
echo "======================================"

# 1. 필수 소프트웨어 설치 확인
echo "1. 필수 소프트웨어 확인 중..."

# Node.js 확인
if ! command -v node &> /dev/null; then
    echo "Node.js 설치 중..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 20
    nvm use 20
fi

# Java 확인
if ! command -v java &> /dev/null; then
    echo "Java 17 설치 중..."
    sudo apt update
    sudo apt install -y openjdk-17-jdk
fi

# Maven 확인
if ! command -v mvn &> /dev/null; then
    echo "Maven 설치 중..."
    sudo apt install -y maven
fi

# Nginx 확인
if ! command -v nginx &> /dev/null; then
    echo "Nginx 설치 중..."
    sudo apt install -y nginx
fi

echo "✓ 모든 필수 소프트웨어가 설치되어 있습니다."

# 2. 디렉토리 생성
echo "2. 배포 디렉토리 생성 중..."
sudo mkdir -p /opt/robopilot
sudo mkdir -p /var/www/robopilot
sudo chown -R ec2-user:ec2-user /opt/robopilot
sudo chown -R ec2-user:ec2-user /var/www/robopilot

# 3. Nginx 설정
echo "3. Nginx 설정 중..."
sudo cp deployment/nginx.conf /etc/nginx/sites-available/robopilot
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/robopilot /etc/nginx/sites-enabled/

# Nginx 설정 테스트
if sudo nginx -t; then
    echo "✓ Nginx 설정이 올바릅니다."
else
    echo "✗ Nginx 설정 오류!"
    exit 1
fi

# 4. Systemd 서비스 설정
echo "4. Backend 서비스 설정 중..."
sudo cp deployment/robopilot-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable robopilot-backend

# 5. 방화벽 설정 (필요시)
echo "5. 방화벽 설정..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 80/tcp
    sudo ufw allow 8080/tcp
    sudo ufw allow 22/tcp
    sudo ufw allow 1883/tcp
    echo "✓ 방화벽 규칙 추가됨"
fi

# 6. 배포 스크립트 실행 권한
echo "6. 배포 스크립트 권한 설정..."
chmod +x deploy.sh

echo "======================================"
echo "초기 설정 완료!"
echo "======================================"
echo ""
echo "다음 단계:"
echo "1. 첫 배포: ./deploy.sh"
echo "2. 서비스 확인: sudo systemctl status robopilot-backend"
echo "3. 브라우저 접속: http://13.125.59.147"
echo ""
echo "개발 모드로 시작하려면:"
echo "  Frontend: cd frontend && npm run dev"
echo "  Backend: cd backend && ./mvnw spring-boot:run"
