import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, MapPin, Plus, X } from 'lucide-react';

// Mock data - 실제 영상 파일 목록
const mockVideoFiles = [
  {
    id: 1,
    filename: '2025-11-19_SeoulFactory_안전순찰_라이트.mp4',
    date: '2025-11-19',
    location: 'Seoul Factory',
    mission: '안전순찰',
    robot: '라이트',
    duration: 4632, // 01:27:12
    robotStatus: {
      status: '작업중',
      battery: 90,
      networkStrength: '양호',
      gpsStrength: '양호'
    },
    operationInfo: {
      altitude: '0 m',
      speed: '0 m/s',
      operationTime: '00:00:00',
      startTime: '2025-11-19 16:25:17 (KST)'
    },
    detections: [
      { time: 204, type: 'AI 모듈 A', color: 'blue' },
      { time: 264, type: 'AI 모듈 A', color: 'blue' },
      { time: 343, type: 'AI 모듈 C', color: 'orange' },
      { time: 360, type: 'AI 모듈 C', color: 'orange' },
      { time: 424, type: 'AI 모듈 A', color: 'blue' },
      { time: 504, type: 'AI 모듈 D', color: 'green' },
      { time: 534, type: 'AI 모듈 D', color: 'green' },
      { time: 644, type: 'AI 모듈 A', color: 'blue' },
      { time: 700, type: 'AI 모듈 D', color: 'green' }
    ]
  },
  {
    id: 2,
    filename: '2025-11-23_SeoulFactory_안전순찰_라이트.mp4',
    date: '2025-11-23',
    location: 'Seoul Factory',
    mission: '안전순찰',
    robot: '라이트',
    duration: 4673, // 01:17:53
    robotStatus: {
      status: '작업중',
      battery: 84,
      networkStrength: '양호',
      gpsStrength: '약함'
    },
    operationInfo: {
      altitude: '0 m',
      speed: '0 m/s',
      operationTime: '00:00:00',
      startTime: '2025-11-23 16:15:05 (KST)'
    },
    detections: [
      { time: 195, type: 'AI 모듈 A', color: 'blue' },
      { time: 335, type: 'AI 모듈 C', color: 'orange' },
      { time: 352, type: 'AI 모듈 D', color: 'green' },
      { time: 418, type: 'AI 모듈 A', color: 'blue' },
      { time: 524, type: 'AI 모듈 D', color: 'green' },
      { time: 637, type: 'AI 모듈 C', color: 'orange' },
      { time: 692, type: 'AI 모듈 D', color: 'green' }
    ]
  }
];

const aiModules = [
  { id: 'A', label: 'AI 모듈 A', color: 'blue' },
  { id: 'B', label: 'AI 모듈 B', color: 'gray' },
  { id: 'C', label: 'AI 모듈 C', color: 'orange' },
  { id: 'D', label: 'AI 모듈 D', color: 'green' },
  { id: 'E', label: 'AI 모듈 E', color: 'gray' }
];

