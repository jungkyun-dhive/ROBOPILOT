import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = '/api';

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

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || '이메일 또는 비밀번호가 일치하지 않습니다.'
        };
      }

      const data = await response.json();
      const userInfo = data.user;

      setUser(userInfo);
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('token', data.token);

      return { success: true, user: userInfo };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: '로그인 중 오류가 발생했습니다.'
      };
    }
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
