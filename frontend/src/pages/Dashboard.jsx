import { useState, useEffect } from 'react';
import { Building2, MapPin, Users, Bot } from 'lucide-react';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import LiveStreamPanel from '../components/LiveStreamPanel';
import { useAuth } from '../contexts/AuthContext';
import { companyApi, siteApi, userApi, robotApi } from '../utils/api';

const tableColumns = [
  { key: 'id', label: '번호' },
  { key: 'name', label: '이름' },
  { key: 'type', label: '구분' },
  { key: 'location', label: '위치' },
  { key: 'email', label: '이메일' },
  { key: 'status', label: '상태' },
  { key: 'date', label: '날짜' },
];

function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    companies: 0,
    sites: 0,
    users: 0,
    robots: 0,
  });
  const [recentRobots, setRecentRobots] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load data based on user role
      const [companiesData, sitesData, usersData, robotsData] = await Promise.all([
        user?.role === 'SYSTEM_ADMIN' ? companyApi.getAll() : Promise.resolve([]),
        siteApi.getAll(),
        user?.role !== 'OPERATOR' ? userApi.getAll() : Promise.resolve([]),
        robotApi.getAll(),
      ]);

      // Calculate stats based on role
      let companyCount = 0;
      let siteCount = 0;
      let userCount = 0;
      let robotCount = 0;

      if (user?.role === 'SYSTEM_ADMIN') {
        // System Admin sees all data
        companyCount = companiesData?.length || 0;
        siteCount = sitesData?.length || 0;
        userCount = usersData?.length || 0;
        robotCount = robotsData?.length || 0;
      } else if (user?.role === 'COMPANY_ADMIN') {
        // Company Admin sees their company data only
        companyCount = 0; // Don't show company count
        siteCount = sitesData?.length || 0; // Already filtered by backend
        userCount = usersData?.length || 0; // Already filtered by backend
        robotCount = robotsData?.length || 0; // Already filtered by backend
      } else if (user?.role === 'OPERATOR') {
        // Operator sees only assigned sites and their robots
        companyCount = 0; // Don't show
        siteCount = sitesData?.length || 0; // Already filtered by backend (assigned sites)
        userCount = 0; // Don't show
        robotCount = robotsData?.length || 0; // Already filtered by backend (assigned sites' robots)
      }

      setStats({
        companies: companyCount,
        sites: siteCount,
        users: userCount,
        robots: robotCount,
      });

      // Prepare recent robots table data
      const robotTableData = (robotsData || []).slice(0, 5).map((robot, index) => ({
        id: index + 1,
        name: robot.name || '-',
        type: robot.companyName || '-',
        location: robot.siteName || '-',
        email: 'contact@robopilot.com',
        status: robot.status === 'ONLINE' ? '활성' : robot.status === 'OFFLINE' ? '비활성' : robot.status || '-',
        date: robot.createdAt ? new Date(robot.createdAt).toLocaleDateString('ko-KR') : '-',
      }));

      setRecentRobots(robotTableData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build stats array based on user role
  const getStatsCards = () => {
    const cards = [];

    // SYSTEM_ADMIN sees all cards
    if (user?.role === 'SYSTEM_ADMIN') {
      cards.push(
        { icon: Building2, value: String(stats.companies), label: 'Company', color: 'cyan' },
        { icon: MapPin, value: String(stats.sites), label: 'Site', color: 'purple' },
        { icon: Users, value: String(stats.users), label: 'User', color: 'orange' },
        { icon: Bot, value: String(stats.robots), label: 'Robot', color: 'blue' }
      );
    }
    // COMPANY_ADMIN sees Site, User, Robot
    else if (user?.role === 'COMPANY_ADMIN') {
      cards.push(
        { icon: MapPin, value: String(stats.sites), label: 'Site', color: 'purple' },
        { icon: Users, value: String(stats.users), label: 'User', color: 'orange' },
        { icon: Bot, value: String(stats.robots), label: 'Robot', color: 'blue' }
      );
    }
    // OPERATOR sees only Site and Robot
    else if (user?.role === 'OPERATOR') {
      cards.push(
        { icon: MapPin, value: String(stats.sites), label: 'Site', color: 'purple' },
        { icon: Bot, value: String(stats.robots), label: 'Robot', color: 'blue' }
      );
    }

    return cards;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">로딩 중...</h3>
        </div>
      </div>
    );
  }

  const statsCards = getStatsCards();

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">
            {new Date().toLocaleString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })} (KST, UTC+09:00)
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">최근 장비 현황</h2>
          </div>
          <DataTable columns={tableColumns} data={recentRobots} />
        </div>
      </div>

      {/* Right Panel - Live Stream */}
      <LiveStreamPanel />
    </div>
  );
}

export default Dashboard;
