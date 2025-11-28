import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Workflow,
  Users,
  Settings,
  Cpu,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../utils/mockUsers';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '홈피드', minRole: 'OPERATOR' },
  { path: '/companies', icon: Building2, label: '회사', minRole: 'SYSTEM_ADMIN' },
  { path: '/sites', icon: MapPin, label: '현장', minRole: 'COMPANY_ADMIN' },
  { path: '/missions', icon: Workflow, label: '미션 관리', minRole: 'OPERATOR' },
  { path: '/users', icon: Users, label: '사용자 관리', minRole: 'COMPANY_ADMIN' },
  { path: '/settings', icon: Settings, label: '시스템 관리', minRole: 'SYSTEM_ADMIN' },
];

function Sidebar() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 권한에 따라 메뉴 필터링
  const visibleMenuItems = menuItems.filter((item) =>
    hasPermission(item.minRole)
  );

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col">
      {/* User Info with Logout */}
      <div className="border-b border-gray-200">
        <div className="h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {user?.name}
              </div>
              <div className="text-xs text-gray-500">
                {user?.role && ROLE_LABELS[user.role]}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="로그아웃"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          ROBOPILOT v1.0.0
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
