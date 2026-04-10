import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Map, Plus, Trash2, Download, RotateCcw, MousePointer, Move,
  ChevronRight, ChevronDown, ZoomIn, ZoomOut, Maximize2, RotateCw, GripVertical
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

// ─── LiDAR map rendering — Vector Space style ────────────────────────────────
function drawLidarMap(ctx, mapId) {
  const w = MAP_W;
  const h = MAP_H;
  const G = 20; // 1 m = 20 px  (0.05 m/px)

  // Color theme
  const GRD = 'rgba(255,255,255,0.5)'; // 1 m grid lines (white 50% opacity)
  const WO  = '#00e7ff';   // outer boundary
  const WI  = 'rgba(0,231,255,0.7)';   // inner walls
  const OBS = '#020c14';   // obstacles / equipment

  // ── Black background ─────────────────────────────────────────────────────────
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  // ── Draw helpers ─────────────────────────────────────────────────────────────
  // poly: #165a72 fill inside, black outside. Grid is drawn separately at the very end.
  const poly = (pts) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = '#165a72';
    ctx.fill();
    // Black outside using even-odd
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fill('evenodd');
  };

  // Outer wall segment (bright cyan) — skip calling for passage openings
  const ow = (x1, y1, x2, y2) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = WO; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke();
  };

  // Inner wall segment (dim cyan) — place gaps to form passages
  const iw = (x1, y1, x2, y2, lw = 1.5) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = WI; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke();
  };

  // Obstacle: solid black + faint cyan border
  const ob = (x, y, bw, bh) => {
    ctx.fillStyle = OBS; ctx.fillRect(x, y, bw, bh);
    ctx.strokeStyle = WI; ctx.lineWidth = 0.5; ctx.strokeRect(x, y, bw, bh);
  };

  // ── Per-map floor plans ──────────────────────────────────────────────────────
  if (mapId === 1) {
    // FPT 하노이 사무소 1층 — L-shaped office
    // Passages: x=250 wall (y=120~180, y=320~390), y=290 wall (x=130~220, x=560~650)
    poly([[30,30],[490,30],[490,180],[730,180],[730,490],[30,490]]);
    // Outer walls (all solid — no exterior openings)
    ow(30,30,490,30); ow(490,30,490,180); ow(490,180,730,180);
    ow(730,180,730,490); ow(730,490,30,490); ow(30,490,30,30);
    // Vertical divider x=250 with two passage gaps
    iw(250,30,250,120); iw(250,180,250,320); iw(250,390,250,490);
    // Horizontal divider y=290 with two passage gaps
    iw(30,290,130,290); iw(220,290,490,290);
    iw(490,290,560,290); iw(650,290,730,290);
    // Left sub-wall x=100 with passage gap
    iw(100,30,100,120); iw(100,180,100,290);
    // Obstacles (furniture/equipment)
    ob(50,50,30,120); ob(135,55,85,45); ob(135,120,85,45);
    ob(540,210,65,50); ob(625,210,70,50);
    ob(50,330,60,100); ob(310,330,100,60);

  } else if (mapId === 2) {
    // 현대건설 힐스테이트 A구역 — irregular octagonal plan
    // Passages: center x=380 (y=190~260), y=270 (x=190~280, x=480~570)
    poly([[60,80],[200,30],[560,30],[720,100],[720,430],[540,490],[180,490],[40,420],[40,160]]);
    // Outer walls (solid)
    ow(60,80,200,30); ow(200,30,560,30); ow(560,30,720,100);
    ow(720,100,720,430); ow(720,430,540,490); ow(540,490,180,490);
    ow(180,490,40,420); ow(40,420,40,160); ow(40,160,60,80);
    // Center vertical x=380 with passage gap
    iw(380,30,380,190); iw(380,260,380,490);
    // Horizontal y=270 with two passage gaps
    iw(40,270,190,270); iw(280,270,380,270);
    iw(380,270,480,270); iw(570,270,720,270);
    // Side sub-walls with passage gaps
    iw(200,30,200,190); iw(200,260,200,490);
    iw(540,30,540,190); iw(540,260,540,490);
    // Obstacles
    ob(65,110,100,110); ob(65,300,100,110);
    ob(420,60,90,65);   ob(580,130,95,90);
    ob(250,155,95,80);  ob(580,305,95,130);

  } else if (mapId === 3) {
    // 현대건설 힐스테이트 B구역 — reverse-L
    // Passages: y=200 (x=110~200), x=240 (y=120~200), x=430 lower (y=310~390)
    poly([[30,30],[730,30],[730,310],[430,310],[430,490],[30,490]]);
    // Outer walls (solid)
    ow(30,30,730,30); ow(730,30,730,310); ow(730,310,430,310);
    ow(430,310,430,490); ow(430,490,30,490); ow(30,490,30,30);
    // Horizontal y=200 with passage gap
    iw(30,200,110,200); iw(200,200,730,200);
    // Vertical x=240 with passage gap
    iw(240,30,240,120); iw(240,200,240,490);
    // Vertical x=430 lower area with passage gap
    iw(430,200,430,310); iw(430,390,430,490);
    // Vertical x=600 upper area with passage gap
    iw(600,30,600,100); iw(600,160,600,200);
    // Obstacles
    ob(50,50,145,100); ob(280,50,90,100);
    ob(640,55,60,100);  ob(50,235,145,130);
    ob(465,340,90,110);

  } else if (mapId === 4) {
    // SKT 대전 데이터센터 — rectangle with server-rack rows
    // Passages: entrance top (x=330~410), center aisle gap (x=300~460)
    poly([[20,20],[740,20],[740,500],[20,500]]);
    // Outer walls with entrance passage on top
    ow(20,20,330,20); ow(410,20,740,20);    // top (passage gap x=330~410)
    ow(740,20,740,500); ow(740,500,20,500); ow(20,500,20,20);
    // Center aisle divider y=260 with passage gap
    iw(20,260,300,260,2); iw(460,260,740,260,2);
    // Server racks (aisles between racks = natural open passages, no extra walls)
    for (let c = 0; c < 5; c++) {
      const bx = 22 + c * 140;
      [40,90,140,192].forEach(ry => ob(bx+8, ry, 112, 32));
      [272,322,372,422].forEach(ry => ob(bx+8, ry, 112, 32));
    }
  }

  // ── Origin S marker ──────────────────────────────────────────────────────────
  ctx.fillStyle = WI;
  ctx.beginPath(); ctx.arc(65, 455, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('S', 65, 455);

  // ── Scale bar (5 m = 100 px) ─────────────────────────────────────────────────
  const sx = w - 130, sy = h - 26;
  ctx.strokeStyle = '#7fd8e8'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 100, sy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx, sy - 6); ctx.lineTo(sx, sy + 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx + 100, sy - 6); ctx.lineTo(sx + 100, sy + 6); ctx.stroke();
  ctx.fillStyle = '#7fd8e8';
  ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('5 m', sx + 50, sy + 14);

  // ── 1m grid — drawn last so it appears above all map layers ─────────────────
  ctx.strokeStyle = GRD; ctx.lineWidth = 0.75;
  for (let x = 0; x <= w; x += G) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
  for (let y = 0; y <= h; y += G) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const WP_R = 13;
