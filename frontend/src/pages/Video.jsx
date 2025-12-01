import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, MapPin, Workflow, Bot, Play, Pause, SkipBack, SkipForward, Volume2, Maximize, Bookmark } from 'lucide-react';

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
  { id: 1, name: '안전 순찰 미션 A', siteId: 1, date: '2025-11-19 16:25:17' },
  { id: 2, name: '물류 점검 미션', siteId: 2, date: '2025-11-19 14:30:00' },
];

const robots = [
  { id: 1, name: 'Unitree GO2-01', siteId: 1 },
  { id: 2, name: 'Matrice 4E-01', siteId: 2 },
];

const aiModules = [
  { id: 'person', label: '사람' },
  { id: 'helmet', label: '안전모' },
  { id: 'hook', label: '안전고리' },
  { id: 'car', label: '자동차' },
  { id: 'cone', label: '안전콘' },
  { id: 'barrier', label: '차단벽' },
];

// Mock video data
const videoData = [
  {
    id: 1,
    missionId: 1,
    robotId: 1,
    duration: 2463, // 00:41:03 in seconds
    battery: 75,
    altitude: 15,
    speed: 2.5,
    gps: '강함',
    detections: [
      { time: 150, type: 'person' },
      { time: 320, type: 'helmet' },
      { time: 890, type: 'person' },
      { time: 1200, type: 'car' },
    ],
  },
  {
    id: 2,
    missionId: 2,
    robotId: 2,
    duration: 1800, // 00:30:00 in seconds
    battery: 82,
    altitude: 25,
    speed: 3.2,
    gps: '양호',
    detections: [
      { time: 200, type: 'person' },
      { time: 450, type: 'car' },
      { time: 1000, type: 'helmet' },
    ],
  },
];

