#!/bin/bash
# ============================================================
# ROBOPILOT 서비스 유저 픽스 스크립트
# systemd 서비스 status=217/USER 에러 발생 시 실행
# 실행: sudo bash fix_service_user.sh
# ============================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo "sudo 로 실행해주세요"
  exit 1
fi

APP_USER="robopilot"
APP_DIR="/opt/robopilot"
SERVICE_NAME="robopilot-backend"

echo "■ 리눅스 유저 확인: $APP_USER"
if ! id -u "$APP_USER" &>/dev/null; then
  echo "  유저 생성 중..."
  useradd --system --no-create-home --shell /usr/sbin/nologin "$APP_USER"
  echo "  ✓ $APP_USER 유저 생성됨"
else
  echo "  ✓ 이미 존재"
fi

echo ""
echo "■ 파일 소유권 재설정: $APP_DIR/bin"
if [ -d "$APP_DIR/bin" ]; then
  chown -R "$APP_USER:$APP_USER" "$APP_DIR/bin"
  echo "  ✓ 완료"
else
  echo "  [WARN] $APP_DIR/bin 없음 → 4_deploy.sh 를 먼저 실행하세요"
fi

echo ""
echo "■ 서비스 재시작"
systemctl daemon-reload
systemctl restart "$SERVICE_NAME"

sleep 3

echo ""
echo "■ 서비스 상태:"
systemctl status "$SERVICE_NAME" --no-pager -l | head -15

echo ""
echo "로그 확인: sudo journalctl -u $SERVICE_NAME -n 30 --no-pager"
