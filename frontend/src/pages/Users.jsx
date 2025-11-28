import { useState } from 'react';
import { Plus, Edit, Trash2, User, Mail, Lock, Building2, Shield, MapPin, Search } from 'lucide-react';
import Modal from '../components/Modal';
import { ROLE_LABELS } from '../utils/mockUsers';

const initialUsers = [
  {
    id: 1,
    name: '시스템 관리자',
    email: 'system@admin.com',
    role: 'SYSTEM_ADMIN',
    companyId: null,
    companyName: 'ROBOPILOT',
    siteIds: [],
    createdAt: '2025-01-01',
  },
  {
    id: 2,
    name: '회사 관리자',
    email: 'companyA@admin.com',
    role: 'COMPANY_ADMIN',
    companyId: 1,
    companyName: 'Smart Factory',
    siteIds: [],
    createdAt: '2025-01-15',
  },
  {
    id: 3,
    name: '현장 운영자',
    email: 'operator@companyA.com',
    role: 'OPERATOR',
    companyId: 1,
    companyName: 'Smart Factory',
    siteIds: [1],
    createdAt: '2025-01-20',
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

const roles = [
  { value: 'SYSTEM_ADMIN', label: 'System Admin', description: '모든 권한' },
  { value: 'COMPANY_ADMIN', label: 'Company Admin', description: '회사 내 관리' },
  { value: 'OPERATOR', label: 'Operator', description: '현장 운영' },
];

function Users() {
  const [users, setUsers] = useState(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    companyId: '',
    siteIds: [],
  });

  // 회사 선택시 해당 회사의 사이트만 필터링
  const availableSites = formData.companyId
    ? sites.filter((site) => site.companyId === parseInt(formData.companyId))
    : [];

  // 검색 필터링
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ROLE_LABELS[user.role].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      companyId: '',
      siteIds: [],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      companyId: user.companyId || '',
      siteIds: user.siteIds || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('이 사용자를 삭제하시겠습니까?')) {
      setUsers(users.filter((user) => user.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // System Admin은 회사 선택 불필요
    let selectedCompany = null;
    if (formData.role !== 'SYSTEM_ADMIN') {
      selectedCompany = companies.find((c) => c.id === parseInt(formData.companyId));
      if (!selectedCompany) {
        alert('회사를 선택해주세요.');
        return;
      }
    }

    // Operator는 최소 하나의 현장 선택 필요
    if (formData.role === 'OPERATOR' && formData.siteIds.length === 0) {
      alert('Operator는 최소 하나의 현장을 선택해야 합니다.');
      return;
    }

    if (editingUser) {
      // 편집
      setUsers(
        users.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                name: formData.name,
                email: formData.email,
                role: formData.role,
                companyId: formData.role === 'SYSTEM_ADMIN' ? null : parseInt(formData.companyId),
                companyName: formData.role === 'SYSTEM_ADMIN' ? 'ROBOPILOT' : selectedCompany.name,
                siteIds: formData.role === 'OPERATOR' ? formData.siteIds : [],
              }
            : user
        )
      );
    } else {
      // 추가
      const newUser = {
        id: Math.max(...users.map((u) => u.id), 0) + 1,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        companyId: formData.role === 'SYSTEM_ADMIN' ? null : parseInt(formData.companyId),
        companyName: formData.role === 'SYSTEM_ADMIN' ? 'ROBOPILOT' : selectedCompany.name,
        siteIds: formData.role === 'OPERATOR' ? formData.siteIds : [],
        createdAt: new Date().toISOString().split('T')[0],
      };
      setUsers([...users, newUser]);
    }

    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 역할 변경시 회사와 사이트 초기화
    if (name === 'role') {
      setFormData({
        ...formData,
        role: value,
        companyId: value === 'SYSTEM_ADMIN' ? '' : formData.companyId,
        siteIds: [],
      });
    } else if (name === 'companyId') {
      // 회사 변경시 사이트 초기화
      setFormData({
        ...formData,
        companyId: value,
        siteIds: [],
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSiteToggle = (siteId) => {
    const newSiteIds = formData.siteIds.includes(siteId)
      ? formData.siteIds.filter((id) => id !== siteId)
      : [...formData.siteIds, siteId];

    setFormData({
      ...formData,
      siteIds: newSiteIds,
    });
  };

  const getSiteNames = (siteIds) => {
    if (!siteIds || siteIds.length === 0) return '-';
    return siteIds
      .map((id) => sites.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
          <p className="text-sm text-gray-600">시스템 사용자 계정 관리</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>사용자 추가</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="이름, 이메일, 회사, 권한으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이메일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  권한
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  회사
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  담당 현장
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
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.companyName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {getSiteNames(user.siteIds)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="편집"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
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
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">검색 결과가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">다른 검색어를 시도해보세요.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? '사용자 편집' : '사용자 추가'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름 *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 홍길동"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: user@company.com"
              />
            </div>
          </div>

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!editingUser}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              권한 *
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">권한을 선택하세요</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.role && formData.role !== 'SYSTEM_ADMIN' && (
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
          )}

          {formData.role === 'OPERATOR' && formData.companyId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                담당 현장 * (최소 1개 선택)
              </label>
              <div className="border border-gray-300 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {availableSites.length > 0 ? (
                  availableSites.map((site) => (
                    <label key={site.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.siteIds.includes(site.id)}
                        onChange={() => handleSiteToggle(site.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{site.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    선택한 회사에 현장이 없습니다
                  </p>
                )}
              </div>
            </div>
          )}

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
              {editingUser ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Users;
