#!/bin/bash

# ROBOPILOT 배포 스크립트
# EC2 인스턴스에서 실행

set -e

echo "======================================"
echo "ROBOPILOT 배포 시작"
echo "======================================"

# 1. 저장소 업데이트
echo "1. Git 저장소 업데이트..."
cd /home/ec2-user/ROBOPILOT
git pull origin claude/add-emergency-stop-button-01YWYoUsmDCSMS7Szf92D72Q

# 2. Frontend 빌드
echo "2. Frontend 빌드 중..."
cd frontend
npm install
npm run build

# 3. Backend 빌드
echo "3. Backend 빌드 중..."
cd ../backend
mvn clean package -DskipTests

# 4. 기존 프로세스 중지
echo "4. 기존 서비스 중지..."
sudo systemctl stop robopilot-backend || true
sudo systemctl stop nginx || true

# 5. Frontend 배포 (Nginx)
echo "5. Frontend 배포..."
sudo rm -rf /var/www/robopilot
sudo mkdir -p /var/www/robopilot
sudo cp -r ../frontend/dist/* /var/www/robopilot/

# 6. Backend 배포
echo "6. Backend 배포..."
sudo cp target/*.jar /opt/robopilot/robopilot-backend.jar

# 7. 서비스 재시작
echo "7. 서비스 재시작..."
sudo systemctl start robopilot-backend
sudo systemctl start nginx

# 8. 상태 확인
echo "8. 서비스 상태 확인..."
sudo systemctl status robopilot-backend --no-pager
sudo systemctl status nginx --no-pager

echo "======================================"
echo "배포 완료!"
echo "Frontend: http://13.125.59.147"
echo "Backend: http://13.125.59.147:8080"
echo "======================================"
