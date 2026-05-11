#!/bin/bash
# ============================================================
# ROBOPILOT 빌드 및 배포 스크립트
# 실행: sudo bash 4_deploy.sh
# 사전 조건: 2_install.sh, 3_setup_db.sh 완료
# ============================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo "sudo 로 실행해주세요: sudo bash 4_deploy.sh"
  exit 1
fi

# ── 설정값 ─────────────────────────────────────────────────
APP_DIR="/opt/robopilot"
WEB_ROOT="/var/www/robopilot"
SERVICE_NAME="robopilot-backend"
JAR_NAME="robopilot-1.0.0.jar"
APP_USER="robopilot"

# 환경변수 파일 확인
ENV_FILE="/etc/robopilot.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "[ERROR] $ENV_FILE 없음 → 먼저 3_setup_db.sh 를 실행하세요"
  exit 1
fi
source "$ENV_FILE"

# ── 소스 위치 결정 ─────────────────────────────────────────
# 스크립트가 있는 디렉토리의 상위 = 프로젝트 루트로 추정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

# APP_DIR 에 이미 소스가 있으면 그대로 사용
# 없으면 스크립트 위치 기준으로 찾고, 그래도 없으면 GitHub 클론
if [ -f "$APP_DIR/backend/pom.xml" ]; then
  USE_DIR="$APP_DIR"
  NEED_CLONE=false
elif [ -f "$SOURCE_DIR/backend/pom.xml" ]; then
  USE_DIR="$SOURCE_DIR"
  NEED_CLONE=false
else
  NEED_CLONE=true
  if [ -z "$REPO_URL" ]; then
    echo ""
    read -rp "GitHub 저장소 URL (예: https://github.com/your-org/ROBOPILOT.git): " REPO_URL
  fi
  if [ -z "$REPO_URL" ]; then
    echo "[ERROR] 소스를 찾을 수 없고 저장소 URL도 없습니다."
    exit 1
  fi
  USE_DIR="$APP_DIR"
fi

echo "============================================"
echo "  ROBOPILOT 배포 시작"
echo "  소스 경로: $USE_DIR"
echo "  배포 경로: $APP_DIR"
echo "============================================"

# ── 0. 시스템 사용자 생성 ───────────────────────────────────
echo ""
echo "■ [0/6] 시스템 사용자 확인"
if ! id -u "$APP_USER" &>/dev/null; then
  useradd --system --no-create-home --shell /usr/sbin/nologin "$APP_USER"
  echo "  ✓ 시스템 사용자 '$APP_USER' 생성됨"
else
  echo "  ✓ 시스템 사용자 '$APP_USER' 이미 존재"
fi

# ── 1. 소스 가져오기 ────────────────────────────────────────
echo ""
echo "■ [1/6] 소스 코드 확인"

if [ "$NEED_CLONE" = true ]; then
  if [ -d "$APP_DIR/.git" ]; then
    echo "  기존 저장소 업데이트 (git pull)..."
    git -C "$APP_DIR" pull
  else
    echo "  저장소 클론: $REPO_URL → $APP_DIR"
    rm -rf "$APP_DIR"
    git clone "$REPO_URL" "$APP_DIR"
  fi
else
  echo "  소스 발견: $USE_DIR (클론 생략)"
  # APP_DIR 와 소스 위치가 다르면 심볼릭 링크로 연결
  if [ "$USE_DIR" != "$APP_DIR" ]; then
    mkdir -p "$(dirname "$APP_DIR")"
    ln -sfn "$USE_DIR" "$APP_DIR"
    echo "  링크 생성: $APP_DIR → $USE_DIR"
  fi
fi

# ── 2. 프론트엔드 빌드 ─────────────────────────────────────
echo ""
echo "■ [2/6] 프론트엔드 빌드"
cd "$USE_DIR/frontend"
npm ci --silent
npm run build

echo "  ✓ 빌드 완료: $USE_DIR/frontend/dist"

# ── 3. 백엔드 빌드 ─────────────────────────────────────────
echo ""
echo "■ [3/6] 백엔드 빌드 (Maven)"
cd "$USE_DIR/backend"
mvn clean package -DskipTests -q

JAR_PATH="$USE_DIR/backend/target/$JAR_NAME"
if [ ! -f "$JAR_PATH" ]; then
  # 빌드 결과 jar 자동 탐색
  JAR_PATH=$(find "$USE_DIR/backend/target" -name "*.jar" ! -name "*sources*" ! -name "*javadoc*" | head -1)
fi

if [ -z "$JAR_PATH" ] || [ ! -f "$JAR_PATH" ]; then
  echo "[ERROR] jar 파일을 찾을 수 없습니다: $USE_DIR/backend/target/"
  exit 1
fi

echo "  ✓ 빌드 완료: $JAR_PATH"

# ── 4. 파일 배포 ──────────────────────────────────────────
echo ""
echo "■ [4/6] 파일 배포"

# 백엔드 jar 복사
mkdir -p "$APP_DIR/bin"
cp "$JAR_PATH" "$APP_DIR/bin/robopilot-backend.jar"
chown -R "$APP_USER:$APP_USER" "$APP_DIR/bin" 2>/dev/null || true

# 프론트엔드 정적 파일 복사
mkdir -p "$WEB_ROOT"
rm -rf "${WEB_ROOT:?}"/*
cp -r "$USE_DIR/frontend/dist/." "$WEB_ROOT/"
echo "  ✓ 프론트엔드: $WEB_ROOT"

# ── 5. Nginx 설정 ─────────────────────────────────────────
echo ""
echo "■ [5/6] Nginx 설정"

cat > /etc/nginx/sites-available/robopilot <<NGINX
server {
    listen 80;
    server_name _;

    # 프론트엔드 정적 파일
    root $WEB_ROOT;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 백엔드 API
    location /api/ {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://localhost:8090/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 86400;
    }
}
NGINX

# 기본 사이트 비활성화, robopilot 활성화
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/robopilot /etc/nginx/sites-enabled/robopilot

nginx -t
systemctl reload nginx
echo "  ✓ Nginx 설정 완료 및 리로드"

# ── 6. systemd 서비스 설정 ─────────────────────────────────
echo ""
echo "■ [6/6] systemd 서비스 설정"

cat > /etc/systemd/system/${SERVICE_NAME}.service <<SERVICE
[Unit]
Description=ROBOPILOT Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/bin
ExecStart=/usr/bin/java -jar $APP_DIR/bin/robopilot-backend.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

# 환경변수 (DB, JWT 등)
EnvironmentFile=$ENV_FILE
Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="SERVER_PORT=8090"

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

echo "  ✓ 서비스 등록 및 시작"
sleep 2

# ── 결과 확인 ─────────────────────────────────────────────
echo ""
echo "============================================"
echo "  배포 완료 — 상태 확인"
echo "============================================"

echo ""
echo "▶ 백엔드 서비스:"
systemctl status "$SERVICE_NAME" --no-pager -l | head -8

echo ""
echo "▶ Nginx:"
systemctl status nginx --no-pager -l | head -5

# 서버 IP 확인
SERVER_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "============================================"
echo "  접속 URL: http://$SERVER_IP"
echo "  API 확인: http://$SERVER_IP/api/health"
echo "============================================"
echo ""
echo "로그 확인:"
echo "  sudo journalctl -u $SERVICE_NAME -f"
echo ""
echo "서비스 재시작:"
echo "  sudo systemctl restart $SERVICE_NAME"
