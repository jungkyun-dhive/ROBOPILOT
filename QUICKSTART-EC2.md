# Quick Start: Apply Password Fix on EC2

## 🚀 One Command Solution

SSH into your EC2 instance and run:

```bash
cd /home/ubuntu/ROBOPILOT
git pull origin claude/account-permission-restrictions-JCjnr
./apply-password-fix.sh
```

## ✅ Test Login

Open your browser and go to: **http://13.125.59.147**

### Test as FPT Company Admin
- Email: `manager@fpt.com.vn`
- Password: `admin123`
- Should see: **Only FPT Software data** (2 users, 2 sites, 2 robots, 2 missions)

### Test as System Admin
- Email: `admin@robopilot.com`
- Password: `admin123`
- Should see: **ALL data** from all companies (5 users, 6 sites, 8 robots, 6 missions)

## 🔍 What Was Fixed

1. **JWT Secret Key**: Updated to 256+ bits (commit e1a61a1)
2. **BCrypt Hash**: Fixed incorrect password hash for "admin123" (commit c1ace1b)

The incorrect hash was:
```
$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi ❌ Wrong!
```

The correct hash is:
```
$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW ✅ Correct!
```

## 📋 Role-Based Access Control (RBAC)

Already implemented and working:

| Role | Sees What |
|------|-----------|
| **SYSTEM_ADMIN** | All companies, all data |
| **COMPANY_ADMIN** | Only their company's data |
| **OPERATOR** | Only their company's data |

### Controllers with RBAC:
- ✅ `/api/users` - UserController.java:29-40
- ✅ `/api/sites` - SiteController.java:30-41
- ✅ `/api/robots` - RobotController.java:30-41
- ✅ `/api/missions` - MissionController.java:30-41

## 🧪 Test Company Isolation

```bash
# 1. Login as FPT Company Admin
TOKEN=$(curl -s -X POST http://13.125.59.147:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manager@fpt.com.vn","password":"admin123"}' \
  | jq -r '.token')

# 2. Check users (should only see FPT users)
curl -s http://13.125.59.147:8080/api/users \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.[] | {username, email, companyName}'

# Expected output: Only 2 FPT users (fpt.manager, viewer)
```

## 📊 Expected Results

### FPT Company Admin (manager@fpt.com.vn)

**Users**: 2
- fpt.manager (COMPANY_ADMIN)
- viewer (OPERATOR)

**Sites**: 2
- FPT 하노이 본사
- FPT 호치민 지사

**Robots**: 2
- Matrice-4E-HN01
- Mavic-3E-HCM01

**Missions**: 2
- 본사 건물 보안 순찰
- 지사 시설 정기 점검

### System Admin (admin@robopilot.com)

**Users**: 5 (all)
**Sites**: 6 (all)
**Robots**: 8 (all)
**Missions**: 6 (all)

## 🐛 Troubleshooting

### Backend logs show "Password verification: FAILED"
```bash
# Check current hash in database
docker exec robopilot-postgres-1 psql -U robopilot -d robopilot \
  -c "SELECT username, LEFT(password, 60) FROM users WHERE email = 'manager@fpt.com.vn';"

# If wrong, run apply-password-fix.sh again
./apply-password-fix.sh
```

### Containers not running
```bash
docker compose ps
./deploy.sh  # Full restart
```

### Git pull fails
```bash
git stash
git pull origin claude/account-permission-restrictions-JCjnr
git stash pop
```

## 📚 Documentation

See `PASSWORD-FIX-SUMMARY.md` for full technical details.

## 🎯 Summary

The issue was:
1. ❌ JWT secret key too short (160 bits) - **FIXED**
2. ❌ BCrypt hash didn't match "admin123" - **FIXED**
3. ✅ RBAC already implemented correctly

After running `apply-password-fix.sh`:
- ✅ Login works with admin123
- ✅ Company admins see only their data
- ✅ System admin sees all data
