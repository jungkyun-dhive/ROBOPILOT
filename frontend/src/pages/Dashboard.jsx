import { Building2, MapPin, Users, Drone } from 'lucide-react';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import LiveStreamPanel from '../components/LiveStreamPanel';

const stats = [
  { icon: Building2, value: '3', label: 'Company', color: 'cyan' },
  { icon: MapPin, value: '7', label: 'Site', color: 'purple' },
  { icon: Users, value: '10', label: 'Viewer', color: 'orange' },
  { icon: Drone, value: '12', label: 'Drone', color: 'blue' },
];

const tableColumns = [
  { key: 'id', label: '번호' },
  { key: 'name', label: '이름' },
  { key: 'type', label: '구분' },
  { key: 'location', label: '위치' },
  { key: 'email', label: '이메일' },
  { key: 'status', label: '상태' },
  { key: 'date', label: '날짜' },
];

const tableData = [
  {
    id: 1,
    name: 'Matrice 4E-01',
    type: 'DJI Software',
    location: 'Seoul HQ',
    email: 'contact@robopilot.com',
    status: '활성',
    date: '2025-11-28',
  },
  {
    id: 2,
    name: 'Matrice 4E-02',
    type: 'DJI Software',
    location: 'Seoul HQ',
    email: 'contact@robopilot.com',
    status: '활성',
    date: '2025-11-28',
  },
  {
    id: 3,
    name: 'Matrice 4E-03',
    type: 'DJI Software',
    location: 'Seoul HQ',
    email: 'contact@robopilot.com',
    status: '활성',
    date: '2025-11-28',
  },
  {
    id: 4,
    name: 'Matrice 4E-04',
    type: 'DJI Software',
    location: 'Seoul HQ',
    email: 'contact@robopilot.com',
    status: '활성',
    date: '2025-11-28',
  },
  {
    id: 5,
    name: 'Unitree GO2-01',
    type: '로봇현장',
    location: 'Seoul HQ',
    email: 'contact@robopilot.com',
    status: '활성',
    date: '2025-11-28',
  },
];

function Dashboard() {
  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">2025-11-19 16:25:17 (KST, UTC+09:00)</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">최근 장비 현황</h2>
          </div>
          <DataTable columns={tableColumns} data={tableData} />
        </div>
      </div>

      {/* Right Panel - Live Stream */}
      <LiveStreamPanel />
    </div>
  );
}

export default Dashboard;