const HANDLE_DIST = WP_R + 22;

function calcHeading(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const deg = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
  return Math.round(deg);
}

function handlePos(heading) {
  const rad = (heading - 90) * Math.PI / 180;
  return {
    x: Math.cos(rad) * HANDLE_DIST,
    y: Math.sin(rad) * HANDLE_DIST,
  };
}

// Waypoint colors
const WP_COLOR_FIRST = '#00d07a';   // first waypoint (teal-green)
const WP_COLOR       = '#00bcd4';   // other waypoints (cyan)

// ─── Main Page ───────────────────────────────────────────────────────────────
function RoutePlanning() {
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [tool, setTool] = useState('add');
  const [selectedWpId, setSelectedWpId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [rotating, setRotating] = useState(null);
  const [dragOrderId, setDragOrderId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [mapListOpen, setMapListOpen] = useState(true);
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const nextId = useRef(1);

  useEffect(() => {
    if (!canvasRef.current || !selectedMapId) return;
    const ctx = canvasRef.current.getContext('2d');
    drawLidarMap(ctx, selectedMapId);
  }, [selectedMapId]);

  const svgCoords = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  }, [zoom]);

  const handleSvgClick = useCallback((e) => {
    if (e.target !== svgRef.current && e.target.dataset.bg !== 'true') return;
    if (tool === 'move') { setSelectedWpId(null); return; }
    if (tool !== 'add') return;
    const { x, y } = svgCoords(e);
    setWaypoints((prev) => {
      const prev_wp = prev[prev.length - 1];
      const heading = prev_wp ? calcHeading(prev_wp.x, prev_wp.y, x, y) : 0;
      return [...prev, { id: nextId.current++, x, y, heading, waitSec: 0, posture: 'normal' }];
    });
  }, [tool, svgCoords]);

  const handleWpClick = useCallback((e, id) => {
    e.stopPropagation();
    setSelectedWpId(id); // always select — click background to deselect
  }, []);

  const handleWpMouseDown = useCallback((e, id) => {
    if (tool !== 'move') return;
    e.stopPropagation(); e.preventDefault();
    setSelectedWpId(id);
    const { x, y } = svgCoords(e);
    const wp = waypoints.find((w) => w.id === id);
    setDragging({ id, offX: x - wp.x, offY: y - wp.y });
  }, [tool, waypoints, svgCoords]);

  const handleRotateMouseDown = useCallback((e, id) => {
    e.stopPropagation(); e.preventDefault();
    setRotating(id);
  }, []);

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

  const deleteWaypoint = (id) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
    if (selectedWpId === id) setSelectedWpId(null);
  };

  const clearAll = () => {
    setWaypoints([]); setSelectedWpId(null); nextId.current = 1;
  };

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
        wait_sec: wp.waitSec ?? 0,
        posture: wp.posture ?? 'normal',
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
            <Map className="h-4 w-4 text-cyan-500" />LiDAR 맵 목록
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
                    selectedMapId === m.id ? 'bg-cyan-50 text-cyan-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
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
                tool === 'add' ? 'bg-white shadow text-cyan-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />추가
            </button>
            <button
              onClick={() => setTool('move')}
              title="위치 이동 / 방향 회전"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tool === 'move' ? 'bg-white shadow text-cyan-600' : 'text-gray-500 hover:text-gray-700'
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
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: WP_COLOR_FIRST }} />출발점
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: WP_COLOR }} />웨이포인트
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 inline-block bg-white border border-gray-300" />경로
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
              <Download className="h-3.5 w-3.5" />경로 저장
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className={`flex-1 overflow-auto p-3 transition-colors ${selectedMapId ? 'bg-slate-900' : 'bg-gray-100'}`}>
          {!selectedMapId ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
              <Map className="h-16 w-16 text-gray-300" />
              <p className="text-sm">왼쪽에서 LiDAR 맵을 선택하세요</p>
            </div>
          ) : (
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left',
                          position: 'relative', width: MAP_W, height: MAP_H, flexShrink: 0 }}>
              {/* Map canvas */}
              <canvas
                ref={canvasRef}
                width={MAP_W}
                height={MAP_H}
                style={{
                  display: 'block',
                  borderRadius: 6,
                  boxShadow: '0 0 0 1px rgba(0,200,220,0.25), 0 6px 32px rgba(0,0,0,0.6)',
                }}
              />

              {/* Waypoint SVG overlay */}
              <svg
                ref={svgRef}
                width={MAP_W} height={MAP_H}
                className="absolute inset-0"
                style={{ cursor: tool === 'add' ? 'crosshair' : 'default', borderRadius: 6 }}
                onClick={handleSvgClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Transparent background catch */}
                <rect width={MAP_W} height={MAP_H} fill="transparent" data-bg="true" />

                {/* Path lines — white solid */}
                {waypoints.map((wp, i) => {
                  if (i === 0) return null;
                  const prev = waypoints[i - 1];
                  return (
                    <line
                      key={`line-${wp.id}`}
                      x1={prev.x} y1={prev.y} x2={wp.x} y2={wp.y}
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth={2}
                      strokeDasharray="8 5"
                      strokeLinecap="round"
                      style={{ pointerEvents: 'none' }}
                    />
                  );
                })}

                {/* Waypoints */}
                {waypoints.map((wp, i) => {
                  const isSelected = selectedWpId === wp.id;
                  const color = i === 0 ? WP_COLOR_FIRST : WP_COLOR;
                  const hPos = handlePos(wp.heading);

                  return (
                    <g key={wp.id} transform={`translate(${wp.x},${wp.y})`}>

                      {/* Selection ring */}
                      {isSelected && (
                        <circle r={WP_R + 7}
                          fill="rgba(0,200,220,0.15)"
                          stroke="rgba(0,220,240,0.55)"
                          strokeWidth={1.5}
                          strokeDasharray="4 2"
                          style={{ pointerEvents: 'none' }}
                        />
                      )}

                      {/* Rotation handle line */}
                      {isSelected && (
                        <line x1={0} y1={0} x2={hPos.x} y2={hPos.y}
                          stroke="rgba(251,146,60,0.6)" strokeWidth={1.5} strokeDasharray="3 2"
                          style={{ pointerEvents: 'none' }}
                        />
                      )}

                      {/* Direction arrow group (rotates with heading) — arrowhead only, no stem */}
                      <g transform={`rotate(${wp.heading})`} style={{ pointerEvents: 'none' }}>
                        <polygon points={`0,${-WP_R - 10} -6,${-WP_R} 6,${-WP_R}`}
                          fill="rgba(255,255,255,0.95)" />
                      </g>

                      {/* Circle body */}
                      <circle
                        r={WP_R}
                        fill={color}
                        stroke="rgba(255,255,255,0.9)"
                        strokeWidth={2}
                        style={{ cursor: tool === 'move' ? 'grab' : 'pointer' }}
                        onMouseDown={(e) => {
                          if (tool === 'move') handleWpMouseDown(e, wp.id);
                        }}
                        onClick={(e) => {
                          handleWpClick(e, wp.id);
                        }}
                      />

                      {/* Number label (never rotates) */}
                      <text textAnchor="middle" dominantBaseline="central"
                        fill="#fff" fontSize={10} fontWeight="bold"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {i + 1}
                      </text>

                      {/* Rotation handle dot */}
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
                          fill="#fb923c"
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
          <div className="bg-slate-800 border-t border-slate-700 px-4 py-2 flex items-center gap-4 text-xs text-slate-400">
            <span>웨이포인트: <strong className="text-slate-200">{waypoints.length}</strong></span>
            <span>총 경로: <strong className="text-slate-200">{getTotalDistance()} m</strong></span>
            {selectedWp && (
              <span className="text-orange-400 font-medium">
                WP-{String(selectedWpIndex + 1).padStart(2, '0')} 선택됨 — 방향 {selectedWp.heading}° | 주황 핸들 드래그: 방향 변경
              </span>
            )}
            {!selectedWp && (
              <span className="text-slate-500 ml-auto">
                {tool === 'add' ? '클릭: 웨이포인트 추가' : '드래그: 위치 이동 | WP 선택 후 주황 핸들: 방향 회전'}
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
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    setDragOrderId(wp.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragOrderId === null || dragOrderId === wp.id) return;
                    setWaypoints((prev) => {
                      const items = [...prev];
                      const fromIdx = items.findIndex((w) => w.id === dragOrderId);
                      const toIdx   = items.findIndex((w) => w.id === wp.id);
                      const [moved] = items.splice(fromIdx, 1);
                      items.splice(toIdx, 0, moved);
                      return items;
                    });
                    setDragOrderId(null);
                  }}
                  onDragEnd={() => setDragOrderId(null)}
                  onClick={() => setSelectedWpId(wp.id)}
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                    dragOrderId === wp.id ? 'opacity-40' : ''
                  } ${
                    selectedWpId === wp.id
                      ? 'bg-cyan-50 border border-cyan-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <GripVertical className="h-3.5 w-3.5 text-gray-300 flex-shrink-0 cursor-grab" />
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: i === 0 ? WP_COLOR_FIRST : WP_COLOR }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800">WP-{String(i + 1).padStart(2, '0')}</div>
                    <div className="text-xs text-gray-400">
                      {(wp.x * 0.05).toFixed(1)}m, {(wp.y * 0.05).toFixed(1)}m
                    </div>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {(wp.waitSec ?? 0) > 0 && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-1 rounded">
                          {wp.waitSec}s
                        </span>
                      )}
                      {(wp.posture ?? 'normal') !== 'normal' && (
                        <span className="text-xs bg-purple-50 text-purple-600 px-1 rounded">
                          {{ tilt: '기울이기', sit: '앉기' }[wp.posture]}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Heading compass indicator */}
                  <div className="flex flex-col items-center gap-0.5">
                    <svg width={18} height={18} viewBox="-10 -10 20 20">
                      <circle r={8} fill="none" stroke="#e5e7eb" strokeWidth={1.5} />
                      <g transform={`rotate(${wp.heading})`}>
                        <polygon points="0,-7 -3,-1 3,-1"
                          fill={i === 0 ? WP_COLOR_FIRST : WP_COLOR} />
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

        {/* Selected WP detail editor */}
        {selectedWp && (
          <div className="border-t border-gray-200 p-3 space-y-3">

            {/* 방향 */}
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                <RotateCw className="h-3.5 w-3.5 text-orange-400" />
                방향
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={0} max={359}
                  value={selectedWp.heading}
                  onChange={(e) => setWaypoints((prev) =>
                    prev.map((w) => w.id === selectedWp.id ? { ...w, heading: Number(e.target.value) } : w)
                  )}
                  className="flex-1 h-1.5 accent-orange-400"
                />
                <span className="text-xs font-bold text-orange-500 w-10 text-right">{selectedWp.heading}°</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>N</span><span>E</span><span>S</span><span>W</span>
              </div>
            </div>

            {/* 대기시간 */}
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-1.5">대기시간</div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setWaypoints((prev) =>
                    prev.map((w) => w.id === selectedWp.id
                      ? { ...w, waitSec: Math.max(0, (w.waitSec ?? 0) - 1) } : w)
                  )}
                  className="w-6 h-6 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs font-bold flex items-center justify-center"
                >−</button>
                <input
                  type="number" min={0} max={300}
                  value={selectedWp.waitSec ?? 0}
                  onChange={(e) => setWaypoints((prev) =>
                    prev.map((w) => w.id === selectedWp.id
                      ? { ...w, waitSec: Math.max(0, Number(e.target.value)) } : w)
                  )}
                  className="w-14 text-center text-xs border border-gray-200 rounded px-1 py-1 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => setWaypoints((prev) =>
                    prev.map((w) => w.id === selectedWp.id
                      ? { ...w, waitSec: Math.min(300, (w.waitSec ?? 0) + 1) } : w)
                  )}
                  className="w-6 h-6 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs font-bold flex items-center justify-center"
                >+</button>
                <span className="text-xs text-gray-400">초</span>
              </div>
            </div>

            {/* 자세 */}
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-1.5">자세</div>
              <div className="flex gap-1">
                {[
                  { value: 'normal', label: '일반' },
                  { value: 'tilt',   label: '기울이기' },
                  { value: 'sit',    label: '앉기' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setWaypoints((prev) =>
                      prev.map((w) => w.id === selectedWp.id ? { ...w, posture: value } : w)
                    )}
                    className={`flex-1 py-1 text-xs rounded border transition-colors ${
                      (selectedWp.posture ?? 'normal') === value
                        ? 'bg-cyan-500 text-white border-cyan-500 font-medium'
                        : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
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
