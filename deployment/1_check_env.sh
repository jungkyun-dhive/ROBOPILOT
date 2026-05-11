#!/bin/bash
# ============================================================
# ROBOPILOT 서버 환경 체크 스크립트
# 실행: bash 1_check_env.sh
# ============================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC}    $1"; }
fail() { echo -e "${RED}[MISSING]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }

echo "============================================"
echo "  ROBOPILOT 서버 환경 체크"
echo "============================================"
echo ""

# OS 정보
echo "■ OS 정보"
cat /etc/os-release | grep -E "^PRETTY_NAME" | cut -d= -f2 | tr -d '"'
echo ""

# Java 17+
echo "■ Java"
if command -v java &>/dev/null; then
  VER=$(java -version 2>&1 | head -1)
  MAJOR=$(java -version 2>&1 | head -1 | sed 's/.*version "\([0-9]*\).*/\1/')
  if [ "$MAJOR" -ge 17 ] 2>/dev/null; then
    ok "Java $MAJOR 설치됨  ($VER)"
  else
    warn "Java 설치됨이나 버전 낮음 (17 이상 필요) — $VER"
  fi
else
  fail "Java 없음  →  Java 17 JDK 설치 필요"
fi

# Maven
echo ""
echo "■ Maven"
if command -v mvn &>/dev/null; then
  ok "Maven $(mvn -v 2>&1 | head -1 | awk '{print $3}')"
else
  fail "Maven 없음  →  설치 필요 (백엔드 빌드)"
fi

# Node.js 18+
echo ""
echo "■ Node.js"
if command -v node &>/dev/null; then
  NVER=$(node -v | tr -d 'v')
  NMAJOR=$(echo $NVER | cut -d. -f1)
  if [ "$NMAJOR" -ge 18 ]; then
    ok "Node.js $NVER"
  else
    warn "Node.js $NVER 설치됨이나 버전 낮음 (18 이상 필요)"
  fi
else
  fail "Node.js 없음  →  설치 필요 (프론트엔드 빌드)"
fi

# npm
echo ""
echo "■ npm"
if command -v npm &>/dev/null; then
  ok "npm $(npm -v)"
else
  fail "npm 없음"
fi

# PostgreSQL
echo ""
echo "■ PostgreSQL"
if command -v psql &>/dev/null; then
  ok "PostgreSQL 클라이언트 $(psql --version | awk '{print $3}')"
else
  fail "PostgreSQL 없음  →  설치 필요"
fi
if systemctl is-active --quiet postgresql 2>/dev/null; then
  ok "PostgreSQL 서비스 실행 중"
else
  warn "PostgreSQL 서비스 중지됨 (설치 후 시작 필요)"
fi

# Nginx
echo ""
echo "■ Nginx"
if command -v nginx &>/dev/null; then
  ok "Nginx $(nginx -v 2>&1 | awk -F/ '{print $2}')"
  if systemctl is-active --quiet nginx; then
    ok "Nginx 서비스 실행 중"
  else
    warn "Nginx 설치됨이나 중지 상태"
  fi
else
  fail "Nginx 없음  →  설치 필요"
fi

# Git
echo ""
echo "■ Git"
if command -v git &>/dev/null; then
  ok "Git $(git --version | awk '{print $3}')"
else
  fail "Git 없음  →  설치 필요"
fi

# 포트 확인
echo ""
echo "■ 포트 사용 현황"
for PORT in 80 443 8080 5432; do
  if ss -tlnp 2>/dev/null | grep -q ":$PORT "; then
    warn "포트 $PORT 이미 사용 중"
  else
    ok "포트 $PORT 사용 가능"
  fi
done

# 디스크 / 메모리
echo ""
echo "■ 리소스"
df -h / | awk 'NR==2 {printf "디스크: 사용 %s / 전체 %s (여유 %s)\n", $3, $2, $4}'
free -h | awk 'NR==2 {printf "메모리: 사용 %s / 전체 %s\n", $3, $2}'

echo ""
echo "============================================"
echo "체크 완료. MISSING/WARN 항목을 2_install.sh 로 설치하세요."
echo "============================================"
