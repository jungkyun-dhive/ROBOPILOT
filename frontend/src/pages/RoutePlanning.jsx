import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Map, Plus, Trash2, Download, RotateCcw, MousePointer, Move,
  ChevronRight, ChevronDown, ZoomIn, ZoomOut, Maximize2, RotateCw
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

  ctx.fillStyle = '#d6d6d6';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#c8c8c8';
  for (let x = 0; x < w; x += 8) {
    for (let y = 0; y < h; y += 8) {
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const wall = (x, y, bw, bh) => {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, bw, bh);
  };
  const gap = (x, y, gw, gh) => {
    ctx.fillStyle = '#d6d6d6';
    ctx.fillRect(x, y, gw, gh);
  };

  if (mapId === 1) {
    wall(40, 40, 680, 10);   wall(40, 470, 680, 10);
    wall(40, 40, 10, 440);   wall(710, 40, 10, 440);
    wall(180, 40, 8, 180);   wall(380, 40, 8, 180);
    wall(180, 220, 210, 8);
    wall(180, 300, 8, 180);  wall(380, 300, 8, 180);
    wall(180, 290, 210, 8);
    wall(550, 40, 8, 200);   wall(550, 290, 8, 190);
    wall(550, 240, 170, 8);
    gap(220, 40, 60, 10); gap(420, 40, 60, 10);
    gap(180, 340, 8, 55);    gap(380, 330, 8, 55);
    gap(550, 150, 8, 55);    gap(550, 380, 8, 55);
    ctx.fillStyle = '#b0b0b0';
    [[80,80,60,30],[80,200,60,80],[210,60,100,40],[420,60,80,40],[610,60,80,40]].forEach(
      ([x,y,bw,bh]) => ctx.fillRect(x, y, bw, bh)
    );
  } else if (mapId === 2) {
    wall(30, 30, 700, 12);   wall(30, 478, 700, 12);
    wall(30, 30, 12, 460);   wall(718, 30, 12, 460);
    wall(200, 30, 12, 220);  wall(200, 310, 12, 180);
    wall(480, 30, 12, 160);  wall(480, 260, 12, 230);
    wall(200, 248, 292, 12);
    gap(200, 110, 12, 60); gap(200, 360, 12, 60);
    gap(480, 190, 12, 60);   gap(310, 30, 80, 12);
    ctx.fillStyle = '#888';
    [[60,60,50,50],[60,220,50,80],[250,60,80,60],[540,60,80,60],[250,310,80,80]].forEach(
      ([x,y,bw,bh]) => ctx.fillRect(x, y, bw, bh)
    );
  } else if (mapId === 3) {
    wall(50, 50, 660, 12);   wall(50, 458, 660, 12);
    wall(50, 50, 12, 420);   wall(698, 50, 12, 420);
    wall(280, 50, 12, 280);  wall(280, 390, 12, 80);
    wall(50, 270, 242, 12);  wall(280, 380, 420, 12);
    wall(500, 50, 12, 130);  wall(500, 230, 12, 160);
    gap(280, 150, 12, 60); gap(280, 430, 12, 40);
    gap(500, 160, 12, 60); gap(150, 270, 60, 12);
    gap(400, 380, 12, 60);
    ctx.fillStyle = '#888';
    [[80,80,60,70],[80,320,60,80],[320,80,60,70],[540,260,80,60]].forEach(
      ([x,y,bw,bh]) => ctx.fillRect(x, y, bw, bh)
    );
  } else if (mapId === 4) {
    wall(20, 20, 720, 12);   wall(20, 488, 720, 12);
    wall(20, 20, 12, 480);   wall(728, 20, 12, 480);
    wall(20, 240, 720, 10);
    for (let i = 0; i < 5; i++) {
      wall(80 + i * 120, 60, 70, 140);
      gap(80 + i * 120 + 10, 60, 50, 12);
    }
    for (let i = 0; i < 5; i++) {
      wall(80 + i * 120, 300, 70, 140);
      gap(80 + i * 120 + 10, 430, 50, 12);
    }
    gap(340, 240, 80, 10); gap(340, 20, 80, 12);
  }

  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(80, 430, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', 80, 430);

  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w - 120, h - 25); ctx.lineTo(w - 20, h - 25); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - 120, h - 30); ctx.lineTo(w - 120, h - 20); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - 20, h - 30);  ctx.lineTo(w - 20, h - 20);  ctx.stroke();
  ctx.fillStyle = '#555';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('5 m', w - 70, h - 12);
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const WP_R = 13;      // waypoint circle radius
const HANDLE_DIST = WP_R + 22; // rotation handle distance from center

