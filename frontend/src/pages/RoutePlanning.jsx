import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Map, Plus, Trash2, Download, RotateCcw, MousePointer, Move,
  ChevronRight, ChevronDown, ZoomIn, ZoomOut, Maximize2
} from 'lucide-react';

// ─── Mock LiDAR map data ────────────────────────────────────────────────────
const MOCK_MAPS = [
  { id: 1, name: 'FPT 하노이 사무소 1층', site: 'Duy Tan, Hanoi', scannedAt: '2026-03-15', resolution: '0.05m/px' },
  { id: 2, name: '현대건설 힐스테이트 A구역', site: '힐스테이트 도안2단지', scannedAt: '2026-03-20', resolution: '0.05m/px' },
  { id: 3, name: '현대건설 힐스테이트 B구역', site: '힐스테이트 도안2단지', scannedAt: '2026-03-22', resolution: '0.05m/px' },
  { id: 4, name: 'SKT 대전 데이터센터', site: '대전광역시 유성구', scannedAt: '2026-04-01', resolution: '0.05m/px' },
];

const MAP_W = 760;
const MAP_H = 520;

// ─── Procedural floor-plan drawing per map ───────────────────────────────────
function drawLidarMap(ctx, mapId) {
  const w = MAP_W;
  const h = MAP_H;

  // free-space background
  ctx.fillStyle = '#d6d6d6';
  ctx.fillRect(0, 0, w, h);

  // occupancy grid dots
  ctx.fillStyle = '#c8c8c8';
  for (let x = 0; x < w; x += 8) {
    for (let y = 0; y < h; y += 8) {
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // wall helper
  const wall = (x, y, bw, bh) => {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, bw, bh);
  };
  // gap (door) helper – erases wall with background
  const gap = (x, y, gw, gh) => {
    ctx.fillStyle = '#d6d6d6';
    ctx.fillRect(x, y, gw, gh);
  };

  if (mapId === 1) {
    // ── Office 1F ──────────────────────────────────────────
    wall(40, 40, 680, 10);   wall(40, 470, 680, 10);
    wall(40, 40, 10, 440);   wall(710, 40, 10, 440);
    wall(180, 40, 8, 180);   wall(380, 40, 8, 180);
    wall(180, 220, 210, 8);
    wall(180, 300, 8, 180);  wall(380, 300, 8, 180);
    wall(180, 290, 210, 8);
    wall(550, 40, 8, 200);   wall(550, 290, 8, 190);
    wall(550, 240, 170, 8);
    // doors
    gap(220, 40, 60, 10); gap(420, 40, 60, 10);
    gap(180, 340, 8, 55);    gap(380, 330, 8, 55);
    gap(550, 150, 8, 55);    gap(550, 380, 8, 55);
    // furniture blobs
    ctx.fillStyle = '#b0b0b0';
    [[80,80,60,30],[80,200,60,80],[210,60,100,40],[420,60,80,40],[610,60,80,40]].forEach(
      ([x,y,bw,bh]) => ctx.fillRect(x, y, bw, bh)
    );
  } else if (mapId === 2) {
    // ── Construction A ────────────────────────────────────
    wall(30, 30, 700, 12);   wall(30, 478, 700, 12);
    wall(30, 30, 12, 460);   wall(718, 30, 12, 460);
    wall(200, 30, 12, 220);  wall(200, 310, 12, 180);
    wall(480, 30, 12, 160);  wall(480, 260, 12, 230);
    wall(200, 248, 292, 12);
    // doors
    gap(200, 110, 12, 60); gap(200, 360, 12, 60);
    gap(480, 190, 12, 60);   gap(310, 30, 80, 12);
    // scattered obstacles (equipment)
    ctx.fillStyle = '#888';
    [[60,60,50,50],[60,220,50,80],[250,60,80,60],[540,60,80,60],[250,310,80,80]].forEach(
      ([x,y,bw,bh]) => ctx.fillRect(x, y, bw, bh)
    );
  } else if (mapId === 3) {
    // ── Construction B ────────────────────────────────────
    wall(50, 50, 660, 12);   wall(50, 458, 660, 12);
    wall(50, 50, 12, 420);   wall(698, 50, 12, 420);
    wall(280, 50, 12, 280);  wall(280, 390, 12, 80);
    wall(50, 270, 242, 12);  wall(280, 380, 420, 12);
    wall(500, 50, 12, 130);  wall(500, 230, 12, 160);
    // doors
    gap(280, 150, 12, 60); gap(280, 430, 12, 40);
    gap(500, 160, 12, 60); gap(150, 270, 60, 12);
    gap(400, 380, 12, 60);
    ctx.fillStyle = '#888';
    [[80,80,60,70],[80,320,60,80],[320,80,60,70],[540,260,80,60]].forEach(
      ([x,y,bw,bh]) => ctx.fillRect(x, y, bw, bh)
    );
  } else if (mapId === 4) {
    // ── Data Center ───────────────────────────────────────
    wall(20, 20, 720, 12);   wall(20, 488, 720, 12);
    wall(20, 20, 12, 480);   wall(728, 20, 12, 480);
    wall(20, 240, 720, 10);
    // server racks (top half)
    for (let i = 0; i < 5; i++) {
      wall(80 + i * 120, 60, 70, 140);
      gap(80 + i * 120 + 10, 60, 50, 12); // cooling gap
    }
    // server racks (bottom half)
    for (let i = 0; i < 5; i++) {
      wall(80 + i * 120, 300, 70, 140);
      gap(80 + i * 120 + 10, 430, 50, 12);
    }
    // doors
    gap(340, 240, 80, 10); gap(340, 20, 80, 12);
  }

  // Origin marker (robot start)
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(80, 430, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', 80, 430);

  // scale bar
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w - 120, h - 25);
  ctx.lineTo(w - 20, h - 25);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - 120, h - 30); ctx.lineTo(w - 120, h - 20); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - 20, h - 30);  ctx.lineTo(w - 20, h - 20);  ctx.stroke();
  ctx.fillStyle = '#555';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('5 m', w - 70, h - 12);
}

