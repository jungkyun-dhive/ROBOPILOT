import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Workflow, Building2, MapPin, Bot, Clock, FileText, Search } from 'lucide-react';
import Modal from '../components/Modal';
import { missionApi, companyApi, siteApi, robotApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const missionTypes = ['순찰', '점검', '배송', '청소', '모니터링'];

function Missions() {
  const { user } = useAuth();
  const [missions, setMissions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [sites, setSites] = useState([]);
  const [robots, setRobots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    companyId: '',
    siteId: '',
    robotId: '',
    type: '',
    schedule: '',
    description: '',
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [missionsData, companiesData, sitesData, robotsData] = await Promise.all([
        missionApi.getAll(),
        companyApi.getAll(),
        siteApi.getAll(),
        robotApi.getAll(),
      ]);
      setMissions(missionsData || []);
      setCompanies(companiesData || []);
      setSites(sitesData || []);
      setRobots(robotsData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : '-';
  };

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : '-';
  };

  const getRobotName = (robotId) => {
    const robot = robots.find(r => r.id === robotId);
    return robot ? robot.name : '-';
  };

  // 회사 선택시 해당 회사의 사이트만 필터링
  const availableSites = formData.companyId
    ? sites.filter((site) => site.companyId === formData.companyId)
    : [];

  // 사이트 선택시 해당 사이트의 로봇만 필터링
  const availableRobots = formData.siteId
    ? robots.filter((robot) => robot.siteId === formData.siteId)
    : [];

  // 검색 필터링
  const filteredMissions = missions.filter((mission) => {
    const companyName = getCompanyName(mission.companyId);
    const siteName = getSiteName(mission.siteId);
    const robotName = getRobotName(mission.robotId);
    return (
      mission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      robotName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.type.includes(searchTerm)
    );
  });

  const handleAdd = () => {
    setEditingMission(null);
    setFormData({
      name: '',
      companyId: '',
      siteId: '',
      robotId: '',
      type: '',
      schedule: '',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (mission) => {
    setEditingMission(mission);
    setFormData({
      name: mission.name,
      companyId: mission.companyId,
      siteId: mission.siteId,
      robotId: mission.robotId,
      type: mission.type,
      schedule: mission.schedule,
      description: mission.description,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('이 미션을 삭제하시겠습니까?')) {
      try {
        await missionApi.delete(id);
        await loadData();
      } catch (error) {
        console.error('Failed to delete mission:', error);
        alert('미션 삭제에 실패했습니다.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedCompany = companies.find((c) => c.id === formData.companyId);
    const selectedSite = sites.find((s) => s.id === formData.siteId);
    const selectedRobot = robots.find((r) => r.id === formData.robotId);

    if (!selectedCompany || !selectedSite || !selectedRobot) {
      alert('회사, 현장, 로봇을 모두 선택해주세요.');
      return;
    }

    try {
      const missionData = {
        ...formData,
        companyId: formData.companyId,
        siteId: formData.siteId,
        robotId: formData.robotId,
      };

      if (editingMission) {
        await missionApi.update(editingMission.id, missionData);
      } else {
        await missionApi.create(missionData);
      }

      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save mission:', error);
      alert('미션 저장에 실패했습니다.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 회사 변경시 사이트와 로봇 초기화
    if (name === 'companyId') {
      setFormData({
        ...formData,
        companyId: value,
        siteId: '',
        robotId: '',
      });
    } else if (name === 'siteId') {
      // 사이트 변경시 로봇 초기화
      setFormData({
        ...formData,
        siteId: value,
        robotId: '',
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
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
          <h1 className="text-2xl font-bold text-gray-900">미션 관리</h1>
          <p className="text-sm text-gray-600">로봇 및 드론 미션 관리</p>
        </div>
        {user?.role !== 'OPERATOR' && (
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>미션 추가</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="미션명, 회사, 현장, 로봇, 유형으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Missions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  미션명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  회사
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  현장
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  로봇
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  스케줄
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등록일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사항
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMissions.map((mission, index) => (
                <tr key={mission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {mission.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getCompanyName(mission.companyId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getSiteName(mission.siteId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getRobotName(mission.robotId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {mission.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {mission.schedule}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {mission.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(mission)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="편집"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(mission.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredMissions.length === 0 && (
          <div className="text-center py-12">
            <Workflow className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">검색 결과가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">다른 검색어를 시도해보세요.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMission ? '미션 편집' : '미션 추가'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              미션명 *
            </label>
            <div className="relative">
              <Workflow className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 안전 순찰 미션 A"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                회사 *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">회사를 선택하세요</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                현장 *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="siteId"
                  value={formData.siteId}
                  onChange={handleChange}
                  required
                  disabled={!formData.companyId}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:bg-gray-100"
                >
                  <option value="">현장을 선택하세요</option>
                  {availableSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                로봇 *
              </label>
              <div className="relative">
                <Bot className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="robotId"
                  value={formData.robotId}
                  onChange={handleChange}
                  required
                  disabled={!formData.siteId}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:bg-gray-100"
                >
                  <option value="">로봇을 선택하세요</option>
                  {availableRobots.map((robot) => (
                    <option key={robot.id} value={robot.id}>
                      {robot.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                미션 유형 *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">유형을 선택하세요</option>
                {missionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              스케줄 *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="schedule"
                value={formData.schedule}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 매일 09:00, 매주 월/수/금 14:00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="미션에 대한 설명을 입력하세요"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingMission ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Missions;
