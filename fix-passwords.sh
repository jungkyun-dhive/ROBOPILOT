#!/bin/bash

# Script to fix user passwords with correct BCrypt hashes
# Run this on EC2 after deploying the updated code

set -e

echo "========================================"
echo "Password Fix Script"
echo "========================================"

# Docker Compose command detection
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Error: Docker Compose not found"
    exit 1
fi

echo "Step 1: Finding PostgreSQL container..."
CONTAINER_NAME=$($DOCKER_COMPOSE ps -q postgres 2>/dev/null | head -1)

if [ -z "$CONTAINER_NAME" ]; then
    CONTAINER_NAME=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)
fi

if [ -z "$CONTAINER_NAME" ]; then
    echo "❌ Error: PostgreSQL container not found"
    exit 1
fi

echo "✅ Found container: $CONTAINER_NAME"

echo ""
echo "Step 2: Generating correct BCrypt hash for 'admin123'..."
echo "   Using admin endpoint to generate hash..."

# Call the admin API to generate the hash
HASH_RESPONSE=$(curl -s -X POST http://localhost:8080/api/admin/generate-hash \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}')

echo "Response from server: $HASH_RESPONSE"

# Extract the hash from the JSON response
HASH=$(echo $HASH_RESPONSE | grep -o '"hash":"[^"]*"' | cut -d'"' -f4)

if [ -z "$HASH" ]; then
    echo "❌ Error: Failed to generate hash. Is the backend running?"
    echo "   Try: $DOCKER_COMPOSE logs backend"
    exit 1
fi

echo "✅ Generated hash: $HASH"

echo ""
echo "Step 3: Updating passwords in database..."

# Update all user passwords
docker exec "$CONTAINER_NAME" psql -U robopilot -d robopilot <<EOF
UPDATE users SET password = '$HASH' WHERE email IN (
    'admin@robopilot.com',
    'manager@fpt.com.vn',
    'manager@hhi.com',
    'manager@sktelecom.com',
    'viewer@robopilot.com'
);
EOF

echo ""
echo "Step 4: Verifying updates..."
COUNT=$(docker exec "$CONTAINER_NAME" psql -U robopilot -d robopilot -t -c "SELECT COUNT(*) FROM users WHERE password = '$HASH';" | tr -d ' ')

echo "✅ Updated $COUNT user passwords"

echo ""
echo "Step 5: Testing password verification..."
# The backend will verify on next login attempt
echo "   Password hash has been updated"
echo "   Test login with any of these accounts:"
echo "   - admin@robopilot.com / admin123"
echo "   - manager@fpt.com.vn / admin123"
echo "   - manager@hhi.com / admin123"
echo "   - manager@sktelecom.com / admin123"
echo "   - viewer@robopilot.com / admin123"

echo ""
echo "========================================"
echo "✅ Password fix complete!"
echo "========================================"
echo ""
echo "If login still fails, check backend logs:"
echo "  $DOCKER_COMPOSE logs -f backend"
echo ""
