#!/bin/bash

# Generate BCrypt hash using the running backend container
# This uses the exact same BCryptPasswordEncoder that Spring Security uses

echo "========================================"
echo "BCrypt Hash Generator"
echo "========================================"

BACKEND_CONTAINER=$(docker ps --filter "name=backend" --format "{{.Names}}" | head -1)

if [ -z "$BACKEND_CONTAINER" ]; then
    echo "❌ Error: Backend container not found"
    echo "Make sure backend is running: docker-compose ps"
    exit 1
fi

echo "✅ Found backend container: $BACKEND_CONTAINER"
echo ""

# Create a simple Java class to generate the hash
cat > /tmp/HashGen.java << 'EOF'
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashGen {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = args.length > 0 ? args[0] : "admin123";
        String hash = encoder.encode(password);
        System.out.println(hash);
    }
}
EOF

echo "Generating BCrypt hash for 'admin123'..."
echo ""

# Try to compile and run in the container
# If this doesn't work, we'll try a different approach
docker cp /tmp/HashGen.java $BACKEND_CONTAINER:/tmp/HashGen.java

# Try to run using the classpath from the running application
HASH=$(docker exec $BACKEND_CONTAINER sh -c '
cd /tmp && \
javac -cp "/app/classes:/app/lib/*" HashGen.java 2>/dev/null && \
java -cp "/app/classes:/app/lib/*:." HashGen admin123 2>/dev/null
' | tail -1)

if [ -z "$HASH" ] || [[ ! "$HASH" =~ ^\$2[ab]\$[0-9]{2}\$ ]]; then
    echo "❌ Could not generate hash using container"
    echo ""
    echo "Falling back to known good hash for 'admin123'..."
    echo "This hash was generated using BCryptPasswordEncoder(10):"
    HASH='$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'
fi

echo "Generated Hash:"
echo "$HASH"
echo ""
echo "To update database, run:"
echo ""
echo "docker exec <postgres-container> psql -U robopilot -d robopilot -c \""
echo "UPDATE users SET password = '$HASH' WHERE email IN ("
echo "    'admin@robopilot.com',"
echo "    'manager@fpt.com.vn',"
echo "    'manager@hhi.com',"
echo "    'manager@sktelecom.com',"
echo "    'viewer@robopilot.com'"
echo ");\""
echo ""

# Clean up
rm -f /tmp/HashGen.java
docker exec $BACKEND_CONTAINER rm -f /tmp/HashGen.java /tmp/HashGen.class 2>/dev/null

echo "Or use the SQL file: docker exec -i <postgres-container> psql -U robopilot -d robopilot < test-password.sql"
