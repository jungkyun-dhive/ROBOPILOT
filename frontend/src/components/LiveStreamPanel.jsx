import { Video, Map } from 'lucide-react';

function LiveStreamPanel() {
  return (
    <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">라이브 스트리밍</h2>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            LIVE
          </span>
        </div>

        {/* Live Video Feed */}
        <div className="bg-gray-900 rounded-lg overflow-hidden mb-4 aspect-video flex items-center justify-center">
          <Video className="h-12 w-12 text-gray-600" />
        </div>

        {/* Video Controls */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>건설현장 A</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>실시간</span>
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">위치 정보</h3>
        <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center">
          <Map className="h-12 w-12 text-gray-400" />
        </div>
      </div>

      {/* Status Info */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">상태 정보</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">배터리:</span>
            <span className="font-medium">87%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">고도:</span>
            <span className="font-medium">120m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">속도:</span>
            <span className="font-medium">15 km/h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">신호:</span>
            <span className="font-medium text-green-600">강함</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveStreamPanel;