// Calculate heading (degrees, 0=north/up, clockwise) from point A to B
function calcHeading(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  // atan2(dy, dx) → angle from east, clockwise in SVG coords
  // +90 → 0 = north
  const deg = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
  return Math.round(deg);
}

// Path line midpoint arrow points
function getPathArrowPoints(x1, y1, x2, y2) {
  const dx = x2 - x1; const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len; const uy = dy / len;
  const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
  const size = 7;
  const px = -uy * (size / 2); const py = ux * (size / 2);
  return `${mx + ux * size},${my + uy * size} ${mx - ux * size / 2 + px},${my - uy * size / 2 + py} ${mx - ux * size / 2 - px},${my - uy * size / 2 - py}`;
}

// Convert heading degrees to rotation handle position (in waypoint-local coords)
function handlePos(heading) {
  const rad = (heading - 90) * Math.PI / 180; // 0°=north → -π/2 rad from east
  return {
    x: Math.cos(rad) * HANDLE_DIST,
    y: Math.sin(rad) * HANDLE_DIST,
  };
}

// ─── Main Page ───────────────────────────────────────────────────────────────
function RoutePlanning() {
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  // tool: 'add' | 'move'
  const [tool, setTool] = useState('add');
  const [selectedWpId, setSelectedWpId] = useState(null);
  // dragging: { id, offX, offY }
  const [dragging, setDragging] = useState(null);
  // rotating: waypoint id being rotated
  const [rotating, setRotating] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [mapListOpen, setMapListOpen] = useState(true);
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const nextId = useRef(1);

  // Draw map on canvas when selection changes
  useEffect(() => {
    if (!canvasRef.current || !selectedMapId) return;
    const ctx = canvasRef.current.getContext('2d');
    drawLidarMap(ctx, selectedMapId);
  }, [selectedMapId]);

  // ── SVG mouse coordinate helper ──────────────────────────
  const svgCoords = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  }, [zoom]);

  // ── Add waypoint (click on canvas background) ────────────
  const handleSvgClick = useCallback((e) => {
    // Only fires when clicking the SVG background, not on waypoints
    if (e.target !== svgRef.current && e.target.dataset.bg !== 'true') return;
    if (tool === 'move') { setSelectedWpId(null); return; }
    if (tool !== 'add') return;

    const { x, y } = svgCoords(e);
    setWaypoints((prev) => {
      const prev_wp = prev[prev.length - 1];
      const heading = prev_wp ? calcHeading(prev_wp.x, prev_wp.y, x, y) : 0;
      return [...prev, { id: nextId.current++, x, y, heading }];
    });
  }, [tool, svgCoords]);

  // ── Select waypoint (click on circle) ───────────────────
  const handleWpClick = useCallback((e, id) => {
    e.stopPropagation();
    setSelectedWpId((prev) => prev === id ? null : id);
  }, []);

  // ── Start drag (move mode) ───────────────────────────────
  const handleWpMouseDown = useCallback((e, id) => {
    if (tool !== 'move') return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedWpId(id);
    const { x, y } = svgCoords(e);
    const wp = waypoints.find((w) => w.id === id);
    setDragging({ id, offX: x - wp.x, offY: y - wp.y });
  }, [tool, waypoints, svgCoords]);

  // ── Start rotate (drag the heading handle) ───────────────
  const handleRotateMouseDown = useCallback((e, id) => {
    e.stopPropagation();
    e.preventDefault();
    setRotating(id);
  }, []);

  // ── Mouse move (drag or rotate) ──────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!dragging && !rotating) return;
    const { x, y } = svgCoords(e);

    if (dragging) {
      setWaypoints((prev) =>
        prev.map((w) =>
          w.id === dragging.id
            ? { ...w,
                x: Math.max(0, Math.min(MAP_W, x - dragging.offX)),
                y: Math.max(0, Math.min(MAP_H, y - dragging.offY)),
              }
            : w
        )
      );
    }

    if (rotating) {
      const wp = waypoints.find((w) => w.id === rotating);
      if (!wp) return;
      const dx = x - wp.x;
      const dy = y - wp.y;
      const newHeading = Math.round((Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360);
      setWaypoints((prev) =>
        prev.map((w) => w.id === rotating ? { ...w, heading: newHeading } : w)
      );
    }
  }, [dragging, rotating, waypoints, svgCoords]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setRotating(null);
  }, []);

  // ── Delete waypoint ──────────────────────────────────────
  const deleteWaypoint = (id) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
    if (selectedWpId === id) setSelectedWpId(null);
  };

  const clearAll = () => {
    setWaypoints([]); setSelectedWpId(null); nextId.current = 1;
  };

  // ── Save JSON ─────────────────────────────────────────────
  const saveRoute = () => {
    const map = MOCK_MAPS.find((m) => m.id === selectedMapId);
    const data = {
      version: '1.0',
      map: { id: map.id, name: map.name, site: map.site, resolution: map.resolution, width: MAP_W, height: MAP_H },
      waypoints: waypoints.map((wp, i) => ({
        index: i + 1, id: wp.id,
        x_px: Math.round(wp.x), y_px: Math.round(wp.y),
        x_m: +(wp.x * 0.05).toFixed(2), y_m: +(wp.y * 0.05).toFixed(2),
        heading_deg: wp.heading,
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
  const selectedWp = waypoints.find((w) => w.id === selectedWpId);
  const selectedWpIndex = waypoints.findIndex((w) => w.id === selectedWpId);

  return (
    <div className="h-full flex bg-gray-100 overflow-hidden">

      {/* ── Left: map list ──────────────────────────────── */}
      <div className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Map className="h-4 w-4 text-blue-500" />LiDAR 맵 목록
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {Object.entries(
            MOCK_MAPS.reduce((acc, m) => { (acc[m.site] = acc[m.site] || []).push(m); return acc; }, {})
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
                  onClick={() => { setSelectedMapId(m.id); setWaypoints([]); nextId.current = 1; setSelectedWpId(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                    selectedMapId === m.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium truncate">{m.name.split(' ').slice(-2).join(' ')}</div>
                  <div className="text-gray-400 mt-0.5">{m.scannedAt}</div>
                </button>
              ))}
            </div>
          ))}
        </div>
        {selectedMap && (
          <div className="border-t border-gray-200 p-3 text-xs text-gray-500 space-y-0.5">
            <div className="font-semibold text-gray-700 truncate">{selectedMap.name}</div>
            <div>해상도: {selectedMap.resolution}</div>
            <div>스캔일: {selectedMap.scannedAt}</div>
          </div>
        )}
      </div>

      {/* ── Center: canvas + toolbar ─────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800 mr-1">
            {selectedMap ? selectedMap.name : '맵을 선택하세요'}
          </span>

          {/* Tool toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setTool('add')}
              title="웨이포인트 추가"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tool === 'add' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />추가
            </button>
            <button
              onClick={() => setTool('move')}
              title="위치 이동 / 방향 회전"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tool === 'move' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Move className="h-3.5 w-3.5" />이동
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)))} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><ZoomIn className="h-4 w-4" /></button>
            <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(1)))} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><ZoomOut className="h-4 w-4" /></button>
            <button onClick={() => setZoom(1)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Maximize2 className="h-4 w-4" /></button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 ml-2 text-xs text-gray-400 border-l pl-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />출발점
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />웨이포인트
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />방향 핸들
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={clearAll} disabled={waypoints.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed">
              <RotateCcw className="h-3.5 w-3.5" />전체 초기화
            </button>
            <button onClick={saveRoute} disabled={!selectedMapId || waypoints.length < 2}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
              <Download className="h-3.5 w-3.5" />경로 저장
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto p-4">
          {!selectedMapId ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
              <Map className="h-16 w-16 text-gray-300" />
              <p className="text-sm">왼쪽에서 LiDAR 맵을 선택하세요</p>
            </div>
          ) : (
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left',
                          position: 'relative', width: MAP_W, height: MAP_H, flexShrink: 0 }}>
              {/* Map canvas */}
              <canvas ref={canvasRef} width={MAP_W} height={MAP_H}
                style={{ display: 'block', borderRadius: 8 }} />

              {/* Waypoint SVG overlay */}
              <svg
                ref={svgRef}
                width={MAP_W} height={MAP_H}
                className="absolute inset-0"
                style={{ cursor: tool === 'add' ? 'crosshair' : 'default', borderRadius: 8 }}
                onClick={handleSvgClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Transparent background catch */}
                <rect width={MAP_W} height={MAP_H} fill="transparent" data-bg="true" />

                {/* Path lines */}
                {waypoints.map((wp, i) => {
                  if (i === 0) return null;
                  const prev = waypoints[i - 1];
                  return (
                    <g key={`line-${wp.id}`} style={{ pointerEvents: 'none' }}>
                      <line x1={prev.x} y1={prev.y} x2={wp.x} y2={wp.y}
                        stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" />
                      <polygon points={getPathArrowPoints(prev.x, prev.y, wp.x, wp.y)} fill="#3b82f6" />
                    </g>
                  );
                })}

                {/* Waypoints */}
                {waypoints.map((wp, i) => {
                  const isSelected = selectedWpId === wp.id;
                  const color = i === 0 ? '#16a34a' : '#3b82f6';
                  const hPos = handlePos(wp.heading);

                  return (
                    <g key={wp.id} transform={`translate(${wp.x},${wp.y})`}>

                      {/* Selection ring */}
                      {isSelected && (
                        <circle r={WP_R + 7}
                          fill="rgba(59,130,246,0.15)"
                          stroke="rgba(59,130,246,0.5)"
                          strokeWidth={1.5}
                          strokeDasharray="4 2"
                          style={{ pointerEvents: 'none' }}
                        />
                      )}

                      {/* Rotation handle line (shown when selected) */}
                      {isSelected && (
                        <line x1={0} y1={0} x2={hPos.x} y2={hPos.y}
                          stroke="rgba(251,146,60,0.6)" strokeWidth={1.5} strokeDasharray="3 2"
                          style={{ pointerEvents: 'none' }}
                        />
                      )}

                      {/* Direction arrow group (rotates with heading) */}
                      <g transform={`rotate(${wp.heading})`} style={{ pointerEvents: 'none' }}>
                        {/* Stem line from circle edge upward */}
                        <line x1={0} y1={-WP_R} x2={0} y2={-WP_R - 8}
                          stroke="rgba(255,255,255,0.85)" strokeWidth={2.5} strokeLinecap="round" />
                        {/* Arrowhead triangle */}
                        <polygon points={`0,${-WP_R - 16} -5,${-WP_R - 7} 5,${-WP_R - 7}`}
                          fill="rgba(255,255,255,0.95)" />
                      </g>

                      {/* Circle body (clickable / draggable) */}
                      <circle
                        r={WP_R}
                        fill={color}
                        stroke="#fff"
                        strokeWidth={2.5}
                        style={{ cursor: tool === 'move' ? 'grab' : 'pointer' }}
                        onMouseDown={(e) => {
                          if (tool === 'move') handleWpMouseDown(e, wp.id);
                          else handleWpClick(e, wp.id);
                        }}
                        onClick={(e) => {
                          if (tool === 'add') handleWpClick(e, wp.id);
                        }}
                      />

                      {/* Number label (never rotates) */}
                      <text textAnchor="middle" dominantBaseline="central"
                        fill="#fff" fontSize={10} fontWeight="bold"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {i + 1}
                      </text>

                      {/* Rotation handle dot (shown when selected) */}
                      {isSelected && (
                        <circle
                          cx={hPos.x} cy={hPos.y}
                          r={7}
                          fill="#f97316"
                          stroke="#fff"
                          strokeWidth={2}
                          style={{ cursor: 'grab' }}
                          onMouseDown={(e) => handleRotateMouseDown(e, wp.id)}
                        />
                      )}

                      {/* Heading label near handle */}
                      {isSelected && (
                        <text
                          x={hPos.x + (hPos.x >= 0 ? 12 : -12)}
                          y={hPos.y}
                          textAnchor={hPos.x >= 0 ? 'start' : 'end'}
                          dominantBaseline="central"
                          fill="#f97316"
                          fontSize={10}
                          fontWeight="bold"
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                          {wp.heading}°
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Status bar */}
        {selectedMapId && (
          <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center gap-4 text-xs text-gray-500">
            <span>웨이포인트: <strong className="text-gray-800">{waypoints.length}</strong></span>
            <span>총 경로: <strong className="text-gray-800">{getTotalDistance()} m</strong></span>
            {selectedWp && (
              <span className="text-blue-600 font-medium">
                WP-{String(selectedWpIndex + 1).padStart(2, '0')} 선택됨 — 방향 {selectedWp.heading}° | 주황 핸들을 드래그하여 방향 변경
              </span>
            )}
            {!selectedWp && (
              <span className="text-gray-400 ml-auto">
                {tool === 'add' ? '클릭: 웨이포인트 추가 / 기존 WP 클릭: 선택' : '드래그: 위치 이동 | WP 클릭 후 주황 핸들 드래그: 방향 회전'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Right: waypoint list ─────────────────────────── */}
      <div className="w-60 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col">
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
                    selectedWpId === wp.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                    i === 0 ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800">WP-{String(i + 1).padStart(2, '0')}</div>
                    <div className="text-xs text-gray-400">
                      {(wp.x * 0.05).toFixed(1)}m, {(wp.y * 0.05).toFixed(1)}m
                    </div>
                  </div>
                  {/* Heading indicator */}
                  <div className="flex flex-col items-center gap-0.5">
                    <svg width={18} height={18} viewBox="-10 -10 20 20">
                      <circle r={8} fill="none" stroke="#e5e7eb" strokeWidth={1.5} />
                      <g transform={`rotate(${wp.heading})`}>
                        <polygon points="0,-7 -3,-1 3,-1" fill={i === 0 ? '#16a34a' : '#3b82f6'} />
                      </g>
                    </svg>
                    <span className="text-xs text-orange-500 font-medium leading-none">{wp.heading}°</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteWaypoint(wp.id); }}
                    className="p-0.5 text-gray-300 hover:text-red-500 rounded flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected WP heading editor */}
        {selectedWp && (
          <div className="border-t border-gray-200 p-3">
            <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <RotateCw className="h-3.5 w-3.5 text-orange-400" />
              WP-{String(selectedWpIndex + 1).padStart(2, '0')} 방향 설정
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0} max={359}
                value={selectedWp.heading}
                onChange={(e) => setWaypoints((prev) =>
                  prev.map((w) => w.id === selectedWp.id ? { ...w, heading: Number(e.target.value) } : w)
                )}
                className="flex-1 h-1.5 accent-orange-400"
              />
              <span className="text-xs font-bold text-orange-500 w-10 text-right">{selectedWp.heading}°</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>N(0°)</span><span>E(90°)</span><span>S(180°)</span><span>W(270°)</span>
            </div>
          </div>
        )}

        {/* Summary */}
        {waypoints.length >= 2 && (
          <div className="border-t border-gray-200 p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">총 거리</span>
              <span className="font-semibold text-gray-800">{getTotalDistance()} m</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">예상 시간</span>
              <span className="font-semibold text-gray-800">
                {Math.floor(getTotalDistance() / 0.5 / 60)}분 {Math.round(getTotalDistance() / 0.5 % 60)}초
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
