// 고정 사용자 계정
export const MOCK_USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: '시스템 관리자',
    email: 'admin@robopilot.com',
    role: 'SYSTEM_ADMIN',
    companyId: null,
    companyName: 'ROBOPILOT',
    siteIds: []
  },
  {
    id: '2',
    username: 'company1',
    password: 'company123',
    name: '회사 관리자',
    email: 'company1@robopilot.com',
    role: 'COMPANY_ADMIN',
    companyId: 'comp-1',
    companyName: 'Smart Factory',
    siteIds: []
  },
  {
    id: '3',
    username: 'operator1',
    password: 'operator123',
    name: '현장 운영자',
    email: 'operator1@robopilot.com',
    role: 'OPERATOR',
    companyId: 'comp-1',
    companyName: 'Smart Factory',
    siteIds: ['site-1', 'site-2']
  }
];

export const ROLE_LABELS = {
  SYSTEM_ADMIN: '시스템 관리자',
  COMPANY_ADMIN: '회사 관리자',
  OPERATOR: '운영자'
};
