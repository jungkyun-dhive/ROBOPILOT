import { useState } from 'react';
import { Plus, Edit, Trash2, Building2, Phone, Mail, MapPin, FileText } from 'lucide-react';
import Modal from '../components/Modal';

const initialCompanies = [
  {
    id: 1,
    name: 'Smart Factory',
    contact: '+82-2-1234-5678',
    email: 'contact@smartfactory.com',
    address: 'Seoul, Gangnam-gu, Teheran-ro 123',
    description: 'IoT 기반 스마트 팩토리 솔루션 제공 업체',
    siteCount: 3,
    robotCount: 5,
    createdAt: '2025-01-15',
  },
  {
    id: 2,
    name: 'Seoul Warehouse',
    contact: '+82-2-2345-6789',
    email: 'info@seoulwarehouse.com',
    address: 'Seoul, Songpa-gu, Olympic-ro 456',
    description: '물류 자동화 및 창고 관리 전문 기업',
    siteCount: 2,
    robotCount: 3,
    createdAt: '2025-02-10',
  },
];

function Companies() {
  const [companies, setCompanies] = useState(initialCompanies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    address: '',
    description: '',
  });

  const handleAdd = () => {
    setEditingCompany(null);
    setFormData({
      name: '',
      contact: '',
      email: '',
      address: '',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      contact: company.contact,
      email: company.email,
      address: company.address,
      description: company.description,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 이 회사를 삭제하시겠습니까?')) {
      setCompanies(companies.filter((c) => c.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingCompany) {
      // 수정
      setCompanies(
        companies.map((c) =>
          c.id === editingCompany.id
            ? { ...c, ...formData }
            : c
        )
      );
    } else {
      // 추가
      const newCompany = {
        id: Math.max(...companies.map((c) => c.id), 0) + 1,
        ...formData,
        siteCount: 0,
        robotCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setCompanies([...companies, newCompany]);
    }

    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회사 관리</h1>
          <p className="text-sm text-gray-600">등록된 회사 목록</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>회사 추가</span>
        </button>
      </div>

      {/* Companies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map((company) => (
          <div key={company.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                  <p className="text-sm text-gray-500">등록일: {company.createdAt}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(company)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="편집"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(company.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {company.contact}
              </div>
              <div className="flex items-center text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                {company.email}
              </div>
              <div className="flex items-start text-gray-600">
                <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{company.address}</span>
              </div>
              {company.description && (
                <div className="flex items-start text-gray-600">
                  <FileText className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{company.description}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-4 text-sm">
              <div>
                <span className="text-gray-600">현장: </span>
                <span className="font-semibold">{company.siteCount}</span>
              </div>
              <div>
                <span className="text-gray-600">로봇: </span>
                <span className="font-semibold">{company.robotCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCompany ? '회사 편집' : '회사 추가'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="inline h-4 w-4 mr-1" />
              이름
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="FPT Software"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="inline h-4 w-4 mr-1" />
              연락처
            </label>
            <input
              type="text"
              name="contact"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+84-24-7300-8866"
              value={formData.contact}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="inline h-4 w-4 mr-1" />
              이메일
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="contact@fpt.com.vn"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline h-4 w-4 mr-1" />
              주소
            </label>
            <input
              type="text"
              name="address"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="FPT Tower, 10 Pham Van Bach, Cau Giay, Hanoi, Vietnam"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="inline h-4 w-4 mr-1" />
              설명
            </label>
            <textarea
              name="description"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="운영 소프트웨어 개발 및 IT 서비스 회사"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>Save</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Companies;
