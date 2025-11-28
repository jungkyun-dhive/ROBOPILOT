// 고정 사용자 계정
export const MOCK_USERS = [
  {
    id: '1',
    email: 'system@admin.com',
    password: 'admin123',
    name: '시스템 관리자',
    role: 'SYSTEM_ADMIN',
    companyId: null,
    companyName: 'ROBOPILOT',
    siteIds: []
  },
  {
    id: '2',
    email: 'companyA@admin.com',
    password: 'admin123',
    name: '회사 관리자',
    role: 'COMPANY_ADMIN',
    companyId: 'comp-1',
    companyName: 'Smart Factory',
    siteIds: []
  },
  {
    id: '3',
    email: 'viewer@companyA.com',
    password: 'viewer123',
    name: '현장 운영자',
    role: 'OPERATOR',
    companyId: 'comp-1',
    companyName: 'Smart Factory',
    siteIds: ['site-1', 'site-2']
  }
];

export const ROLE_LABELS = {
  SYSTEM_ADMIN: 'System Admin',
  COMPANY_ADMIN: 'Company Admin',
  OPERATOR: 'Viewer'
};
