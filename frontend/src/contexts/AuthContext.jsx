import { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_USERS } from '../utils/mockUsers';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 페이지 로드 시 localStorage에서 사용자 정보 복원
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    // 고정된 계정으로 로그인
    const foundUser = MOCK_USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      return { success: true, user: userWithoutPassword };
    }

    return { success: false, error: '아이디 또는 비밀번호가 일치하지 않습니다.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const hasPermission = (requiredRole) => {
    if (!user) return false;

    const roleHierarchy = {
      SYSTEM_ADMIN: 3,
      COMPANY_ADMIN: 2,
      OPERATOR: 1
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  const canAccessCompany = (companyId) => {
    if (!user) return false;
    if (user.role === 'SYSTEM_ADMIN') return true;
    return user.companyId === companyId;
  };

  const canAccessSite = (siteId) => {
    if (!user) return false;
    if (user.role === 'SYSTEM_ADMIN') return true;
    if (user.role === 'COMPANY_ADMIN') return true;
    return user.siteIds.includes(siteId);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    canAccessCompany,
    canAccessSite
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
