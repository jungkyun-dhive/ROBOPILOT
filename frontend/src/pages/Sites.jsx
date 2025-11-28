import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';

const columns = [
  { key: 'id', label: '번호' },
  { key: 'name', label: '현장명' },
  { key: 'company', label: '회사' },
  { key: 'location', label: '위치' },
  { key: 'manager', label: '관리자' },
  { key: 'contact', label: '연락처' },
  { key: 'status', label: '상태' },
  { key: 'actions', label: '관리' },
];

function Sites() {
  const [sites] = useState([
    {
      id: 1,
      name: '서울 건설현장 A',
      company: 'Smart Factory',
      location: '서울시 강남구',
      manager: '박현장',
      contact: '+82-10-1234-5678',
      status: '활성',
    },
    {
      id: 2,
      name: '부산 물류센터 B',
      company: 'Seoul Warehouse',
      location: '부산시 해운대구',
      manager: '최관리',
      contact: '+82-10-2345-6789',
      status: '활성',
    },
  ]);

  const handleAdd = () => {
    console.log('Add site');
  };

  const handleEdit = (id) => {
    console.log('Edit site:', id);
  };

  const handleDelete = (id) => {
    console.log('Delete site:', id);
  };

  const tableData = sites.map((site) => ({
    ...site,
    actions: (
      <div className="flex space-x-2">
        <button
          onClick={() => handleEdit(site.id)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDelete(site.id)}
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
          <h1 className="text-2xl font-bold text-gray-900">현장 관리</h1>
          <p className="text-sm text-gray-600">등록된 현장 목록</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>현장 추가</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={tableData} />
      </div>
    </div>
  );
}

export default Sites;
