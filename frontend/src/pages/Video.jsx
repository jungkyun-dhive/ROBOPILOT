import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, MapPin, MonitorX, Image } from 'lucide-react';
import { companyApi, siteApi, missionApi, robotApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const generalItems = [
  { id: 'construction', label: 'Construction' },
  { id: 'hardhat', label: 'HardHat' },
  { id: 'machinery', label: 'Machinery' },
  { id: 'mask', label: 'Mask' },
];

const dangerItems = [
  { id: 'no_hardhat', label: 'No HardHat' },
  { id: 'no_safety_vest', label: 'No Safety Vest' },
  { id: 'no_mask', label: 'No Mask' },
  { id: 'fire', label: 'Fire' },
];

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? 'bg-orange-400' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function Video() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [sites, setSites] = useState([]);
  const [missions, setMissions] = useState([]);
  const [robots, setRobots] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [selectedRobotId, setSelectedRobotId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [generalEnabled, setGeneralEnabled] = useState(true);
  const [dangerEnabled, setDangerEnabled] = useState(true);
  const [generalToggles, setGeneralToggles] = useState(
    Object.fromEntries(generalItems.map((i) => [i.id, true]))
  );
  const [dangerToggles, setDangerToggles] = useState(
    Object.fromEntries(dangerItems.map((i) => [i.id, true]))
  );
  const [now, setNow] = useState(new Date());
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user && user.role !== 'SYSTEM_ADMIN' && user.companyId && !selectedCompanyId) {
      setSelectedCompanyId(user.companyId);
    }
  }, [user, selectedCompanyId]);

  const loadData = async () => {
    try {
      const [companiesData, sitesData, missionsData, robotsData] = await Promise.all([
        companyApi.getAll(), siteApi.getAll(), missionApi.getAll(), robotApi.getAll(),
      ]);
      setCompanies(companiesData || []);
      setSites(sitesData || []);
      setMissions(missionsData || []);
      setRobots(robotsData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const formatDateTime = (date) =>
    date.toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCompanySelectable = user?.role === 'SYSTEM_ADMIN';
  const userCompanyId = user?.companyId;
  const effectiveCompanyId = selectedCompanyId || userCompanyId;

  const availableSites = effectiveCompanyId
    ? sites.filter((s) => s.companyId === effectiveCompanyId)
    : [];
  const availableRobots = selectedSiteId
    ? robots.filter((r) => r.siteId === selectedSiteId)
    : [];
  const availableMissions = selectedSiteId
    ? missions.filter((m) => m.siteId === selectedSiteId)
    : [];

  const selectClass = "px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-400 appearance-none";

  const generalCount = Object.values(generalToggles).filter(Boolean).length;
  const dangerCount = Object.values(dangerToggles).filter(Boolean).length;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">영상 재생</h1>
        <p className="text-sm text-gray-500 mt-0.5">{formatDateTime(now)} (KST, UTC+09:00)</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col p-4 gap-3 min-w-0">
          {/* Filter Bar */}
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-2 flex-wrap">
            <select
              value={selectedCompanyId || (userCompanyId || '')}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                setSelectedSiteId('');
                setSelectedMissionId('');
                setSelectedRobotId('');
              }}
              disabled={!isCompanySelectable}
              className={selectClass}
            >
              <option value="">회사 선택</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedSiteId}
              onChange={(e) => {
                setSelectedSiteId(e.target.value);
                setSelectedMissionId('');
                setSelectedRobotId('');
              }}
              disabled={!effectiveCompanyId}
              className={selectClass}
            >
              <option value="">사이트 선택</option>
              {availableSites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={selectedRobotId}
              onChange={(e) => setSelectedRobotId(e.target.value)}
              disabled={!selectedSiteId}
              className={selectClass}
            >
              <option value="">로봇 선택</option>
              {availableRobots.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            <select
              value={selectedMissionId}
              onChange={(e) => setSelectedMissionId(e.target.value)}
              disabled={!selectedSiteId}
              className={selectClass}
            >
              <option value="">미션 선택</option>
              {availableMissions.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <select disabled className={selectClass}>
              <option value="">영상 정보</option>
            </select>
          </div>

          {/* Video Player */}
          <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden flex flex-col items-center justify-center min-h-0">
            <MonitorX className="h-14 w-14 text-gray-600 mb-3" />
            <p className="text-gray-500 text-sm">작업 시작 이후 활성화됩니다</p>
          </div>

          {/* Playback Controls */}
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <div className="h-1.5 bg-gray-200 rounded-full mb-3">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '0%' }} />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-gray-100 rounded">
                <SkipBack className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 hover:bg-gray-100 rounded"
              >
                {isPlaying
                  ? <Pause className="h-5 w-5 text-gray-700" />
                  : <Play className="h-5 w-5 text-gray-700" />}
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded">
                <SkipForward className="h-4 w-4 text-gray-600" />
              </button>
              <span className="ml-auto text-sm text-gray-600 font-medium">
                {formatTime(currentTime)} / 00:00:00
              </span>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-4">
            {/* Video Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">영상 정보</h3>
              <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center gap-2 min-h-20">
                <Image className="h-8 w-8 text-gray-300" />
                <p className="text-xs text-gray-400 text-center">전반적인 영상을 선택해 주세요</p>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* AI Model */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">AI 모델</h3>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Toggle enabled={generalEnabled} onChange={() => setGeneralEnabled(!generalEnabled)} />
                  <span className="text-xs font-medium text-gray-700">일반 감지</span>
                  <span className="text-xs text-gray-400">({generalCount}/{generalItems.length})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Toggle enabled={dangerEnabled} onChange={() => setDangerEnabled(!dangerEnabled)} />
                  <span className="text-xs font-medium text-gray-700">위험 감지</span>
                  <span className="text-xs text-gray-400">({dangerCount}/{dangerItems.length})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                {generalItems.map((item, idx) => (
                  <div key={item.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs bg-orange-400 text-white px-1.5 py-0.5 rounded font-medium leading-none">YOLO</span>
                      <span className="text-xs text-gray-700 flex-1 truncate">{item.label}</span>
                      <Toggle
                        enabled={generalToggles[item.id]}
                        onChange={() => setGeneralToggles((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                      />
                    </div>
                    {dangerItems[idx] && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs bg-orange-400 text-white px-1.5 py-0.5 rounded font-medium leading-none">YOLO</span>
                        <span className="text-xs text-gray-700 flex-1 truncate">{dangerItems[idx].label}</span>
                        <Toggle
                          enabled={dangerToggles[dangerItems[idx].id]}
                          onChange={() => setDangerToggles((prev) => ({ ...prev, [dangerItems[idx].id]: !prev[dangerItems[idx].id] }))}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Map */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">이동 경로 지도</h3>
              <div className="bg-gray-100 rounded-lg h-48 flex flex-col items-center justify-center gap-2 border border-gray-200">
                <MapPin className="h-8 w-8 text-gray-400" />
                <p className="text-xs text-gray-400 text-center">영상 첨부 이후 활성화됩니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Video;
