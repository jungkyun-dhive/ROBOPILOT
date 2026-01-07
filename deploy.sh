#!/bin/bash

# ROBOPILOT 배포 스크립트 (Docker Compose + Nginx)
# EC2 인스턴스에서 실행

set -e

echo "======================================"
echo "ROBOPILOT 배포 시작"
echo "======================================"

# 1. 저장소 업데이트
echo "1. Git 저장소 업데이트..."
cd /home/ec2-user/ROBOPILOT
CURRENT_BRANCH=$(git branch --show-current)
echo "현재 브랜치: $CURRENT_BRANCH"
git pull origin $CURRENT_BRANCH

# 2. Frontend 빌드
echo "2. Frontend 빌드 중..."
cd frontend
npm install
npm run build
cd ..

# 3. Nginx 설정 업데이트
echo "3. Nginx 설정 업데이트..."
sudo cp deployment/nginx.conf /etc/nginx/conf.d/robopilot.conf

# 4. Docker Compose로 백엔드 및 PostgreSQL 재시작
echo "4. Docker 서비스 재시작..."
sudo docker-compose down

echo "4-1. 백엔드 이미지 빌드..."
cd backend
sudo docker build -t robopilot-backend .
cd ..

echo "4-2. 컨테이너 시작..."
sudo docker-compose up -d

# 5. Nginx 재시작
echo "5. Nginx 재시작..."
sudo systemctl reload nginx

# 6. 서비스 상태 확인
echo "6. 서비스 상태 확인..."
echo ""
echo "Docker 컨테이너 상태:"
sudo docker-compose ps

echo ""
echo "Nginx 상태:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "백엔드 로그 (최근 20줄):"
sudo docker-compose logs --tail=20 backend

echo "======================================"
echo "배포 완료!"
echo "Frontend: http://13.125.59.147 (Nginx 정적 파일)"
echo "Backend API: http://13.125.59.147/api (Docker)"
echo "======================================"
echo ""
echo "로그 확인: sudo docker-compose logs -f backend"
echo "======================================"
