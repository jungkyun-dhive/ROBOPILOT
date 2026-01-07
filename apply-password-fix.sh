#!/bin/bash

# Apply password fix for admin123 authentication issue
# This script pulls the latest code with the correct BCrypt hash and updates the database

set -e

echo "=========================================="
echo "Applying Password Authentication Fix"
echo "=========================================="
echo ""

# 1. Pull latest code
echo "1. Pulling latest code from branch..."
git pull origin claude/account-permission-restrictions-JCjnr

echo ""
echo "2. Finding containers..."
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ Error: PostgreSQL container not found"
    echo "Make sure containers are running: docker compose ps"
    exit 1
fi

echo "✅ Found PostgreSQL container: $POSTGRES_CONTAINER"

echo ""
echo "3. Updating password hashes in database..."
docker exec -i $POSTGRES_CONTAINER psql -U robopilot -d robopilot << 'EOF'
-- Update all user passwords to the correct BCrypt hash for "admin123"
UPDATE users SET password = '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW';

-- Verify the update
SELECT
    username,
    email,
    role,
    LEFT(password, 30) || '...' as password_hash
FROM users
ORDER BY role, username;
EOF

echo ""
echo "=========================================="
echo "✅ Password fix applied successfully!"
echo "=========================================="
echo ""
echo "All user accounts now use password: admin123"
echo ""
echo "Test accounts:"
echo "  - System Admin: admin@robopilot.com / admin123"
echo "  - FPT Manager: manager@fpt.com.vn / admin123"
echo "  - HHI Manager: manager@hhi.co.kr / admin123"
echo "  - SKT Manager: manager@sktelecom.com / admin123"
echo "  - Viewer: viewer@fpt.com.vn / admin123"
echo ""
echo "You can now test login at: http://13.125.59.147"
echo ""
