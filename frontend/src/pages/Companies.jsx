import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';

const columns = [
  { key: 'id', label: '번호' },
  { key: 'name', label: '회사명' },
  { key: 'type', label: '구분' },
  { key: 'sites', label: '현장 수' },
  { key: 'robots', label: '로봇 수' },
  { key: 'contact', label: '담당자' },
  { key: 'date', label: '등록일' },
  { key: 'actions', label: '관리' },
];

function Companies() {
  const [companies] = useState([
    {
      id: 1,
      name: 'Smart Factory',
      type: 'DJI Software',
      sites: 3,
      robots: 5,
      contact: '김철수',
      date: '2025-11-18',
    },
    {
      id: 2,
      name: 'Seoul Warehouse',
      type: 'DJI Software',
      sites: 2,
      robots: 3,
      contact: '이영희',
      date: '2025-11-19',
    },
  ]);

  const handleAdd = () => {
    // TODO: 회사 추가 모달 열기
    console.log('Add company');
  };

  const handleEdit = (id) => {
    // TODO: 회사 수정 모달 열기
    console.log('Edit company:', id);
  };

  const handleDelete = (id) => {
    // TODO: 회사 삭제 확인
    console.log('Delete company:', id);
  };

  const tableData = companies.map((company) => ({
    ...company,
    actions: (
      <div className="flex space-x-2">
        <button
          onClick={() => handleEdit(company.id)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDelete(company.id)}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ),
  }));

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

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={tableData} />
      </div>
    </div>
  );
}

export default Companies;
