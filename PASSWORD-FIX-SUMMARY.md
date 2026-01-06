# Password Authentication Fix Summary

## Problem Identified

The login authentication was failing with "Password verification: FAILED" in the backend logs. After investigation, we discovered:

1. **JWT Secret Key Issue**: Fixed in previous commit (e1a61a1)
   - Key was too short (160 bits), needed 256+ bits
   - Updated to 624-bit key in application.yml

2. **BCrypt Hash Mismatch**: **ROOT CAUSE**
   - The hash in init-data.sql (`$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi`) did NOT match "admin123"
   - This caused all login attempts to fail password verification

## Solution Applied

### Commit: c1ace1b - Fix BCrypt Hash

Updated `docker/postgres/init-data.sql` with the correct BCrypt hash:

**Correct Hash**: `$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW`

This hash was generated using Spring Security's `BCryptPasswordEncoder(10)` and correctly matches password "admin123".

### Files Modified

1. **docker/postgres/init-data.sql**
   - Lines 125, 129, 133, 137, 141
   - All user password hashes updated to correct value

## Role-Based Access Control (Already Implemented)

The system already has proper company-based data isolation:

### UserController.java (lines 29-40)
- ✅ SYSTEM_ADMIN: Sees all users across all companies
- ✅ COMPANY_ADMIN: Sees only users from their own company
- ✅ OPERATOR: Sees only users from their own company

### SiteController.java (lines 30-41)
- ✅ SYSTEM_ADMIN: Sees all sites across all companies
- ✅ COMPANY_ADMIN: Sees only sites from their own company
- ✅ OPERATOR: Sees only sites from their own company

### RobotController.java (lines 30-41)
- ✅ SYSTEM_ADMIN: Sees all robots across all companies
- ✅ COMPANY_ADMIN: Sees only robots from their own company
- ✅ OPERATOR: Sees only robots from their own company

### MissionController.java (lines 30-41)
- ✅ SYSTEM_ADMIN: Sees all missions across all companies
- ✅ COMPANY_ADMIN: Sees only missions from their own company
- ✅ OPERATOR: Sees only missions from their own company

## How to Apply the Fix on EC2

### Option 1: Using the Script (Recommended)

```bash
cd /home/ubuntu/ROBOPILOT
./apply-password-fix.sh
```

This script will:
1. Pull the latest code with the correct BCrypt hash
2. Update all user passwords in the database
3. Show verification of the update

### Option 2: Manual Steps

```bash
# 1. Pull latest code
git pull origin claude/account-permission-restrictions-JCjnr

# 2. Find PostgreSQL container
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)

# 3. Update passwords
docker exec -i $POSTGRES_CONTAINER psql -U robopilot -d robopilot << 'EOF'
UPDATE users SET password = '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW';
SELECT username, email, role FROM users;
EOF
```

### Option 3: Full Database Reset

```bash
./reset-db.sh
```

This will recreate the database with all sample data including the correct password hashes.

## Test Accounts

After applying the fix, you can login with these accounts:

| Role | Email | Password | Company | What They See |
|------|-------|----------|---------|---------------|
| **SYSTEM_ADMIN** | admin@robopilot.com | admin123 | N/A | ALL companies, sites, robots, missions, users |
| **COMPANY_ADMIN** | manager@fpt.com.vn | admin123 | FPT Software | Only FPT data |
| **COMPANY_ADMIN** | manager@hhi.co.kr | admin123 | 현대중공업 | Only HHI data |
| **COMPANY_ADMIN** | manager@sktelecom.com | admin123 | SK텔레콤 | Only SKT data |
| **OPERATOR** | viewer@fpt.com.vn | admin123 | FPT Software | Only FPT data |

## Testing the Fix

### 1. Test FPT Company Admin Login

```bash
curl -X POST http://13.125.59.147:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manager@fpt.com.vn","password":"admin123"}'
```

Expected: Success with JWT token

### 2. Test Company Isolation

Login as `manager@fpt.com.vn` and check users:

```bash
# Save the token from login
TOKEN="<jwt_token_from_login>"

# Get users - should only see FPT Software users
curl http://13.125.59.147:8080/api/users \
  -H "Authorization: Bearer $TOKEN"
```

Expected Response:
- Should see 2 users: `fpt.manager` and `viewer` (both from FPT Software)
- Should NOT see users from 현대중공업 or SK텔레콤
- Should NOT see system admin

### 3. Test System Admin

Login as `admin@robopilot.com`:

```bash
curl -X POST http://13.125.59.147:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@robopilot.com","password":"admin123"}'

# Get users - should see ALL users
curl http://13.125.59.147:8080/api/users \
  -H "Authorization: Bearer $TOKEN"
```

Expected Response:
- Should see all 5 users from all companies

## Backend Logs to Verify

After successful login, you should see in backend logs:

```
Login attempt for user: manager@fpt.com.vn
User search by email: Found
User found: id=user-fpt-001, email=manager@fpt.com.vn, role=COMPANY_ADMIN
Password verification: SUCCESS
Login successful for user: manager@fpt.com.vn
```

## Expected Behavior

### ✅ After Fix Applied

1. Login with any test account should succeed
2. COMPANY_ADMIN for FPT only sees FPT data (users, sites, robots, missions)
3. COMPANY_ADMIN for HHI only sees HHI data
4. COMPANY_ADMIN for SKT only sees SKT data
5. SYSTEM_ADMIN sees ALL data across all companies
6. Backend logs show "Password verification: SUCCESS"

### ❌ Before Fix

1. All logins failed with 401 Unauthorized
2. Backend logs showed "Password verification: FAILED"
3. JWT secret key error (already fixed)

## Files in This Repository

- `apply-password-fix.sh` - Script to apply the password fix
- `test-password.sql` - SQL script with correct hash
- `generate-hash.sh` - Script to generate new BCrypt hashes
- `reset-db.sh` - Script to completely reset database
- `docker/postgres/init-data.sql` - Sample data with correct hashes

## Technical Details

### BCrypt Hash Format

- Prefix: `$2a$` (Spring Security BCrypt compatible)
- Cost: 10 (default BCryptPasswordEncoder strength)
- Full hash: `$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW`

### Password Verification Flow

1. User submits email/password
2. Backend finds user by email or username
3. Uses `BCryptPasswordEncoder.matches(password, user.getPassword())`
4. If match, generates JWT token with user details
5. Returns token + user info to client

### JWT Token Contents

```json
{
  "userId": "user-fpt-001",
  "username": "fpt.manager",
  "role": "COMPANY_ADMIN",
  "companyId": "fpt-software-001",
  "exp": 1736190000
}
```

## Next Steps

1. **Apply the fix** on EC2 using `./apply-password-fix.sh`
2. **Test login** with manager@fpt.com.vn / admin123
3. **Verify company isolation** by checking /api/users, /api/sites, /api/robots, /api/missions
4. **Test System Admin** by logging in as admin@robopilot.com
5. **Deploy to production** if all tests pass

## Support

If you encounter issues:

1. Check backend logs: `docker compose logs backend -f`
2. Check database: `docker exec <postgres-container> psql -U robopilot -d robopilot -c "SELECT username, email, LEFT(password, 30) FROM users;"`
3. Verify containers running: `docker compose ps`
4. Full restart: `./deploy.sh`
