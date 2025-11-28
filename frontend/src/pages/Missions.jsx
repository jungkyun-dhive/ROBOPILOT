import { useState } from 'react';
import { Plus, Edit, Trash2, Play } from 'lucide-react';
import DataTable from '../components/DataTable';

const columns = [
  { key: 'id', label: '번호' },
  { key: 'name', label: '미션명' },
  { key: 'site', label: '현장' },
  { key: 'robot', label: '로봇/드론' },
  { key: 'type', label: '유형' },
  { key: 'schedule', label: '스케줄' },
  { key: 'status', label: '상태' },
  { key: 'actions', label: '관리' },
];

function Missions() {
  const [missions] = useState([
    {
      id: 1,
      name: '안전 순찰 미션 A',
      site: '서울 건설현장 A',
      robot: 'Matrice 4E-01',
      type: '순찰',
      schedule: '매일 09:00',
      status: '대기',
    },
    {
      id: 2,
      name: '물류 점검 미션',
      site: '부산 물류센터 B',
      robot: 'Unitree GO2-01',
      type: '점검',
      schedule: '매일 14:00',
      status: '진행중',
    },
  ]);

  const handleAdd = () => {
    console.log('Add mission');
  };

  const handleEdit = (id) => {
    console.log('Edit mission:', id);
  };

  const handleDelete = (id) => {
    console.log('Delete mission:', id);
  };

  const handleStart = (id) => {
    console.log('Start mission:', id);
  };

  const tableData = missions.map((mission) => ({
    ...mission,
    actions: (
      <div className="flex space-x-2">
        <button
          onClick={() => handleStart(mission.id)}
          className="p-1 text-green-600 hover:bg-green-50 rounded"
          title="미션 시작"
        >
          <Play className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleEdit(mission.id)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDelete(mission.id)}
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
          <h1 className="text-2xl font-bold text-gray-900">미션 관리</h1>
          <p className="text-sm text-gray-600">로봇 및 드론 미션 관리</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>미션 추가</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={tableData} />
      </div>
    </div>
  );
}

export default Missions;
