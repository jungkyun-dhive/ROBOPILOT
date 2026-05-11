#!/bin/bash
# ============================================================
# ROBOPILOT 필수 도구 설치 스크립트 (Ubuntu 20.04 / 22.04)
# 실행: sudo bash 2_install.sh
# ============================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo "sudo 로 실행해주세요: sudo bash 2_install.sh"
  exit 1
fi

echo "============================================"
echo "  패키지 목록 업데이트"
echo "============================================"
apt-get update -y

# ── Git ──────────────────────────────────────────────────────
echo ""
echo "■ Git 설치"
apt-get install -y git curl wget unzip

# ── Java 17 ──────────────────────────────────────────────────
echo ""
echo "■ Java 17 JDK 설치"
apt-get install -y openjdk-17-jdk
java -version
echo "JAVA_HOME 설정..."
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> /etc/profile.d/java.sh
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> /etc/profile.d/java.sh

# ── Maven ────────────────────────────────────────────────────
echo ""
echo "■ Maven 설치"
apt-get install -y maven
mvn -version

# ── Node.js 20 LTS ───────────────────────────────────────────
echo ""
echo "■ Node.js 20 LTS 설치"
if ! command -v node &>/dev/null || [ "$(node -v | cut -dv -f2 | cut -d. -f1)" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v
npm -v

# ── PostgreSQL 14 ────────────────────────────────────────────
echo ""
echo "■ PostgreSQL 설치"
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql
echo "PostgreSQL 상태:"
systemctl status postgresql --no-pager -l | head -5

# ── Nginx ────────────────────────────────────────────────────
echo ""
echo "■ Nginx 설치"
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
echo "Nginx 상태:"
systemctl status nginx --no-pager -l | head -5

echo ""
echo "============================================"
echo "  설치 완료! 버전 확인"
echo "============================================"
java -version 2>&1 | head -1
mvn -version 2>&1 | head -1
node -v
npm -v
psql --version
nginx -v 2>&1
echo ""
echo "다음 단계: bash 3_setup_db.sh"
