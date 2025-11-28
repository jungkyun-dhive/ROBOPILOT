import { useState } from 'react';
import { Plus, Edit, Trash2, Bot, Building2, MapPin, Package, Search } from 'lucide-react';
import Modal from '../components/Modal';

const initialRobots = [
  {
    id: 1,
    name: 'Unitree GO2-01',
    companyId: 1,
    companyName: 'Smart Factory',
    siteId: 1,
    siteName: '서울 건설현장 A',
    type: '사족보행',
    brand: 'Unitree',
    model: 'GO2',
    identifier: 'UG2-001-KR',
    serialNumber: 'SN-UG2-20250115-001',
    status: '미션 실행 중',
    currentMission: '안전 순찰 미션 A',
    createdAt: '2025-01-15',
  },
  {
    id: 2,
    name: 'Matrice 4E-01',
    companyId: 2,
    companyName: 'Seoul Warehouse',
    siteId: 2,
    siteName: '부산 물류센터 B',
    type: '드론',
    brand: 'DJI',
    model: 'Matrice 4E',
    identifier: 'DJI-M4E-002-KR',
    serialNumber: 'SN-M4E-20250210-002',
    status: '대기중',
    currentMission: null,
    createdAt: '2025-02-10',
  },
];

// Mock data from other pages
const companies = [
  { id: 1, name: 'Smart Factory' },
  { id: 2, name: 'Seoul Warehouse' },
];

const sites = [
  { id: 1, name: '서울 건설현장 A', companyId: 1 },
  { id: 2, name: '부산 물류센터 B', companyId: 2 },
];

const missions = [
  { id: 1, name: '안전 순찰 미션 A' },
  { id: 2, name: '물류 점검 미션' },
  { id: 3, name: '야간 보안 순찰' },
];

const robotTypes = ['사족보행', '바퀴이동', '드론'];
const statusOptions = ['연결끊김', '대기중', '미션 실행 중'];

function Robots() {
  const [robots, setRobots] = useState(initialRobots);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRobot, setEditingRobot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    companyId: '',
    siteId: '',
    type: '',
    brand: '',
    model: '',
    identifier: '',
    serialNumber: '',
    status: '대기중',
    currentMission: '',
  });

  // 회사 선택시 해당 회사의 사이트만 필터링
  const availableSites = formData.companyId
    ? sites.filter((site) => site.companyId === parseInt(formData.companyId))
    : [];

  // 검색 필터링
  const filteredRobots = robots.filter((robot) =>
    robot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    robot.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    robot.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    robot.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    robot.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    robot.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    robot.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingRobot(null);
    setFormData({
      name: '',
      companyId: '',
      siteId: '',
      type: '',
      brand: '',
      model: '',
      identifier: '',
      serialNumber: '',
      status: '대기중',
      currentMission: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (robot) => {
    setEditingRobot(robot);
    setFormData({
      name: robot.name,
      companyId: robot.companyId,
      siteId: robot.siteId,
      type: robot.type,
      brand: robot.brand,
      model: robot.model,
      identifier: robot.identifier,
      serialNumber: robot.serialNumber,
      status: robot.status,
      currentMission: robot.currentMission || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('이 로봇을 삭제하시겠습니까?')) {
      setRobots(robots.filter((robot) => robot.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedCompany = companies.find((c) => c.id === parseInt(formData.companyId));
    const selectedSite = sites.find((s) => s.id === parseInt(formData.siteId));

    if (!selectedCompany || !selectedSite) {
      alert('회사와 현장을 선택해주세요.');
      return;
    }

    if (editingRobot) {
      // 편집
      setRobots(
        robots.map((robot) =>
          robot.id === editingRobot.id
            ? {
                ...robot,
                ...formData,
                companyId: parseInt(formData.companyId),
                companyName: selectedCompany.name,
                siteId: parseInt(formData.siteId),
                siteName: selectedSite.name,
                currentMission: formData.status === '미션 실행 중' ? formData.currentMission : null,
              }
            : robot
        )
      );
    } else {
      // 추가
      const newRobot = {
        id: Math.max(...robots.map((r) => r.id), 0) + 1,
        ...formData,
        companyId: parseInt(formData.companyId),
        companyName: selectedCompany.name,
        siteId: parseInt(formData.siteId),
        siteName: selectedSite.name,
        currentMission: formData.status === '미션 실행 중' ? formData.currentMission : null,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setRobots([...robots, newRobot]);
    }

    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 회사 변경시 사이트 초기화
    if (name === 'companyId') {
      setFormData({
        ...formData,
        companyId: value,
        siteId: '',
      });
    } else if (name === 'status' && value !== '미션 실행 중') {
      // 상태가 '미션 실행 중'이 아니면 미션 초기화
      setFormData({
        ...formData,
        status: value,
        currentMission: '',
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case '연결끊김':
        return 'bg-red-100 text-red-800';
      case '대기중':
        return 'bg-green-100 text-green-800';
      case '미션 실행 중':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">로봇 관리</h1>
          <p className="text-sm text-gray-600">등록된 로봇 및 드론 목록</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>로봇 추가</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="로봇명, 회사, 현장, 브랜드, 모델, 식별자, 시리얼번호로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Robots Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  로봇명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  회사
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  현장
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  종류
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  브랜드명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  모델명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  로봇식별자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  시리얼번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
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
              {filteredRobots.map((robot, index) => (
                <tr key={robot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {robot.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {robot.companyName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {robot.siteName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {robot.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {robot.brand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {robot.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {robot.identifier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {robot.serialNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(robot.status)}`}>
                        {robot.status}
                      </span>
                      {robot.status === '미션 실행 중' && robot.currentMission && (
                        <div className="text-xs text-gray-500">
                          {robot.currentMission}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {robot.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(robot)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="편집"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(robot.id)}
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
        {filteredRobots.length === 0 && (
          <div className="text-center py-12">
            <Bot className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">검색 결과가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">다른 검색어를 시도해보세요.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRobot ? '로봇 편집' : '로봇 추가'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                로봇명 *
              </label>
              <div className="relative">
                <Bot className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: Unitree GO2-01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종류 *
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">종류를 선택하세요</option>
                  {robotTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
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
                브랜드명 *
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: Unitree, DJI"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                모델명 *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: GO2, Matrice 4E"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                로봇식별자 *
              </label>
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: UG2-001-KR"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시리얼번호 *
              </label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: SN-UG2-20250115-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태 *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {formData.status === '미션 실행 중' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  실행 중인 미션
                </label>
                <select
                  name="currentMission"
                  value={formData.currentMission}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">미션을 선택하세요</option>
                  {missions.map((mission) => (
                    <option key={mission.id} value={mission.name}>
                      {mission.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              {editingRobot ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Robots;
