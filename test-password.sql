-- Manual password hash test and update
-- Run this with: docker exec -i <postgres-container> psql -U robopilot -d robopilot < test-password.sql

-- First, let's see current password hashes
\echo 'Current password hashes:'
SELECT
    username,
    email,
    role,
    LEFT(password, 30) || '...' as password_hash
FROM users
ORDER BY role, username;

\echo ''
\echo 'Updating passwords to a test hash...'

-- This is a BCrypt hash for "admin123" with $2a$ prefix (Spring Security compatible)
-- Generated using: new BCryptPasswordEncoder().encode("admin123")
UPDATE users SET password = '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'
WHERE email IN (
    'admin@robopilot.com',
    'manager@fpt.com.vn',
    'manager@hhi.com',
    'manager@sktelecom.com',
    'viewer@robopilot.com'
);

\echo ''
\echo 'Updated passwords. Count:'
SELECT COUNT(*) as updated_users
FROM users
WHERE password = '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW';

\echo ''
\echo 'Verification:'
SELECT
    username,
    email,
    role,
    CASE
        WHEN password = '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW' THEN 'UPDATED'
        ELSE 'OLD'
    END as status
FROM users
ORDER BY role, username;
