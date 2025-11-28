import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '../components/DataTable';

const columns = [
  { key: 'id', label: '번호' },
  { key: 'name', label: '이름' },
  { key: 'username', label: '아이디' },
  { key: 'email', label: '이메일' },
  { key: 'role', label: '권한' },
  { key: 'company', label: '소속' },
  { key: 'status', label: '상태' },
  { key: 'actions', label: '관리' },
];

function Users() {
  const [users] = useState([
    {
      id: 1,
      name: '김관리',
      username: 'admin01',
      email: 'admin01@robopilot.com',
      role: '관리자',
      company: 'ROBOPILOT',
      status: '활성',
    },
    {
      id: 2,
      name: '이운영',
      username: 'operator01',
      email: 'operator01@robopilot.com',
      role: '운영자',
      company: 'Smart Factory',
      status: '활성',
    },
    {
      id: 3,
      name: '박현장',
      username: 'user01',
      email: 'user01@robopilot.com',
      role: '사용자',
      company: 'Seoul Warehouse',
      status: '활성',
    },
  ]);

  const handleAdd = () => {
    console.log('Add user');
  };

  const handleEdit = (id) => {
    console.log('Edit user:', id);
  };

  const handleDelete = (id) => {
    console.log('Delete user:', id);
  };

  const tableData = users.map((user) => ({
    ...user,
    actions: (
      <div className="flex space-x-2">
        <button
          onClick={() => handleEdit(user.id)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDelete(user.id)}
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

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={tableData} />
      </div>
    </div>
  );
}

export default Users;
