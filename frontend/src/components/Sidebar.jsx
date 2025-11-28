import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Workflow,
  Users,
  Settings,
  Cpu
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '홈보드' },
  { path: '/companies', icon: Building2, label: '회사' },
  { path: '/sites', icon: MapPin, label: '현장' },
  { path: '/missions', icon: Workflow, label: '미션 관리' },
  { path: '/users', icon: Users, label: '사용자 관리' },
  { path: '/settings', icon: Settings, label: '시스템 관리' },
];

function Sidebar() {
  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">USER NAME</div>
            <div className="text-xs text-gray-500">System Admin</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => (
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
