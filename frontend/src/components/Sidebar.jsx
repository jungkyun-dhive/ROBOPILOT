import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Workflow,
  Users,
  Settings,
  Cpu,
  LogOut,
  ClipboardList,
  Video,
  History,
  ChevronDown,
  ChevronRight,
  Cog,
  Route
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../utils/mockUsers';

const mainMenuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '홈피드', minRole: 'OPERATOR' },
  { path: '/route-planning', icon: Route, label: '경로 계획', minRole: 'OPERATOR' },
  { path: '/tasks', icon: ClipboardList, label: '작업', minRole: 'OPERATOR' },
  { path: '/video', icon: Video, label: '영상 재생', minRole: 'OPERATOR' },
  { path: '/history', icon: History, label: '히스토리', minRole: 'OPERATOR' },
];

const settingsSubMenuItems = [
  { path: '/companies', icon: Building2, label: '회사 관리', minRole: 'SYSTEM_ADMIN' },
  { path: '/sites', icon: MapPin, label: '사이트 관리', minRole: 'COMPANY_ADMIN' },
  { path: '/missions', icon: Workflow, label: '미션 관리', minRole: 'OPERATOR' },
  { path: '/robots', icon: Cpu, label: '로봇 관리', minRole: 'OPERATOR' },
  { path: '/users', icon: Users, label: '사용자 관리', minRole: 'COMPANY_ADMIN' },
];

function Sidebar() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleMainMenuItems = mainMenuItems.filter((item) =>
    hasPermission(item.minRole)
  );

  const visibleSettingsSubMenuItems = settingsSubMenuItems.filter((item) =>
    hasPermission(item.minRole)
  );

  const showSettingsMenu = visibleSettingsSubMenuItems.length > 0;

  const getInitial = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'SYSTEM_ADMIN': return 'bg-blue-100 text-blue-700';
      case 'COMPANY_ADMIN': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="w-56 bg-white h-screen border-r border-gray-200 flex flex-col">
      {/* User Info */}
      <div className="border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">{getInitial(user?.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{user?.name}</div>
            <div className={`inline-block text-xs px-2 py-0.5 rounded-full mt-0.5 font-medium ${getRoleBadgeColor(user?.role)}`}>
              {user?.role && ROLE_LABELS[user.role]}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {visibleMainMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}

        {showSettingsMenu && (
          <div>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">설정</span>
              </div>
              {isSettingsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {isSettingsOpen && (
              <div className="mt-0.5 space-y-0.5">
                {visibleSettingsSubMenuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 pl-10 pr-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}

export default Sidebar;
