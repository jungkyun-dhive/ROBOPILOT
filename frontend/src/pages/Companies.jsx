import { useState, useEffect } from 'react';
import { Plus, Building2, Phone, Mail, MapPin, FileText, Search, MoreHorizontal } from 'lucide-react';
import Modal from '../components/Modal';
import { companyApi } from '../utils/api';

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const rowsPerPage = 10;
  const [formData, setFormData] = useState({
    name: '', contact: '', email: '', address: '', type: '',
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyApi.getAll();
      setCompanies(data || []);
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter((company) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (company.name || '').toLowerCase().includes(term) ||
      (company.email || '').toLowerCase().includes(term) ||
      (company.contact || '').includes(term) ||
      (company.address || '').toLowerCase().includes(term);

    const createdDate = company.createdAt ? company.createdAt.slice(0, 10) : '';
    const matchesFrom = !dateFrom || createdDate >= dateFrom;
    const matchesTo = !dateTo || createdDate <= dateTo;

    return matchesSearch && matchesFrom && matchesTo;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / rowsPerPage));
  const pagedCompanies = filteredCompanies.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleAdd = () => {
    setEditingCompany(null);
    setFormData({ name: '', contact: '', email: '', address: '', type: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name, contact: company.contact || '',
      email: company.email || '', address: company.address || '', type: company.type || '',
    });
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 이 회사를 삭제하시겠습니까?')) {
      try {
        await companyApi.delete(id);
        await loadCompanies();
      } catch (error) {
        console.error('Failed to delete company:', error);
        alert('회사 삭제에 실패했습니다.');
      }
    }
    setOpenMenuId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await companyApi.update(editingCompany.id, formData);
      } else {
        await companyApi.create(formData);
      }
      await loadCompanies();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save company:', error);
      alert('회사 저장에 실패했습니다.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getStatus = (company) => {
    // Use active field if present, otherwise derive from status string
    if (company.active === true || company.status === 'ACTIVE') return true;
    if (company.active === false || company.status === 'INACTIVE') return false;
    // Default alternating for demo
    return company.name?.toLowerCase().includes('sky') ||
      company.name?.toLowerCase().includes('d.hive') ||
      company.name?.toLowerCase().includes('acme');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-1">
        <p className="text-xs text-gray-400">설정 / 회사 관리</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">회사 관리</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
          })} (KST, UTC+09:00)
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 mt-4 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
          <span className="text-gray-400 text-sm">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search Company"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-4 pr-9 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <div className="ml-auto">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            회사 추가
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          <p className="mt-2 text-sm text-gray-600">로딩 중...</p>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['번호', '회사명', '연락처', '이메일', '등록일', '주소', '상태'].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">
                      {col !== '번호' && <span className="mr-1 text-gray-300">⇅</span>}
                      {col}
                    </th>
                  ))}
                  <th className="px-4 py-3 border-b border-gray-200" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                      데이터가 없습니다
                    </td>
                  </tr>
                ) : (
                  pagedCompanies.map((company, index) => {
                    const isActive = getStatus(company);
                    return (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {(currentPage - 1) * rowsPerPage + index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{company.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{company.contact || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{company.email || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {company.createdAt ? new Date(company.createdAt).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-48 truncate">{company.address || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={isActive ? 'text-green-600' : 'text-red-500'}>
                              {isActive ? '활성화' : '비활성화'}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === company.id ? null : company.id); }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                          </button>
                          {openMenuId === company.id && (
                            <div className="absolute right-4 top-8 z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-28">
                              <button
                                onClick={() => handleEdit(company)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                편집
                              </button>
                              <button
                                onClick={() => handleDelete(company.id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
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
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCompany ? '회사 편집' : '회사 추가'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="inline h-4 w-4 mr-1" />이름
            </label>
            <input
              type="text" name="name" required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="FPT Software"
              value={formData.name} onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="inline h-4 w-4 mr-1" />연락처
            </label>
            <input
              type="text" name="contact"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+84-24-7300-8866"
              value={formData.contact} onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="inline h-4 w-4 mr-1" />이메일
            </label>
            <input
              type="email" name="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="contact@fpt.com.vn"
              value={formData.email} onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline h-4 w-4 mr-1" />주소
            </label>
            <input
              type="text" name="address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="FPT Tower, 10 Pham Van Bach..."
              value={formData.address} onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="inline h-4 w-4 mr-1" />유형
            </label>
            <input
              type="text" name="type"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="IT Service, Manufacturing, Telecom 등"
              value={formData.type} onChange={handleChange}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              저장
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Companies;
