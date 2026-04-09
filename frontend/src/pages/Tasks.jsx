import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { companyApi, siteApi, missionApi, robotApi } from '../utils/api';
import { MonitorX, Play, Square } from 'lucide-react';

const generalItems = [
  { id: 'construction', label: 'Construction', negLabel: 'No Construction' },
  { id: 'hardhat', label: 'HardHat', negLabel: 'No HardHat' },
  { id: 'machinery', label: 'Machinery', negLabel: '' },
  { id: 'mask', label: 'Mask', negLabel: 'No Mask' },
];

const dangerItems = [
  { id: 'no_hardhat', label: 'No HardHat', negLabel: '' },
  { id: 'no_safety_vest', label: 'No Safety Vest', negLabel: '' },
  { id: 'no_mask', label: 'No Mask', negLabel: '' },
  { id: 'fire', label: 'Fire', negLabel: '' },
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

function Tasks() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [sites, setSites] = useState([]);
  const [missions, setMissions] = useState([]);
  const [robots, setRobots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [selectedRobotId, setSelectedRobotId] = useState('');
  const [missionStarted, setMissionStarted] = useState(false);
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

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (user && user.role !== 'SYSTEM_ADMIN' && user.companyId && !selectedCompanyId) {
      setSelectedCompanyId(user.companyId);
    }
  }, [user, selectedCompanyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [companiesData, sitesData, missionsData, robotsData] = await Promise.all([
        companyApi.getAll(), siteApi.getAll(), missionApi.getAll(), robotApi.getAll(),
      ]);
      setCompanies(companiesData || []);
      setSites(sitesData || []);
      setMissions(missionsData || []);
      setRobots(robotsData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isCompanySelectable = user?.role === 'SYSTEM_ADMIN';
  const userCompanyId = user?.companyId;
  const effectiveCompanyId = selectedCompanyId || userCompanyId;

  const availableSites = effectiveCompanyId
    ? sites.filter((site) => {
        const matchesCompany = site.companyId === effectiveCompanyId;
        if (user?.role === 'OPERATOR') return matchesCompany && user.siteIds?.includes(site.id);
        return matchesCompany;
      })
    : [];

  const availableMissions = selectedSiteId
    ? missions.filter((m) => m.siteId === selectedSiteId)
    : [];

  const availableRobots = selectedSiteId
    ? robots.filter((r) => r.siteId === selectedSiteId)
    : [];

  const canStartMission = (selectedCompanyId || userCompanyId) && selectedSiteId && selectedMissionId && selectedRobotId;

  const formatDateTime = (date) =>
    date.toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });

  const generalCount = Object.values(generalToggles).filter(Boolean).length;
  const dangerCount = Object.values(dangerToggles).filter(Boolean).length;

  const selectClass = "px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-400 appearance-none pr-7";

  const VideoPanel = ({ label }) => (
    <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden flex flex-col">
      <div className="px-3 py-1.5">
        <span className="text-xs font-medium text-gray-400 bg-gray-700 px-2 py-0.5 rounded">{label}</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center pb-4">
        <MonitorX className="h-12 w-12 text-gray-600" />
        <p className="text-gray-500 text-sm">작업 시작 이후 활성화됩니다</p>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">작업</h1>
        <p className="text-sm text-gray-500 mt-0.5">{formatDateTime(now)} (KST, UTC+09:00)</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Filter + Videos */}
        <div className="flex-1 flex flex-col p-4 gap-3 min-w-0">
          {/* Filter Bar */}
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-2 flex-wrap">
            <div className="relative">
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
            </div>
            <div className="relative">
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
            </div>
            <div className="relative">
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
            </div>
            <div className="relative">
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
            </div>
            <button
              onClick={() => setMissionStarted(!missionStarted)}
              disabled={!canStartMission}
              className={`ml-auto px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
                !canStartMission
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : missionStarted
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-700 text-white hover:bg-gray-800'
              }`}
            >
              {missionStarted ? <><Square className="h-3.5 w-3.5" />작업 중지</> : <><Play className="h-3.5 w-3.5" />작업 시작</>}
            </button>
          </div>

          {/* Two Video Panels stacked */}
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <VideoPanel label="OFFLINE" />
            <VideoPanel label="OFFLINE" />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-4">
            {/* Robot Status + Operation Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">로봇 상태</h3>
                <div className="space-y-2">
                  {[['상태', '-'], ['배터리', '-'], ['네트워크 세기', '-'], ['GPS 세기', '-']].map(([label, val]) => (
                    <div key={label} className="flex flex-col">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-xs font-medium text-gray-900 mt-0.5">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">운행 정보</h3>
                <div className="space-y-2">
                  {[['고도', '-'], ['속도', '-'], ['운행 시간', '-'], ['시작 시간', '-']].map(([label, val]) => (
                    <div key={label} className="flex flex-col">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-xs font-medium text-gray-900 mt-0.5">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* AI Model Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">AI 모델</h3>

              {/* Category Headers */}
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

              {/* Detection Items Grid */}
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tasks;
