import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function DashboardLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardLayout;