// ─── Waypoint drawing on SVG ─────────────────────────────────────────────────
const WP_R = 12;

function WaypointOverlay({ waypoints, selected, tool, onCanvasClick, onWpMouseDown, onMouseMove, onMouseUp }) {
  return (
    <svg
      width={MAP_W}
      height={MAP_H}
      className="absolute inset-0"
      style={{ cursor: tool === 'add' ? 'crosshair' : 'default' }}
      onClick={onCanvasClick}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* Path lines */}
      {waypoints.map((wp, i) => {
        if (i === 0) return null;
        const prev = waypoints[i - 1];
        return (
          <g key={`line-${wp.id}`}>
            <line
              x1={prev.x} y1={prev.y}
              x2={wp.x} y2={wp.y}
              stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3"
            />
            {/* Arrow */}
            <polygon
              points={getArrowPoints(prev.x, prev.y, wp.x, wp.y)}
              fill="#3b82f6"
            />
          </g>
        );
      })}

      {/* Waypoint circles */}
      {waypoints.map((wp, i) => (
        <g
          key={wp.id}
          transform={`translate(${wp.x},${wp.y})`}
          onMouseDown={(e) => { e.stopPropagation(); onWpMouseDown(e, wp.id); }}
          style={{ cursor: tool === 'move' ? 'grab' : 'pointer' }}
        >
          {/* Halo when selected */}
          {selected === wp.id && (
            <circle r={WP_R + 5} fill="rgba(59,130,246,0.25)" />
          )}
          <circle r={WP_R} fill={i === 0 ? '#16a34a' : '#3b82f6'} stroke="#fff" strokeWidth={2} />
          <text
            textAnchor="middle" dominantBaseline="central"
            fill="#fff" fontSize={10} fontWeight="bold"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

function getArrowPoints(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const size = 8;
  const px = -uy * (size / 2);
  const py = ux * (size / 2);
  return `${mx + ux * size},${my + uy * size} ${mx - ux * size / 2 + px},${my - uy * size / 2 + py} ${mx - ux * size / 2 - px},${my - uy * size / 2 - py}`;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
function RoutePlanning() {
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [tool, setTool] = useState('add'); // 'add' | 'move'
  const [selectedWpId, setSelectedWpId] = useState(null);
  const [dragging, setDragging] = useState(null); // { id, offsetX, offsetY }
  const [zoom, setZoom] = useState(1);
  const [mapListOpen, setMapListOpen] = useState(true);
  const canvasRef = useRef(null);
  const nextId = useRef(1);

  // Draw map on canvas when selection changes
  useEffect(() => {
    if (!canvasRef.current || !selectedMapId) return;
    const ctx = canvasRef.current.getContext('2d');
    drawLidarMap(ctx, selectedMapId);
  }, [selectedMapId]);

  // ── Waypoint add ───────────────────────────────────────
  const handleCanvasClick = useCallback((e) => {
    if (tool !== 'add') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setWaypoints((prev) => [...prev, { id: nextId.current++, x, y }]);
  }, [tool, zoom]);

  // ── Waypoint drag ──────────────────────────────────────
  const handleWpMouseDown = useCallback((e, id) => {
    if (tool !== 'move') return;
    setSelectedWpId(id);
    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    const wp = waypoints.find((w) => w.id === id);
    setDragging({
      id,
      offsetX: (e.clientX - rect.left) / zoom - wp.x,
      offsetY: (e.clientY - rect.top) / zoom - wp.y,
    });
    e.preventDefault();
  }, [tool, waypoints, zoom]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(MAP_W, (e.clientX - rect.left) / zoom - dragging.offsetX));
    const y = Math.max(0, Math.min(MAP_H, (e.clientY - rect.top) / zoom - dragging.offsetY));
    setWaypoints((prev) =>
      prev.map((w) => w.id === dragging.id ? { ...w, x, y } : w)
    );
  }, [dragging, zoom]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  // ── Waypoint delete ────────────────────────────────────
  const deleteWaypoint = (id) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
    if (selectedWpId === id) setSelectedWpId(null);
  };

  const clearAll = () => {
    setWaypoints([]);
    setSelectedWpId(null);
    nextId.current = 1;
  };

  // ── Save ───────────────────────────────────────────────
  const saveRoute = () => {
    const map = MOCK_MAPS.find((m) => m.id === selectedMapId);
    const data = {
      version: '1.0',
      map: {
        id: map.id,
        name: map.name,
        site: map.site,
        resolution: map.resolution,
        width: MAP_W,
        height: MAP_H,
      },
      waypoints: waypoints.map((wp, i) => ({
        index: i + 1,
        id: wp.id,
        x_px: Math.round(wp.x),
        y_px: Math.round(wp.y),
        x_m: +(wp.x * 0.05).toFixed(2),
        y_m: +(wp.y * 0.05).toFixed(2),
      })),
      totalDistance_m: getTotalDistance(),
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route_${map.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTotalDistance = () => {
    let d = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const dx = waypoints[i].x - waypoints[i - 1].x;
      const dy = waypoints[i].y - waypoints[i - 1].y;
      d += Math.sqrt(dx * dx + dy * dy) * 0.05;
    }
    return +d.toFixed(2);
  };

  const selectedMap = MOCK_MAPS.find((m) => m.id === selectedMapId);

  return (
    <div className="h-full flex bg-gray-100 overflow-hidden">

      {/* ── Left panel: map list ───────────────────────── */}
      <div className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Map className="h-4 w-4 text-blue-500" />
            LiDAR 맵 목록
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Group by site */}
          {Object.entries(
            MOCK_MAPS.reduce((acc, m) => {
              (acc[m.site] = acc[m.site] || []).push(m);
              return acc;
            }, {})
          ).map(([site, maps]) => (
            <div key={site}>
              <button
                onClick={() => setMapListOpen((v) => !v)}
                className="w-full flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:bg-gray-50 rounded"
              >
                {mapListOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {site}
              </button>
              {mapListOpen && maps.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMapId(m.id);
                    setWaypoints([]);
                    nextId.current = 1;
                    setSelectedWpId(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                    selectedMapId === m.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium truncate">{m.name.split(' ').slice(-2).join(' ')}</div>
                  <div className="text-gray-400 mt-0.5">{m.scannedAt}</div>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Map info */}
        {selectedMap && (
          <div className="border-t border-gray-200 p-3 text-xs text-gray-500 space-y-0.5">
            <div className="font-semibold text-gray-700 truncate">{selectedMap.name}</div>
            <div>해상도: {selectedMap.resolution}</div>
            <div>스캔일: {selectedMap.scannedAt}</div>
          </div>
        )}
      </div>

      {/* ── Center: canvas + toolbar ───────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 mr-2">
            {selectedMap ? selectedMap.name : '맵을 선택하세요'}
          </span>

          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setTool('add')}
              title="웨이포인트 추가 (클릭)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tool === 'add' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />추가
            </button>
            <button
              onClick={() => setTool('move')}
              title="웨이포인트 이동 (드래그)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tool === 'move' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Move className="h-3.5 w-3.5" />이동
            </button>
          </div>

          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)))}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="확대"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(1)))}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="축소"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="원래 크기"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={clearAll}
              disabled={waypoints.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-3.5 w-3.5" />전체 초기화
            </button>
            <button
              onClick={saveRoute}
              disabled={!selectedMapId || waypoints.length < 2}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5" />경로 저장
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto p-4 flex items-start justify-start">
          {!selectedMapId ? (
            <div className="flex-1 h-full flex flex-col items-center justify-center text-gray-400 gap-3">
              <Map className="h-16 w-16 text-gray-300" />
              <p className="text-sm">왼쪽에서 LiDAR 맵을 선택하세요</p>
            </div>
          ) : (
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                position: 'relative',
                width: MAP_W,
                height: MAP_H,
                flexShrink: 0,
              }}
            >
              {/* Map canvas */}
              <canvas
                ref={canvasRef}
                width={MAP_W}
                height={MAP_H}
                style={{ display: 'block', borderRadius: 8 }}
              />
              {/* Waypoint SVG overlay */}
              <WaypointOverlay
                waypoints={waypoints}
                selected={selectedWpId}
                tool={tool}
                onCanvasClick={handleCanvasClick}
                onWpMouseDown={handleWpMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              />
            </div>
          )}
        </div>

        {/* Status bar */}
        {selectedMapId && (
          <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center gap-4 text-xs text-gray-500">
            <span>웨이포인트: <strong className="text-gray-800">{waypoints.length}</strong></span>
            <span>총 경로 거리: <strong className="text-gray-800">{getTotalDistance()} m</strong></span>
            <span className="text-gray-400 ml-auto">
              {tool === 'add' ? '클릭하여 웨이포인트 추가' : '웨이포인트를 드래그하여 이동'}
            </span>
          </div>
        )}
      </div>

      {/* ── Right panel: waypoint list ─────────────────── */}
      <div className="w-56 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">웨이포인트 목록</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {waypoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-xs text-center gap-2">
              <MousePointer className="h-6 w-6 text-gray-300" />
              <span>맵을 클릭하여<br />웨이포인트를 추가하세요</span>
            </div>
          ) : (
            <div className="space-y-1">
              {waypoints.map((wp, i) => (
                <div
                  key={wp.id}
                  onClick={() => setSelectedWpId(wp.id === selectedWpId ? null : wp.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedWpId === wp.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                    i === 0 ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800">
                      WP-{String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-400">
                      ({Math.round(wp.x * 0.05 * 10) / 10}m, {Math.round(wp.y * 0.05 * 10) / 10}m)
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteWaypoint(wp.id); }}
                    className="p-0.5 text-gray-300 hover:text-red-500 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distance summary */}
        {waypoints.length >= 2 && (
          <div className="border-t border-gray-200 p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">총 거리</span>
              <span className="font-semibold text-gray-800">{getTotalDistance()} m</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">예상 시간</span>
              <span className="font-semibold text-gray-800">
                {Math.round(getTotalDistance() / 0.5 / 60)}분 {Math.round(getTotalDistance() / 0.5 % 60)}초
              </span>
            </div>
            <div className="text-xs text-gray-400">(기준 속도: 0.5 m/s)</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoutePlanning;