function Video() {
  const { user } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedMissions, setSelectedMissions] = useState([]);
  const [selectedRobots, setSelectedRobots] = useState([]);
  const [selectedAiModules, setSelectedAiModules] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [timeOffset1, setTimeOffset1] = useState(0);
  const [timeOffset2, setTimeOffset2] = useState(0);

  const isCompanySelectable = user?.role === 'SYSTEM_ADMIN';
  const userCompanyId = user?.companyId;

  const availableSites = selectedCompanyId
    ? sites.filter((site) => {
        const matchesCompany = site.companyId === parseInt(selectedCompanyId);
        if (user?.role === 'OPERATOR') {
          return matchesCompany && user.siteIds?.includes(site.id);
        }
        return matchesCompany;
      })
    : [];

  const availableMissions = selectedSiteId
    ? missions.filter((mission) => mission.siteId === parseInt(selectedSiteId))
    : [];

  const availableRobots = selectedSiteId
    ? robots.filter((robot) => robot.siteId === parseInt(selectedSiteId))
    : [];

  const handleMissionToggle = (missionId) => {
    setSelectedMissions((prev) => {
      if (prev.includes(missionId)) {
        return prev.filter((id) => id !== missionId);
      }
      if (prev.length < 2) {
        return [...prev, missionId];
      }
      return prev;
    });
  };

  const handleRobotToggle = (robotId) => {
    setSelectedRobots((prev) => {
      if (prev.includes(robotId)) {
        return prev.filter((id) => id !== robotId);
      }
      if (prev.length < 2) {
        return [...prev, robotId];
      }
      return prev;
    });
  };

  const handleAiToggle = (moduleId) => {
    setSelectedAiModules((prev) => {
      if (prev.includes(moduleId)) {
        return prev.filter((id) => id !== moduleId);
      }
      return [...prev, moduleId];
    });
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getVideoDataForRobot = (robotId) => {
    return videoData.find((v) => v.robotId === robotId);
  };

  const selectedVideo1 = selectedRobots.length > 0 ? getVideoDataForRobot(selectedRobots[0]) : null;
  const selectedVideo2 = selectedRobots.length > 1 ? getVideoDataForRobot(selectedRobots[1]) : null;

  const maxDuration = Math.max(
    selectedVideo1?.duration || 0,
    selectedVideo2?.duration || 0
  );

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Left Sidebar - Selection */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">영상 선택</h2>

          {/* Company Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="inline h-4 w-4 mr-1" />
              회사
            </label>
            <select
              value={selectedCompanyId || (userCompanyId || '')}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                setSelectedSiteId('');
                setSelectedMissions([]);
                setSelectedRobots([]);
              }}
              disabled={!isCompanySelectable}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">회사를 선택하세요</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Site Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline h-4 w-4 mr-1" />
              현장
            </label>
            <select
              value={selectedSiteId}
              onChange={(e) => {
                setSelectedSiteId(e.target.value);
                setSelectedMissions([]);
                setSelectedRobots([]);
              }}
              disabled={!selectedCompanyId && !userCompanyId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">현장을 선택하세요</option>
              {availableSites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mission Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Workflow className="inline h-4 w-4 mr-1" />
              미션 선택 (최대 2개)
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
              {availableMissions.length > 0 ? (
                availableMissions.map((mission) => (
                  <label
                    key={mission.id}
                    className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMissions.includes(mission.id)}
                      onChange={() => handleMissionToggle(mission.id)}
                      disabled={!selectedMissions.includes(mission.id) && selectedMissions.length >= 2}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <div className="flex-1 text-sm">
                      <div className="font-medium text-gray-900">{mission.name}</div>
                      <div className="text-xs text-gray-500">{mission.date}</div>
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">현장을 선택하세요</p>
              )}
            </div>
          </div>

          {/* Robot Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Bot className="inline h-4 w-4 mr-1" />
              로봇 선택 (최대 2개)
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
              {availableRobots.length > 0 ? (
                availableRobots.map((robot) => (
                  <label
                    key={robot.id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRobots.includes(robot.id)}
                      onChange={() => handleRobotToggle(robot.id)}
                      disabled={!selectedRobots.includes(robot.id) && selectedRobots.length >= 2}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-900">{robot.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">현장을 선택하세요</p>
              )}
            </div>
          </div>

          {/* AI Module Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI 감지 모듈
            </label>
            <div className="space-y-2">
              {aiModules.map((module) => (
                <label
                  key={module.id}
                  className="flex items-center space-x-2 p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedAiModules.includes(module.id)}
                    onChange={() => handleAiToggle(module.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{module.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Video Players */}
        <div className={`flex-1 flex ${selectedRobots.length === 2 ? 'divide-x divide-gray-300' : ''}`}>
          {/* Video 1 */}
          {selectedRobots.length > 0 && (
            <div className="flex-1 flex flex-col bg-black">
              <div className="flex-1 flex items-center justify-center relative">
                <div className="absolute top-4 left-4 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded">
                  {robots.find((r) => r.id === selectedRobots[0])?.name}
                </div>
                <div className="text-center">
                  <Play className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">영상 재생 영역</p>
                </div>
              </div>
              {selectedRobots.length === 2 && (
                <div className="bg-gray-900 p-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-white text-sm font-medium w-20">시간 조정</span>
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      value={timeOffset1}
                      onChange={(e) => setTimeOffset1(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-white text-sm w-16 text-right">
                      {timeOffset1 > 0 ? '+' : ''}{timeOffset1}초
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Video 2 */}
          {selectedRobots.length === 2 && (
            <div className="flex-1 flex flex-col bg-black">
              <div className="flex-1 flex items-center justify-center relative">
                <div className="absolute top-4 left-4 px-3 py-1 bg-green-600 text-white text-sm font-medium rounded">
                  {robots.find((r) => r.id === selectedRobots[1])?.name}
                </div>
                <div className="text-center">
                  <Play className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">영상 재생 영역</p>
                </div>
              </div>
              <div className="bg-gray-900 p-3">
                <div className="flex items-center space-x-3">
                  <span className="text-white text-sm font-medium w-20">시간 조정</span>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    value={timeOffset2}
                    onChange={(e) => setTimeOffset2(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-white text-sm w-16 text-right">
                    {timeOffset2 > 0 ? '+' : ''}{timeOffset2}초
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {selectedRobots.length === 0 && (
            <div className="flex-1 bg-black flex items-center justify-center">
              <div className="text-center">
                <Play className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">로봇을 선택하세요</p>
              </div>
            </div>
          )}
        </div>

        {/* Timeline with Bookmarks */}
        {selectedRobots.length > 0 && (
          <div className="bg-gray-800 p-4">
            <div className="space-y-3">
              {/* Timeline */}
              <div className="relative h-16 bg-gray-700 rounded-lg overflow-hidden">
                {/* Video 1 Bookmarks */}
                {selectedVideo1 && selectedVideo1.detections.map((detection, idx) => (
                  <div
                    key={`v1-${idx}`}
                    className="absolute top-0 w-1 h-8 bg-blue-500 cursor-pointer hover:bg-blue-400"
                    style={{ left: `${(detection.time / maxDuration) * 100}%` }}
                    title={`${aiModules.find((m) => m.id === detection.type)?.label} - ${formatTime(detection.time)}`}
                  >
                    <Bookmark className="h-4 w-4 text-blue-500 absolute -top-1 -left-1.5" fill="currentColor" />
                  </div>
                ))}

                {/* Video 2 Bookmarks */}
                {selectedVideo2 && selectedVideo2.detections.map((detection, idx) => (
                  <div
                    key={`v2-${idx}`}
                    className="absolute bottom-0 w-1 h-8 bg-green-500 cursor-pointer hover:bg-green-400"
                    style={{ left: `${(detection.time / maxDuration) * 100}%` }}
                    title={`${aiModules.find((m) => m.id === detection.type)?.label} - ${formatTime(detection.time)}`}
                  >
                    <Bookmark className="h-4 w-4 text-green-500 absolute -bottom-1 -left-1.5" fill="currentColor" />
                  </div>
                ))}

                {/* Progress Bar */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white"
                  style={{ left: `${(currentTime / maxDuration) * 100}%` }}
                />

                {/* Timeline Click Area */}
                <input
                  type="range"
                  min="0"
                  max={maxDuration}
                  value={currentTime}
                  onChange={(e) => setCurrentTime(parseInt(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white">
                    <SkipBack className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </button>
                  <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white">
                    <SkipForward className="h-5 w-5" />
                  </button>
                  <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white">
                    <Volume2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(maxDuration)}
                </div>

                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white">
                  <Maximize className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Status and Map */}
      <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Video 1 Status */}
          {selectedVideo1 && (
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">
                {robots.find((r) => r.id === selectedRobots[0])?.name} 상태
              </h3>
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">배터리</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${selectedVideo1.battery}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{selectedVideo1.battery}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">고도</span>
                  <span className="text-sm font-medium text-gray-900">{selectedVideo1.altitude}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">속도</span>
                  <span className="text-sm font-medium text-gray-900">{selectedVideo1.speed}m/s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">GPS 신호</span>
                  <span className="text-sm font-medium text-gray-900">{selectedVideo1.gps}</span>
                </div>
              </div>
            </div>
          )}

          {/* Video 2 Status */}
          {selectedVideo2 && (
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-3">
                {robots.find((r) => r.id === selectedRobots[1])?.name} 상태
              </h3>
              <div className="bg-green-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">배터리</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${selectedVideo2.battery}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{selectedVideo2.battery}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">고도</span>
                  <span className="text-sm font-medium text-gray-900">{selectedVideo2.altitude}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">속도</span>
                  <span className="text-sm font-medium text-gray-900">{selectedVideo2.speed}m/s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">GPS 신호</span>
                  <span className="text-sm font-medium text-gray-900">{selectedVideo2.gps}</span>
                </div>
              </div>
            </div>
          )}

          {/* Map */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">이동 경로</h3>
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center border border-gray-300">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">지도 표시 영역</p>
                {selectedRobots.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {selectedVideo1 && (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">
                          {robots.find((r) => r.id === selectedRobots[0])?.name}
                        </span>
                      </div>
                    )}
                    {selectedVideo2 && (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">
                          {robots.find((r) => r.id === selectedRobots[1])?.name}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Video;
