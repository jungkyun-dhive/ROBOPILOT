-- ROBOPILOT 초기 데이터 스크립트
-- 회사, 현장, 로봇, 미션 샘플 데이터 생성

-- 1. 회사 데이터 (3개)
INSERT INTO companies (id, name, type, site_count, robot_count, contact, email, address, created_at, updated_at)
VALUES
    ('fpt-software-001', 'FPT Software', 'IT Service', 2, 2, '+84-24-7300-8866', 'contact@fpt.com.vn',
     'FPT Tower, 10 Pham Van Bach, Cau Giay, Hanoi, Vietnam', NOW(), NOW()),

    ('hyundai-heavy-001', '현대중공업', 'Manufacturing', 2, 3, '052-202-2114', 'info@hhi.co.kr',
     '울산광역시 동구 방어진순환도로 1000', NOW(), NOW()),

    ('sk-telecom-001', 'SK텔레콤', 'Telecom', 2, 3, '02-6100-2114', 'customer@sktelecom.com',
     '서울특별시 중구 을지로 65', NOW(), NOW());

-- 2. 현장 데이터 (6개)
INSERT INTO sites (id, name, company_id, company_name, location, manager, contact, latitude, longitude, status, created_at, updated_at)
VALUES
    -- FPT Software 현장
    ('site-fpt-hanoi', 'FPT 하노이 본사', 'fpt-software-001', 'FPT Software',
     '하노이, 베트남', 'Nguyen Van A', 'hanoi@fpt.com.vn', 21.0285, 105.8542, 'ACTIVE', NOW(), NOW()),

    ('site-fpt-hcm', 'FPT 호치민 지사', 'fpt-software-001', 'FPT Software',
     '호치민, 베트남', 'Tran Thi B', 'hcm@fpt.com.vn', 10.7756, 106.7019, 'ACTIVE', NOW(), NOW()),

    -- 현대중공업 현장
    ('site-hhi-ulsan', '울산 조선소', 'hyundai-heavy-001', '현대중공업',
     '울산광역시', '김철수', 'shipyard@hhi.co.kr', 35.5372, 129.3414, 'ACTIVE', NOW(), NOW()),

    ('site-hhi-gunsan', '군산 조선소', 'hyundai-heavy-001', '현대중공업',
     '전라북도 군산시', '박영희', 'gunsan@hhi.co.kr', 35.9784, 126.7365, 'ACTIVE', NOW(), NOW()),

    -- SK텔레콤 현장
    ('site-skt-ttower', 'T타워 본사', 'sk-telecom-001', 'SK텔레콤',
     '서울특별시 중구', '이민수', 'ttower@sktelecom.com', 37.5665, 126.9780, 'ACTIVE', NOW(), NOW()),

    ('site-skt-pangyo', '판교 R&D 센터', 'sk-telecom-001', 'SK텔레콤',
     '경기도 성남시', '최지영', 'pangyo@sktelecom.com', 37.3996, 127.1009, 'ACTIVE', NOW(), NOW());