function Video() {
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectedAiModules, setSelectedAiModules] = useState(['A', 'C', 'D']);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const handleVideoSelect = (videoId) => {
    if (selectedVideos.includes(videoId)) {
      setSelectedVideos(selectedVideos.filter(id => id !== videoId));
    } else if (selectedVideos.length < 2) {
      setSelectedVideos([...selectedVideos, videoId]);
    }
  };

  const handleVideoRemove = (videoId) => {
    setSelectedVideos(selectedVideos.filter(id => id !== videoId));
  };

  const handleAiToggle = (moduleId) => {
    if (selectedAiModules.includes(moduleId)) {
      setSelectedAiModules(selectedAiModules.filter(id => id !== moduleId));
    } else {
      setSelectedAiModules([...selectedAiModules, moduleId]);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getSelectedVideoData = () => {
    return selectedVideos.map(id => mockVideoFiles.find(v => v.id === id));
  };

  const selectedVideoData = getSelectedVideoData();
  const maxDuration = Math.max(...selectedVideoData.map(v => v?.duration || 0));

  const renderSingleVideo = () => {
    const video = selectedVideoData[0];

    return (
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* Video Player */}
        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden relative flex items-center justify-center">
          <button className="absolute top-4 left-4 px-3 py-1.5 bg-gray-700 bg-opacity-80 text-white text-sm font-medium rounded flex items-center gap-2">
            <Play className="h-4 w-4" />
            PLAY
          </button>
          <div className="text-center">
            <Play className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">영상을 첨부해주세요</p>
          </div>
        </div>

        {/* Timeline and Controls */}
        <div className="bg-white rounded-lg p-4 space-y-3">
          {/* Timeline with Detection Markers */}
          <div className="relative h-12 bg-gray-100 rounded">
            {/* Detection markers */}
            {video?.detections.map((detection, idx) => {
              if (!selectedAiModules.includes(detection.type.split(' ')[2])) return null;
              const colorMap = {
                blue: 'bg-blue-500',
                orange: 'bg-orange-500',
                green: 'bg-green-500'
              };
              return (
                <div
                  key={idx}
                  className={`absolute top-0 bottom-0 w-1 ${colorMap[detection.color]}`}
                  style={{ left: `${(detection.time / video.duration) * 100}%` }}
                  title={`${detection.type} - ${formatTime(detection.time)}`}
                />
              );
            })}

            {/* Progress indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gray-800"
              style={{ left: `${(currentTime / maxDuration) * 100}%` }}
            />

            {/* Clickable timeline */}
            <input
              type="range"
              min="0"
              max={video?.duration || 0}
              value={currentTime}
              onChange={(e) => setCurrentTime(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded">
                <SkipBack className="h-5 w-5 text-gray-700" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                {isPlaying ? <Pause className="h-6 w-6 text-gray-700" /> : <Play className="h-6 w-6 text-gray-700" />}
              </button>
              <button className="p-2 hover:bg-gray-100 rounded">
                <SkipForward className="h-5 w-5 text-gray-700" />
              </button>
            </div>
            <div className="text-sm text-gray-700 font-medium">
              {formatTime(currentTime)} / {formatTime(video?.duration || 0)}
            </div>
          </div>
        </div>

        {/* Robot Status and Operation Info */}
        <div className="grid grid-cols-2 gap-4">
          {/* Robot Status */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">로봇 상태</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">상태</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                  {video?.robotStatus.status || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">배터리</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                  {video?.robotStatus.battery || '-'}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">네트워크 세기</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                  {video?.robotStatus.networkStrength || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">GPS 세기</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                  {video?.robotStatus.gpsStrength || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Operation Info */}
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">운행 정보</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">고도</span>
                <span className="text-sm text-gray-900">{video?.operationInfo.altitude || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">속도</span>
                <span className="text-sm text-gray-900">{video?.operationInfo.speed || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">운행 시간</span>
                <span className="text-sm text-gray-900">{video?.operationInfo.operationTime || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">시작 시간</span>
                <span className="text-sm text-gray-900">{video?.operationInfo.startTime || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderComparisonVideos = () => {
    const video1 = selectedVideoData[0];
    const video2 = selectedVideoData[1];

    return (
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* Two Video Players */}
        <div className="flex-1 flex gap-4">
          {[video1, video2].map((video, index) => (
            <div key={index} className="flex-1 bg-gray-800 rounded-lg overflow-hidden relative flex items-center justify-center">
              <button className="absolute top-4 left-4 px-3 py-1.5 bg-gray-700 bg-opacity-80 text-white text-sm font-medium rounded flex items-center gap-2">
                <Play className="h-4 w-4" />
                PLAY
              </button>
              <div className="text-center">
                <Play className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">영상 {index + 1}</p>
              </div>
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span className="text-white text-xs">{formatTime(0)} / {formatTime(video?.duration || 0)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline and Controls */}
        <div className="bg-white rounded-lg p-4 space-y-3">
          {/* Timeline */}
          <div className="relative h-12 bg-gray-100 rounded">
            {/* Detection markers for both videos */}
            {selectedVideoData.map((video, vIdx) =>
              video?.detections.map((detection, dIdx) => {
                if (!selectedAiModules.includes(detection.type.split(' ')[2])) return null;
                const colorMap = {
                  blue: vIdx === 0 ? 'bg-blue-500' : 'bg-blue-400',
                  orange: vIdx === 0 ? 'bg-orange-500' : 'bg-orange-400',
                  green: vIdx === 0 ? 'bg-green-500' : 'bg-green-400'
                };
                return (
                  <div
                    key={`${vIdx}-${dIdx}`}
                    className={`absolute ${vIdx === 0 ? 'top-0 h-1/2' : 'bottom-0 h-1/2'} w-1 ${colorMap[detection.color]}`}
                    style={{ left: `${(detection.time / maxDuration) * 100}%` }}
                    title={`영상${vIdx + 1} - ${detection.type} - ${formatTime(detection.time)}`}
                  />
                );
              })
            )}

            {/* Progress indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gray-800"
              style={{ left: `${(currentTime / maxDuration) * 100}%` }}
            />

            {/* Clickable timeline */}
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
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded">
                <SkipBack className="h-5 w-5 text-gray-700" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                {isPlaying ? <Pause className="h-6 w-6 text-gray-700" /> : <Play className="h-6 w-6 text-gray-700" />}
              </button>
              <button className="p-2 hover:bg-gray-100 rounded">
                <SkipForward className="h-5 w-5 text-gray-700" />
              </button>
            </div>
            <div className="text-sm text-gray-700 font-medium">
              {formatTime(currentTime)} / {formatTime(maxDuration)}
            </div>
          </div>
        </div>

        {/* Robot Status and Operation Info for both videos */}
        <div className="grid grid-cols-4 gap-4">
          {selectedVideoData.map((video, index) => (
            <>
              {/* Robot Status */}
              <div key={`status-${index}`} className="bg-white rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">로봇 상태</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">상태</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      {video?.robotStatus.status || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">배터리</span>
                    <span className={`px-2 py-0.5 ${index === 0 ? 'bg-green-100 text-green-700' : 'bg-green-100 text-green-700'} text-xs font-medium rounded`}>
                      {video?.robotStatus.battery || '-'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">네트워크 세기</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      {video?.robotStatus.networkStrength || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">GPS 세기</span>
                    <span className={`px-2 py-0.5 ${index === 1 && video?.robotStatus.gpsStrength === '약함' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'} text-xs font-medium rounded`}>
                      {video?.robotStatus.gpsStrength || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operation Info */}
              <div key={`info-${index}`} className="bg-white rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">운행 정보</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">고도</span>
                    <span className="text-sm text-gray-900">{video?.operationInfo.altitude || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">속도</span>
                    <span className="text-sm text-gray-900">{video?.operationInfo.speed || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">운행 시간</span>
                    <span className="text-sm text-gray-900">{video?.operationInfo.operationTime || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">시작 시간</span>
                    <span className="text-sm text-gray-900">{video?.operationInfo.startTime || '-'}</span>
                  </div>
                </div>
              </div>
            </>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">영상 재생</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        {selectedVideos.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">영상을 선택하세요</p>
            </div>
          </div>
        )}

        {selectedVideos.length === 1 && renderSingleVideo()}
        {selectedVideos.length === 2 && renderComparisonVideos()}

        {/* Right Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Video Attachment Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">영상 첨부</h3>
              <div className="space-y-2">
                {selectedVideos.map(videoId => {
                  const video = mockVideoFiles.find(v => v.id === videoId);
                  return (
                    <div key={videoId} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{video?.filename}</p>
                      </div>
                      <button
                        onClick={() => handleVideoRemove(videoId)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  );
                })}

                {selectedVideos.length < 2 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <button className="w-full flex flex-col items-center gap-2 text-gray-500 hover:text-gray-700">
                      <Plus className="h-6 w-6" />
                      <span className="text-sm">
                        {selectedVideos.length === 0 ? '파일 영상 첨부하기' : '파일을 첨부할 경우 2개'}
                      </span>
                    </button>

                    {/* Available videos list */}
                    <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                      {mockVideoFiles
                        .filter(v => !selectedVideos.includes(v.id))
                        .map(video => (
                          <button
                            key={video.id}
                            onClick={() => handleVideoSelect(video.id)}
                            className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                          >
                            {video.filename}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Modules */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">AI 모듈</h3>
              <div className="space-y-2">
                {aiModules.map((module) => {
                  const colorIndicatorMap = {
                    blue: 'bg-blue-500',
                    orange: 'bg-orange-500',
                    green: 'bg-green-500',
                    gray: 'bg-gray-300'
                  };

                  return (
                    <label
                      key={module.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAiModules.includes(module.id)}
                        onChange={() => handleAiToggle(module.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">{module.label}</span>
                      <div className={`ml-auto w-8 h-1 rounded ${colorIndicatorMap[module.color]}`} />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Map */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">이동 경로 지도</h3>
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center border border-gray-300">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">영상 첨부 이후 활성화됩니다</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Video;
