import { useState, useEffect } from 'react';
import { Clock, User, LogIn, LogOut, Plus, Edit, Trash2, Play, Square, Video, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auditLogApi } from '../utils/api';
const mockAuditLogs = [
  {
    id: '1',
    userId: 'user-admin-001',
    username: '시스템 관리자',
    companyId: null,
    action: 'LOGIN',
    entityType: 'USER',
    entityId: 'user-admin-001',
    description: '사용자가 로그인했습니다',
    ipAddress: '192.168.1.100',
    createdAt: '2026-01-07T10:30:00',
  },
  {
    id: '2',
    userId: 'user-fpt-001',
    username: 'Nguyen Van A',
    companyId: 'fpt-software-001',
    action: 'CREATE',
    entityType: 'ROBOT',
    entityId: 'drone-fpt-hn-01',
    description: '로봇 "Matrice-4E-HN01"을 추가했습니다',
    ipAddress: '192.168.1.101',
    createdAt: '2026-01-07T09:15:00',
  },
];

const actionLabels = {
  LOGIN: '로그인',
  LOGOUT: '로그아웃',
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제',
  START: '시작',
  STOP: '중지',
  PLAY: '재생',
};

const entityTypeLabels = {
  USER: '사용자',
  COMPANY: '회사',
  SITE: '현장',
  MISSION: '미션',
  ROBOT: '로봇',
  TASK: '작업',
  VIDEO: '영상',
};

const getActionIcon = (action) => {
  switch (action) {
    case 'LOGIN':
      return <LogIn className="h-4 w-4" />;
    case 'LOGOUT':
      return <LogOut className="h-4 w-4" />;
    case 'CREATE':
      return <Plus className="h-4 w-4" />;
    case 'UPDATE':
      return <Edit className="h-4 w-4" />;
    case 'DELETE':
      return <Trash2 className="h-4 w-4" />;
    case 'START':
      return <Play className="h-4 w-4" />;
    case 'STOP':
      return <Square className="h-4 w-4" />;
    case 'PLAY':
      return <Video className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getActionColor = (action) => {
  switch (action) {
    case 'LOGIN':
      return 'bg-green-100 text-green-800';
    case 'LOGOUT':
      return 'bg-gray-100 text-gray-800';
    case 'CREATE':
      return 'bg-blue-100 text-blue-800';
    case 'UPDATE':
      return 'bg-yellow-100 text-yellow-800';
    case 'DELETE':
      return 'bg-red-100 text-red-800';
    case 'START':
      return 'bg-green-100 text-green-800';
    case 'STOP':
      return 'bg-orange-100 text-orange-800';
    case 'PLAY':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

function History() {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await auditLogApi.getAll();
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      // Fallback to mock data if API fails
      setAuditLogs(mockAuditLogs);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.username.toLowerCase().includes(searchLower) ||
      log.description.toLowerCase().includes(searchLower) ||
      actionLabels[log.action]?.toLowerCase().includes(searchLower) ||
      entityTypeLabels[log.entityType]?.toLowerCase().includes(searchLower)
    );
  });

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">로딩 중...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">히스토리</h1>
          <p className="text-sm text-gray-600">시스템 활동 이력</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="사용자, 작업, 설명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {filteredLogs.map((log, logIdx) => (
                <li key={log.id}>
                  <div className="relative pb-8">
                    {logIdx !== filteredLogs.length - 1 ? (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex items-start space-x-3">
                      <div>
                        <div
                          className={`relative px-2 py-2 flex items-center justify-center h-10 w-10 rounded-full ${getActionColor(
                            log.action
                          )}`}
                        >
                          {getActionIcon(log.action)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">{log.username}</span>
                            <span className="text-gray-500 mx-2">·</span>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                                log.action
                              )}`}
                            >
                              {actionLabels[log.action] || log.action}
                            </span>
                            <span className="text-gray-500 mx-2">·</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {entityTypeLabels[log.entityType] || log.entityType}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-700">{log.description}</p>
                          <div className="mt-2 text-xs text-gray-500 flex items-center space-x-4">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDateTime(log.createdAt)}
                            </span>
                            {log.ipAddress && (
                              <span>IP: {log.ipAddress}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Empty State */}
        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">히스토리가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">아직 기록된 활동이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