-- 3. 로봇(드론) 데이터 (8개)
INSERT INTO robots (id, name, type, model, company_id, company_name, site_id, site_name, status, battery_level, latitude, longitude, altitude, speed, stream_url, last_heartbeat, created_at, updated_at)
VALUES
    -- FPT 하노이 (1대)
    ('drone-fpt-hn-01', 'Matrice-4E-HN01', 'DRONE', 'DJI_MATRICE_4E',
     'fpt-software-001', 'FPT Software', 'site-fpt-hanoi', 'FPT 하노이 본사', 'OFFLINE', 85, 21.0285, 105.8542, 0, 0,
     'rtsp://drone-hn01.fpt.local/stream', NOW(), NOW(), NOW()),

    -- FPT 호치민 (1대)
    ('drone-fpt-hcm-01', 'Mavic-3E-HCM01', 'DRONE', 'DJI_MAVIC_3E',
     'fpt-software-001', 'FPT Software', 'site-fpt-hcm', 'FPT 호치민 지사', 'OFFLINE', 92, 10.7756, 106.7019, 0, 0,
     'rtsp://drone-hcm01.fpt.local/stream', NOW(), NOW(), NOW()),

    -- 현대중공업 울산 (2대)
    ('drone-hhi-uls-01', 'Matrice-300-ULS01', 'DRONE', 'DJI_MATRICE_300',
     'hyundai-heavy-001', '현대중공업', 'site-hhi-ulsan', '울산 조선소', 'ONLINE', 78, 35.5372, 129.3414, 0, 0,
     'rtsp://drone-uls01.hhi.local/stream', NOW(), NOW(), NOW()),

    ('drone-hhi-uls-02', 'Matrice-300-ULS02', 'DRONE', 'DJI_MATRICE_300',
     'hyundai-heavy-001', '현대중공업', 'site-hhi-ulsan', '울산 조선소', 'CHARGING', 45, 35.5375, 129.3417, 0, 0,
     'rtsp://drone-uls02.hhi.local/stream', NOW(), NOW(), NOW()),

    -- 현대중공업 군산 (1대)
    ('drone-hhi-gun-01', 'Matrice-4E-GUN01', 'DRONE', 'DJI_MATRICE_4E',
     'hyundai-heavy-001', '현대중공업', 'site-hhi-gunsan', '군산 조선소', 'OFFLINE', 88, 35.9784, 126.7365, 0, 0,
     'rtsp://drone-gun01.hhi.local/stream', NOW(), NOW(), NOW()),

    -- SK텔레콤 본사 (1대)
    ('drone-skt-seo-01', 'Air-2S-SEO01', 'DRONE', 'DJI_AIR_2S',
     'sk-telecom-001', 'SK텔레콤', 'site-skt-ttower', 'T타워 본사', 'ONLINE', 95, 37.5665, 126.9780, 0, 0,
     'rtsp://drone-seo01.skt.local/stream', NOW(), NOW(), NOW()),

    -- SK텔레콤 판교 (2대)
    ('drone-skt-pan-01', 'Matrice-4E-PAN01', 'DRONE', 'DJI_MATRICE_4E',
     'sk-telecom-001', 'SK텔레콤', 'site-skt-pangyo', '판교 R&D 센터', 'ONLINE', 100, 37.3996, 127.1009, 0, 0,
     'rtsp://drone-pan01.skt.local/stream', NOW(), NOW(), NOW()),

    ('drone-skt-pan-02', 'Mini-3-PAN02', 'DRONE', 'DJI_MINI_3_PRO',
     'sk-telecom-001', 'SK텔레콤', 'site-skt-pangyo', '판교 R&D 센터', 'OFFLINE', 65, 37.4000, 127.1015, 0, 0,
     'rtsp://drone-pan02.skt.local/stream', NOW(), NOW(), NOW());

