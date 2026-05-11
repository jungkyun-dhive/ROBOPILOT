import { useState } from 'react';
import { Search, MoreHorizontal } from 'lucide-react';

const mockHistory = [
  { id: 1, createdAt: '2026-04-09 10:03:13', company: 'FPT', site: 'Duy Tan', mission: 'TestForDrone', robot: 'M4E Display Name', operator: 'bob', detections: 24 },
  { id: 2, createdAt: '2026-04-09 10:02:23', company: 'FPT', site: 'Duy Tan', mission: 'TestForDrone', robot: 'M4E Display Name', operator: 'bob', detections: 54 },
  { id: 3, createdAt: '2026-04-09 09:39:38', company: 'FPT', site: 'Duy Tan', mission: 'TestForDrone', robot: 'M4E Display Name', operator: 'bob', detections: 120 },
  { id: 4, createdAt: '2026-04-09 09:23:54', company: 'FPT', site: 'Duy Tan', mission: 'TestForDrone', robot: 'M4E Display Name', operator: 'bob', detections: 30 },
  { id: 5, createdAt: '2026-04-09 09:18:39', company: '현대건설', site: '힐스테이트 도안2단지', mission: 'TestforGO2', robot: 'Unitree GO2', operator: 'sysadmin', detections: 567 },
  { id: 6, createdAt: '2026-04-09 09:16:40', company: '현대건설', site: '힐스테이트 도안2단지', mission: 'TestforGO2', robot: 'Unitree GO2', operator: 'alice', detections: 29 },
  { id: 7, createdAt: '2026-04-09 09:11:17', company: 'FPT', site: 'Duy Tan', mission: 'TestForDrone', robot: 'M4E Display Name', operator: 'alice', detections: 29 },
  { id: 8, createdAt: '2026-04-09 09:10:30', company: '현대건설', site: '힐스테이트 도안2단지', mission: 'TestforGO2', robot: 'Unitree GO2', operator: 'bob', detections: 0 },
  { id: 9, createdAt: '2026-04-09 08:55:28', company: '현대건설', site: '힐스테이트 도안2단지', mission: 'TestforGO2', robot: 'Unitree GO2', operator: 'sysadmin', detections: 48 },
  { id: 10, createdAt: '2026-04-09 08:53:59', company: '현대건설', site: '힐스테이트 도안2단지', mission: 'TestforGO2', robot: 'Unitree GO2', operator: 'bob', detections: 7 },
  { id: 11, createdAt: '2026-04-09 08:40:12', company: 'FPT', site: 'Pham Van Bach', mission: 'PatrolMission', robot: 'DJI Matrice 4E Drone 1', operator: 'fpt.manager', detections: 33 },
  { id: 12, createdAt: '2026-04-09 08:30:05', company: '현대건설', site: '힐스테이트 도안2단지', mission: 'TestforGO2', robot: 'Unitree GO2', operator: 'sysadmin', detections: 88 },
  { id: 13, createdAt: '2026-04-08 17:52:10', company: 'FPT', site: 'Duy Tan', mission: 'TestForDrone', robot: 'M4E Display Name', operator: 'bob', detections: 15 },
  { id: 14, createdAt: '2026-04-08 16:44:33', company: '현대건설', site: '힐스테이트 도안2단지', mission: 'InspectionMission', robot: 'Unitree GO2', operator: 'alice', detections: 42 },
  { id: 15, createdAt: '2026-04-08 15:30:00', company: 'FPT', site: 'Pham Van Bach', mission: 'PatrolMission', robot: 'DJI Matrice 4E Drone 1', operator: 'operator', detections: 0 },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function History() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = mockHistory.filter((row) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      row.company.toLowerCase().includes(term) ||
      row.site.toLowerCase().includes(term) ||
      row.mission.toLowerCase().includes(term) ||
      row.robot.toLowerCase().includes(term) ||
      row.operator.toLowerCase().includes(term);

    const matchesFrom = !dateFrom || row.createdAt >= dateFrom;
    const matchesTo = !dateTo || row.createdAt <= dateTo + ' 23:59:59';

    return matchesSearch && matchesFrom && matchesTo;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">히스토리</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
          })} (KST, UTC+09:00)
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            placeholder="From"
          />
          <span className="text-gray-400 text-sm">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            placeholder="To"
          />
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search History"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-4 pr-9 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2">
            <Search className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {['번호', '생성 일시', '회사명', '사이트명', '미션명', '로봇명', '작업자', '총 인식 건수'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">
                    {!['번호'].includes(col) && <span className="mr-1 text-gray-300">⇅</span>}
                    {col}
                  </th>
                ))}
                <th className="px-4 py-3 border-b border-gray-200" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                    데이터가 없습니다
                  </td>
                </tr>
              ) : (
                paged.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{row.createdAt}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.company}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.site}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.mission}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.robot}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.operator}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.detections}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            {getPageNumbers().map((p) => (
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
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="text-gray-400 text-xs px-1">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-7 h-7 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s} / page</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;
