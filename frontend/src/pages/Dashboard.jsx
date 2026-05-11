import { useState, useEffect, useRef } from 'react';
import { Building2, MapPin, Users, Bot, Search, ExternalLink } from 'lucide-react';
import StatCard from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { companyApi, siteApi, userApi, robotApi } from '../utils/api';

function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ companies: 0, sites: 0, users: 0, robots: 0 });
  const [robots, setRobots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [now, setNow] = useState(new Date());
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [companiesData, sitesData, usersData, robotsData] = await Promise.all([
        user?.role === 'SYSTEM_ADMIN' ? companyApi.getAll() : Promise.resolve([]),
        siteApi.getAll(),
        user?.role !== 'OPERATOR' ? userApi.getAll() : Promise.resolve([]),
        robotApi.getAll(),
      ]);

      let companyCount = 0, siteCount = 0, userCount = 0, robotCount = 0;
      if (user?.role === 'SYSTEM_ADMIN') {
        companyCount = companiesData?.length || 0;
        siteCount = sitesData?.length || 0;
        userCount = usersData?.length || 0;
        robotCount = robotsData?.length || 0;
      } else if (user?.role === 'COMPANY_ADMIN') {
        siteCount = sitesData?.length || 0;
        userCount = usersData?.length || 0;
        robotCount = robotsData?.length || 0;
      } else if (user?.role === 'OPERATOR') {
        siteCount = sitesData?.length || 0;
        robotCount = robotsData?.length || 0;
      }

      setStats({ companies: companyCount, sites: siteCount, users: userCount, robots: robotCount });
      setRobots(robotsData || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatsCards = () => {
    const cards = [];
    if (user?.role === 'SYSTEM_ADMIN') {
      cards.push(
        { icon: Building2, value: String(stats.companies), label: '회사', color: 'cyan' },
        { icon: MapPin, value: String(stats.sites), label: '사이트', color: 'purple' },
        { icon: Users, value: String(stats.users), label: '사용자', color: 'orange' },
        { icon: Bot, value: String(stats.robots), label: '로봇', color: 'blue' }
      );
    } else if (user?.role === 'COMPANY_ADMIN') {
      cards.push(
        { icon: MapPin, value: String(stats.sites), label: '사이트', color: 'purple' },
        { icon: Users, value: String(stats.users), label: '사용자', color: 'orange' },
        { icon: Bot, value: String(stats.robots), label: '로봇', color: 'blue' }
      );
    } else {
      cards.push(
        { icon: MapPin, value: String(stats.sites), label: '사이트', color: 'purple' },
        { icon: Bot, value: String(stats.robots), label: '로봇', color: 'blue' }
      );
    }
    return cards;
  };

  const formatDateTime = (date) =>
    date.toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });

  const getStatusLabel = (status) => {
    if (status === 'ONLINE') return '활성화';
    if (status === 'OFFLINE') return '비활성화';
    if (status === 'CHARGING') return '충전중';
    return status || '-';
  };

  const getStatusColor = (status) => {
    if (status === 'ONLINE') return 'text-green-500';
    return 'text-red-500';
  };

  const filteredRobots = robots.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      (r.name || '').toLowerCase().includes(term) ||
      (r.companyName || '').toLowerCase().includes(term) ||
      (r.siteName || '').toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredRobots.length / rowsPerPage));
  const pagedRobots = filteredRobots.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  const statsCards = getStatsCards();

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">홈피드</h1>
        <p className="text-sm text-gray-500 mt-1">
          {formatDateTime(now)} (KST, UTC+09:00)
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Search Bar */}
        <div className="flex items-center justify-end px-4 py-3 border-b border-gray-100">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search Company"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-4 pr-9 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {['번호', '로봇명', '회사명', '사이트명', '상태', '작업내용'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 border-b border-gray-200">
                    {col !== '번호' && <span className="mr-1 text-gray-300">⇅</span>}
                    {col}
                  </th>
                ))}
                <th className="px-4 py-3 border-b border-gray-200" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedRobots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                    데이터가 없습니다
                  </td>
                </tr>
              ) : (
                pagedRobots.map((robot, index) => (
                  <tr key={robot.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{robot.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{robot.companyName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{robot.siteName || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${robot.status === 'ONLINE' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={getStatusColor(robot.status)}>
                          {getStatusLabel(robot.status)}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">-</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      <button className="p-1 hover:text-blue-500">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end px-4 py-3 border-t border-gray-100 gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`w-7 h-7 text-xs rounded border ${
                currentPage === p
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