-- 4. 미션 데이터 (6개)
INSERT INTO missions (id, name, company_id, company_name, site_id, site_name, robot_id, robot_name, type, schedule, status, path, start_time, end_time, created_at, updated_at)
VALUES
    -- FPT 하노이 - 보안 순찰
    ('mission-fpt-hn-01', '본사 건물 보안 순찰', 'fpt-software-001', 'FPT Software', 'site-fpt-hanoi', 'FPT 하노이 본사',
     'drone-fpt-hn-01', 'Matrice-4E-HN01', 'PATROL', '0 */2 * * *', 'PENDING',
     '[{"id":1,"lat":21.0285,"lng":105.8542,"altitude":50,"action":"photo"},{"id":2,"lat":21.0290,"lng":105.8545,"altitude":60,"action":"video"},{"id":3,"lat":21.0295,"lng":105.8540,"altitude":50,"action":"photo"}]',
     NULL, NULL, NOW(), NOW()),

    -- FPT 호치민 - 시설 점검
    ('mission-fpt-hcm-01', '지사 시설 정기 점검', 'fpt-software-001', 'FPT Software', 'site-fpt-hcm', 'FPT 호치민 지사',
     'drone-fpt-hcm-01', 'Mavic-3E-HCM01', 'INSPECTION', '0 10 * * *', 'PENDING',
     '[{"id":1,"lat":10.7756,"lng":106.7019,"altitude":40,"action":"thermal"},{"id":2,"lat":10.7760,"lng":106.7022,"altitude":45,"action":"photo"}]',
     NULL, NULL, NOW(), NOW()),

    -- 현대중공업 울산 - 대형 구조물 점검
    ('mission-hhi-uls-01', '크레인 구조 안전 점검', 'hyundai-heavy-001', '현대중공업', 'site-hhi-ulsan', '울산 조선소',
     'drone-hhi-uls-01', 'Matrice-300-ULS01', 'INSPECTION', '0 9,15 * * *', 'RUNNING',
     '[{"id":1,"lat":35.5372,"lng":129.3414,"altitude":80,"action":"detailed_photo"},{"id":2,"lat":35.5375,"lng":129.3417,"altitude":100,"action":"thermal"},{"id":3,"lat":35.5378,"lng":129.3420,"altitude":120,"action":"video"}]',
     NOW() - INTERVAL '15 minutes', NULL, NOW(), NOW()),

    -- 현대중공업 군산 - 해양 환경 모니터링
    ('mission-hhi-gun-01', '해양 환경 모니터링', 'hyundai-heavy-001', '현대중공업', 'site-hhi-gunsan', '군산 조선소',
     'drone-hhi-gun-01', 'Matrice-4E-GUN01', 'SURVEILLANCE', '0 8,16 * * *', 'PENDING',
     '[{"id":1,"lat":35.9784,"lng":126.7365,"altitude":30,"action":"water_sample"},{"id":2,"lat":35.9790,"lng":126.7370,"altitude":35,"action":"photo"}]',
     NULL, NULL, NOW(), NOW()),

    -- SK텔레콤 본사 - 통신탑 점검
    ('mission-skt-seo-01', '5G 기지국 안테나 점검', 'sk-telecom-001', 'SK텔레콤', 'site-skt-ttower', 'T타워 본사',
     'drone-skt-seo-01', 'Air-2S-SEO01', 'INSPECTION', '0 7,19 * * *', 'RUNNING',
     '[{"id":1,"lat":37.5665,"lng":126.9780,"altitude":200,"action":"antenna_check"},{"id":2,"lat":37.5668,"lng":126.9783,"altitude":180,"action":"signal_test"}]',
     NOW() - INTERVAL '5 minutes', NULL, NOW(), NOW()),

    -- SK텔레콤 판교 - 네트워크 테스트
    ('mission-skt-pan-01', '무선 네트워크 커버리지 테스트', 'sk-telecom-001', 'SK텔레콤', 'site-skt-pangyo', '판교 R&D 센터',
     'drone-skt-pan-01', 'Matrice-4E-PAN01', 'SURVEILLANCE', '0 */4 * * *', 'PENDING',
     '[{"id":1,"lat":37.3996,"lng":127.1009,"altitude":100,"action":"signal_measurement"},{"id":2,"lat":37.4000,"lng":127.1015,"altitude":80,"action":"speed_test"},{"id":3,"lat":37.4005,"lng":127.1020,"altitude":100,"action":"coverage_map"}]',
     NULL, NULL, NOW(), NOW());

-- 5. 사용자 데이터 (샘플)
-- 비밀번호: 모든 계정 = 'admin123' (Spring Security BCrypt $2a$ 호환)
INSERT INTO users (id, username, password, name, email, role, company_id, company_name, status, created_at, updated_at)
VALUES
    -- System Admin: password = admin123
    ('user-admin-001', 'admin', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
     '시스템 관리자', 'admin@robopilot.com', 'SYSTEM_ADMIN', NULL, NULL, 'ACTIVE', NOW(), NOW()),

    -- Company Admin: password = admin123
    ('user-fpt-001', 'fpt.manager', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
     'Nguyen Van A', 'manager@fpt.com.vn', 'COMPANY_ADMIN', 'fpt-software-001', 'FPT Software', 'ACTIVE', NOW(), NOW()),

    -- Company Admin: password = admin123
    ('user-hhi-001', 'hhi.manager', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
     '김철수', 'manager@hhi.co.kr', 'COMPANY_ADMIN', 'hyundai-heavy-001', '현대중공업', 'ACTIVE', NOW(), NOW()),

    -- Company Admin: password = admin123
    ('user-skt-001', 'skt.manager', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
     '이민수', 'manager@sktelecom.com', 'COMPANY_ADMIN', 'sk-telecom-001', 'SK텔레콤', 'ACTIVE', NOW(), NOW()),

    -- Operator: password = admin123
    ('user-viewer-001', 'viewer', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
     '일반 사용자', 'viewer@fpt.com.vn', 'OPERATOR', 'fpt-software-001', 'FPT Software', 'ACTIVE', NOW(), NOW());

-- 데이터 확인 쿼리
SELECT '회사 수: ' || COUNT(*) FROM companies;
SELECT '현장 수: ' || COUNT(*) FROM sites;
SELECT '로봇 수: ' || COUNT(*) FROM robots;
SELECT '미션 수: ' || COUNT(*) FROM missions;
SELECT '사용자 수: ' || COUNT(*) FROM users;
