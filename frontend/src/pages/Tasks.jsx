import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, MapPin, Workflow, Bot, Video, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Power, Activity, AlertOctagon, Play, Square } from 'lucide-react';

// Mock data
const companies = [
  { id: 1, name: 'Smart Factory' },
  { id: 2, name: 'Seoul Warehouse' },
];

const sites = [
  { id: 1, name: '서울 건설현장 A', companyId: 1 },
  { id: 2, name: '부산 물류센터 B', companyId: 2 },
];

const missions = [
  { id: 1, name: '안전 순찰 미션 A', siteId: 1 },
  { id: 2, name: '물류 점검 미션', siteId: 2 },
];

const robots = [
  { id: 1, name: 'Unitree GO2-01', siteId: 1, type: '사족보행' },
  { id: 2, name: 'Matrice 4E-01', siteId: 2, type: '드론' },
];

const aiModules = [
  { id: 'person', label: '사람', enabled: true },
  { id: 'helmet', label: '안전모', enabled: true },
  { id: 'hook', label: '안전고리', enabled: true },
  { id: 'car', label: '자동차', enabled: false },
  { id: 'cone', label: '안전콘', enabled: false },
  { id: 'barrier', label: '차단벽', enabled: false },
];

function Tasks() {
  const { user } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [selectedRobotId, setSelectedRobotId] = useState('');
  const [aiDetections, setAiDetections] = useState(aiModules);
  const [missionStarted, setMissionStarted] = useState(false);

  // 권한에 따라 회사 선택 가능 여부 결정
  const isCompanySelectable = user?.role === 'SYSTEM_ADMIN';
  const userCompanyId = user?.companyId;

  // 사용자가 접근 가능한 현장 필터링
  const availableSites = selectedCompanyId
    ? sites.filter((site) => {
        const matchesCompany = site.companyId === parseInt(selectedCompanyId);
        // Operator는 할당된 현장만 볼 수 있음
        if (user?.role === 'OPERATOR') {
          return matchesCompany && user.siteIds?.includes(site.id);
        }
        return matchesCompany;
      })
    : [];

  // 현장에 따른 미션 필터링
  const availableMissions = selectedSiteId
    ? missions.filter((mission) => mission.siteId === parseInt(selectedSiteId))
    : [];

  // 현장에 따른 로봇 필터링
  const availableRobots = selectedSiteId
    ? robots.filter((robot) => robot.siteId === parseInt(selectedSiteId))
    : [];

  // 선택된 로봇 정보
  const selectedRobot = robots.find((r) => r.id === parseInt(selectedRobotId));

  const handleAiToggle = (moduleId) => {
    setAiDetections(
      aiDetections.map((module) =>
        module.id === moduleId ? { ...module, enabled: !module.enabled } : module
      )
    );
  };

  // 작업 시작 버튼 활성화 조건
  const canStartMission = (selectedCompanyId || userCompanyId) && selectedSiteId && selectedMissionId && selectedRobotId;

  const handleMissionToggle = () => {
    setMissionStarted(!missionStarted);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Center and Bottom Section */}
        <div className="flex-1 flex flex-col p-4 space-y-4">
          {/* Top Selection Bar with Mission Start Button */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex gap-3 items-end">
              {/* Company Selection */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Building2 className="inline h-3 w-3 mr-1" />
                  회사
                </label>
                <select
                  value={selectedCompanyId || (userCompanyId || '')}
                  onChange={(e) => {
                    setSelectedCompanyId(e.target.value);
                    setSelectedSiteId('');
                    setSelectedMissionId('');
                    setSelectedRobotId('');
                  }}
                  disabled={!isCompanySelectable}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                >
                  <option value="">회사 선택</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Site Selection */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <MapPin className="inline h-3 w-3 mr-1" />
                  현장
                </label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => {
                    setSelectedSiteId(e.target.value);
                    setSelectedMissionId('');
                    setSelectedRobotId('');
                  }}
                  disabled={!selectedCompanyId && !userCompanyId}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">현장 선택</option>
                  {availableSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mission Selection */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Workflow className="inline h-3 w-3 mr-1" />
                  미션
                </label>
                <select
                  value={selectedMissionId}
                  onChange={(e) => setSelectedMissionId(e.target.value)}
                  disabled={!selectedSiteId}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">미션 선택</option>
                  {availableMissions.map((mission) => (
                    <option key={mission.id} value={mission.id}>
                      {mission.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Robot Selection */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Bot className="inline h-3 w-3 mr-1" />
                  로봇
                </label>
                <select
                  value={selectedRobotId}
                  onChange={(e) => setSelectedRobotId(e.target.value)}
                  disabled={!selectedSiteId}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">로봇 선택</option>
                  {availableRobots.map((robot) => (
                    <option key={robot.id} value={robot.id}>
                      {robot.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mission Start Button */}
              <div>
                <button
                  onClick={handleMissionToggle}
                  disabled={!canStartMission}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                    !canStartMission
                      ? 'bg-gray-500 text-white cursor-not-allowed'
                      : missionStarted
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  {missionStarted ? (
                    <>
                      <Square className="h-4 w-4" />
                      작업 중지
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      작업 시작
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Video Feed */}
          <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
            {selectedRobotId ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Video className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    {selectedRobot?.name} 카메라 영상
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    실시간 영상 스트리밍 대기 중...
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Video className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">로봇을 선택하세요</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section */}
          <div className="h-64 grid grid-cols-2 gap-4">
            {/* Left Bottom - Placeholder */}
            <div className="bg-gray-800 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">예약된 공간</p>
            </div>

            {/* Right Bottom - Map */}
            <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">이동 경로 지도</p>
                  {selectedRobotId && (
                    <p className="text-sm text-gray-400 mt-2">
                      {selectedRobot?.name} 위치 추적 중...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Robot Status and Operation Info */}
            <div className="grid grid-cols-2 gap-4">
              {/* Robot Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">로봇 상태</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">상태</span>
                    <span className={`text-xs font-medium mt-1 ${selectedRobotId && missionStarted ? 'text-green-600' : 'text-gray-900'}`}>
                      {selectedRobotId ? (missionStarted ? '작업 중' : '대기') : '-'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">배터리</span>
                    <span className="text-xs font-medium text-gray-900 mt-1">
                      {selectedRobotId ? '85%' : '-'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">네트워크 세기</span>
                    <span className="text-xs font-medium text-gray-900 mt-1">-</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">GPS 세기</span>
                    <span className="text-xs font-medium text-gray-900 mt-1">-</span>
                  </div>
                </div>
              </div>

              {/* Operation Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">운행 정보</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">고도</span>
                    <span className="text-xs font-medium text-gray-900 mt-1">
                      {selectedRobotId ? '0m/s' : '-'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">속도</span>
                    <span className="text-xs font-medium text-gray-900 mt-1">
                      {selectedRobotId ? '0m/s' : '-'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">운행 시간</span>
                    <span className="text-xs font-medium text-gray-900 mt-1">
                      {selectedRobotId && missionStarted ? '00:00:00' : '-'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">시작 시간</span>
                    <span className="text-xs font-medium text-gray-900 mt-1">
                      {selectedRobotId && missionStarted ? new Date().toLocaleString('ko-KR') : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Modules Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">AI 모듈</h3>
              <div className="space-y-2">
                {aiDetections.map((module) => (
                  <label
                    key={module.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={module.enabled}
                      onChange={() => handleAiToggle(module.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {module.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Control Panel */}
            {selectedRobotId && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {selectedRobot?.type === '드론' ? '드론 제어' : '로봇 제어'}
                </h3>
                {selectedRobot?.type === '드론' ? (
                  <div className="space-y-3">
                    {/* Drone Controls */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-3 flex justify-center">
                        <button className="p-3 bg-blue-100 rounded-lg hover:bg-blue-200">
                          <ChevronUp className="h-6 w-6 text-blue-600" />
                        </button>
                      </div>
                      <button className="p-3 bg-blue-100 rounded-lg hover:bg-blue-200">
                        <ChevronLeft className="h-6 w-6 text-blue-600" />
                      </button>
                      <button className="p-3 bg-green-100 rounded-lg hover:bg-green-200">
                        <Power className="h-6 w-6 text-green-600" />
                      </button>
                      <button className="p-3 bg-blue-100 rounded-lg hover:bg-blue-200">
                        <ChevronRight className="h-6 w-6 text-blue-600" />
                      </button>
                      <div className="col-span-3 flex justify-center">
                        <button className="p-3 bg-blue-100 rounded-lg hover:bg-blue-200">
                          <ChevronDown className="h-6 w-6 text-blue-600" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm font-medium">
                        자동 이륙
                      </button>
                      <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium">
                        비상 착륙
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Robot Controls */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-3 flex justify-center">
                        <button className="p-3 bg-blue-100 rounded-lg hover:bg-blue-200">
                          <ChevronUp className="h-6 w-6 text-blue-600" />
                        </button>
                      </div>
                      <button className="p-3 bg-blue-100 rounded-lg hover:bg-blue-200">
                        <ChevronLeft className="h-6 w-6 text-blue-600" />
                      </button>
                      <button className="p-3 bg-red-100 rounded-lg hover:bg-red-200">
                        <Power className="h-6 w-6 text-red-600" />
                      </button>
                      <button className="p-3 bg-blue-100 rounded-lg hover:bg-blue-200">
                        <ChevronRight className="h-6 w-6 text-blue-600" />
                      </button>
                      <div className="col-span-3 flex justify-center">
                        <button className="p-3 bg-blue-100 rounded-lg hover:bg-blue-200">
                          <ChevronDown className="h-6 w-6 text-blue-600" />
                        </button>
                      </div>
                    </div>
                    <button className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium flex items-center justify-center gap-2">
                      <AlertOctagon className="h-4 w-4" />
                      비상 정지
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tasks;
