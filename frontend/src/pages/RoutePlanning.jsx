import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Map, Plus, Trash2, Download, RotateCcw, MousePointer, Move,
  ChevronRight, ChevronDown, ZoomIn, ZoomOut, Maximize2, RotateCw, GripVertical,
  FolderOpen, Navigation2, Square, Minus, Layers, Check, X, Pencil
} from 'lucide-react';
import { siteApi } from '../utils/api';

// ─── Mock LiDAR map data ────────────────────────────────────────────────────
const MOCK_MAPS = [
  { id: 1, name: 'FPT 하노이 사무소 1층', site: 'Duy Tan, Hanoi', scannedAt: '2026-03-15', resolution: '0.05m/px' },
  { id: 2, name: '보관창고 A구역', site: '울산 조선소', scannedAt: '2026-03-20', resolution: '0.05m/px' },
  { id: 3, name: '보관창고 B구역', site: '울산 조선소', scannedAt: '2026-03-22', resolution: '0.05m/px' },
  { id: 4, name: '데이터 센터', site: '판교 R&D 센터', scannedAt: '2026-04-01', resolution: '0.05m/px' },
];

const MAP_W = 760;
const MAP_H = 520;

// ─── Map editor background (black + white grid only) ────────────────────────
function drawEditorBg(ctx) {
  const G = 20;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, MAP_W, MAP_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 0.75;
  for (let x = 0; x <= MAP_W; x += G) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, MAP_H); ctx.stroke(); }
  for (let y = 0; y <= MAP_H; y += G) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(MAP_W, y); ctx.stroke(); }
}

// ─── Render a user-created map (finished state, same style as MOCK_MAPS) ────
function drawUserMap(ctx, userMap) {
  const w = MAP_W, h = MAP_H, G = 20;
  // 1. Black background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  const pts = userMap.polygon || [];
  if (pts.length >= 3 && userMap.polygonClosed) {
    // 2. Fill interior with traversable-area color
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = '#165a72';
    ctx.fill();
    // Blacken exterior using even-odd rule
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fill('evenodd');
    // Outer boundary line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.strokeStyle = '#00e7ff';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  // 3. No-go zones — black filled (obstacle style), drawn over traversable area
  for (const n of (userMap.nogoZones || [])) {
    ctx.fillStyle = '#020c14';
    ctx.fillRect(n.x, n.y, n.w, n.h);
    ctx.strokeStyle = 'rgba(0,231,255,0.7)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(n.x, n.y, n.w, n.h);
  }

  // 4. Walls — dim cyan lines
  ctx.lineCap = 'round';
  for (const wall of (userMap.walls || [])) {
    ctx.beginPath();
    ctx.moveTo(wall.x1, wall.y1);
    ctx.lineTo(wall.x2, wall.y2);
    ctx.strokeStyle = 'rgba(0,231,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // 5. Grid always on top
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 0.75;
  for (let x = 0; x <= w; x += G) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += G) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}

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
  const [savedRoutes, setSavedRoutes] = useState(() => {
    try {
      const s = localStorage.getItem('robopilot_saved_routes');
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });
  const [activeRouteId, setActiveRouteId] = useState(null); // { mapId, routeId }

  // ── Map editor state ──────────────────────────────────────────────────────
  const [mapEditor, setMapEditor] = useState(null); // null | {siteId, siteName, mapName}
  const [editorTool, setEditorTool] = useState('zone'); // 'zone' | 'wall' | 'nogozone'
  const [zonePoints, setZonePoints] = useState([]); // [{id,x,y}]
  const [zoneClosed, setZoneClosed] = useState(false);
  const [walls, setWalls] = useState([]); // [{id,x1,y1,x2,y2}]
  const [nogoZones, setNogoZones] = useState([]); // [{id,x,y,w,h}]
  const [editorDrag, setEditorDrag] = useState(null);
  const [wallStart, setWallStart] = useState(null); // pending first click {x,y}
  const [nogoDrawing, setNogoDrawing] = useState(null); // {x0,y0,x1,y1} while dragging
  const [mousePos, setMousePos] = useState(null);
  const [selectedEditorId, setSelectedEditorId] = useState(null);
  const [dragZPId, setDragZPId] = useState(null); // drag-reorder zone point id
  const [activeEditMapId, setActiveEditMapId] = useState(null); // user map being edited
  const editorCanvasRef = useRef(null);
  const editorSvgRef = useRef(null);
  const nextEditorId = useRef(1);

  // User-created maps (persisted)
  const [userMaps, setUserMaps] = useState(() => {
    try {
      const s = localStorage.getItem('robopilot_user_maps');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  const [editingName, setEditingName] = useState(null); // { type: 'site'|'map'|'route', id, mapId?, value }

  // Local site name overrides — independent of Sites API
  const [siteNameOverrides, setSiteNameOverrides] = useState(() => {
    try { const s = localStorage.getItem('robopilot_site_name_overrides'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  // Local map name overrides — for MOCK_MAPS whose names can't be changed in-place
  const [mapNameOverrides, setMapNameOverrides] = useState(() => {
    try { const s = localStorage.getItem('robopilot_map_name_overrides'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });

  const [zoom, setZoom] = useState(1);
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [openSites, setOpenSites] = useState({}); // siteId → false means collapsed (default open)
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const fileInputRef = useRef(null);
  const nextId = useRef(1);

  // Persist savedRoutes to localStorage on every change
  useEffect(() => {
    localStorage.setItem('robopilot_saved_routes', JSON.stringify(savedRoutes));
  }, [savedRoutes]);

  // Persist userMaps to localStorage
  useEffect(() => {
    localStorage.setItem('robopilot_user_maps', JSON.stringify(userMaps));
  }, [userMaps]);

  // Persist name overrides
  useEffect(() => { localStorage.setItem('robopilot_site_name_overrides', JSON.stringify(siteNameOverrides)); }, [siteNameOverrides]);
  useEffect(() => { localStorage.setItem('robopilot_map_name_overrides', JSON.stringify(mapNameOverrides)); }, [mapNameOverrides]);

  // Auto-save waypoints to the active route whenever they change
  useEffect(() => {
    if (!activeRouteId) return;
    setSavedRoutes((prev) => {
      const routes = prev[activeRouteId.mapId] ?? [];
      if (!routes.some((r) => r.id === activeRouteId.routeId)) return prev;
      return {
        ...prev,
        [activeRouteId.mapId]: routes.map((r) =>
          r.id === activeRouteId.routeId
            ? { ...r, waypoints: waypoints.map((wp) => ({ ...wp })), savedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }
            : r
        ),
      };
    });
  }, [waypoints, activeRouteId]);

  useEffect(() => {
    if (!canvasRef.current || !selectedMapId) return;
    const ctx = canvasRef.current.getContext('2d');
    const userMap = userMaps.find((m) => m.id === selectedMapId);
    if (userMap) {
      drawUserMap(ctx, userMap);
    } else {
      drawLidarMap(ctx, selectedMapId);
    }
  }, [selectedMapId, userMaps, mapEditor]);

  // Load sites from API
  useEffect(() => {
    siteApi.getAll()
      .then((data) => setSites(data || []))
      .catch(() => setSites([]))
      .finally(() => setSitesLoading(false));
  }, []);

  // Group all maps (built-in + user-created) under API sites
  const mapsBySite = useMemo(() => {
    const allMaps = [...MOCK_MAPS, ...userMaps];
    const match = (map, site) => {
      const s = map.site.toLowerCase();
      const sn = site.name.toLowerCase();
      const sl = (site.location || '').toLowerCase();
      return s === sn || s === sl || sn.includes(s) || sl.includes(s) || s.includes(sn);
    };

    if (sites.length === 0) {
      // Fallback: group by map.site string
      const groups = {};
      for (const m of allMaps) {
        (groups[m.site] = groups[m.site] || []).push(m);
      }
      return Object.entries(groups).map(([name, maps]) => ({
        site: { id: name, name, location: '' },
        maps,
      }));
    }

    const assignedIds = new Set();
    const result = sites.map((site) => {
      const maps = allMaps.filter((m) => match(m, site));
      maps.forEach((m) => assignedIds.add(m.id));
      return { site, maps };
    });

    // Unmatched maps grouped by their site string
    const unmatched = allMaps.filter((m) => !assignedIds.has(m.id));
    const extra = {};
    for (const m of unmatched) (extra[m.site] = extra[m.site] || []).push(m);
    for (const [name, maps] of Object.entries(extra)) {
      result.push({ site: { id: `_extra_${name}`, name, location: '' }, maps });
    }

    return result;
  }, [sites, userMaps]);

  const isSiteOpen = (siteId) => openSites[siteId] !== false;
  const toggleSite = (siteId) =>
    setOpenSites((prev) => ({ ...prev, [siteId]: !isSiteOpen(siteId) }));

  // Draw editor background whenever editor opens
  useEffect(() => {
    if (!mapEditor || !editorCanvasRef.current) return;
    drawEditorBg(editorCanvasRef.current.getContext('2d'));
  }, [mapEditor]);

  // Auto-save editor state into the active userMap entry
  useEffect(() => {
    if (!activeEditMapId) return;
    setUserMaps((prev) =>
      prev.map((m) =>
        m.id === activeEditMapId
          ? { ...m, polygon: zonePoints, polygonClosed: zoneClosed, walls, nogoZones }
          : m
      )
    );
  }, [zonePoints, zoneClosed, walls, nogoZones, activeEditMapId]);

  const editorCoords = useCallback((e) => {
    const rect = editorSvgRef.current.getBoundingClientRect();
    return {
      x: Math.round((e.clientX - rect.left) / zoom),
      y: Math.round((e.clientY - rect.top) / zoom),
    };
  }, [zoom]);

  const handleEditorMouseDown = useCallback((e) => {
    if (!editorSvgRef.current) return;
    const isBg = e.target === editorSvgRef.current || e.target.dataset.bg === 'true';
    const { x, y } = editorCoords(e);

    if (editorTool === 'nogozone' && isBg) {
      setNogoDrawing({ x0: x, y0: y, x1: x, y1: y });
    }
  }, [editorTool, editorCoords]);

  const handleEditorClick = useCallback((e) => {
    if (!editorSvgRef.current) return;
    const isBg = e.target === editorSvgRef.current || e.target.dataset.bg === 'true';
    if (!isBg) return;
    const { x, y } = editorCoords(e);

    if (editorTool === 'zone' && !zoneClosed) {
      if (zonePoints.length >= 3) {
        const fp = zonePoints[0];
        if (Math.hypot(x - fp.x, y - fp.y) < 14) { setZoneClosed(true); return; }
      }
      setZonePoints((prev) => [...prev, { id: nextEditorId.current++, x, y }]);
    } else if (editorTool === 'wall') {
      if (!wallStart) {
        setWallStart({ x, y });
      } else {
        setWalls((prev) => [...prev, { id: nextEditorId.current++, x1: wallStart.x, y1: wallStart.y, x2: x, y2: y }]);
        setWallStart(null);
        setMousePos(null);
      }
    }
  }, [editorTool, zonePoints, zoneClosed, wallStart, editorCoords]);

  const handleEditorMouseMove = useCallback((e) => {
    if (!editorSvgRef.current) return;
    const { x, y } = editorCoords(e);
    setMousePos({ x, y });

    if (nogoDrawing) {
      setNogoDrawing((d) => d ? { ...d, x1: x, y1: y } : null);
      return;
    }
    if (!editorDrag) return;
    const cx = Math.max(0, Math.min(MAP_W, x));
    const cy = Math.max(0, Math.min(MAP_H, y));

    if (editorDrag.type === 'zonePoint') {
      setZonePoints((prev) => prev.map((p) => p.id === editorDrag.id ? { ...p, x: cx, y: cy } : p));
    } else if (editorDrag.type === 'wallPt1') {
      setWalls((prev) => prev.map((w) => w.id === editorDrag.id ? { ...w, x1: cx, y1: cy } : w));
    } else if (editorDrag.type === 'wallPt2') {
      setWalls((prev) => prev.map((w) => w.id === editorDrag.id ? { ...w, x2: cx, y2: cy } : w));
    } else if (editorDrag.type === 'nogoMove') {
      setNogoZones((prev) => prev.map((n) => n.id === editorDrag.id
        ? { ...n, x: cx - editorDrag.offX, y: cy - editorDrag.offY } : n));
    } else if (editorDrag.type === 'nogoResize') {
      setNogoZones((prev) => prev.map((n) => {
        if (n.id !== editorDrag.id) return n;
        const c = editorDrag.corner;
        let { x: nx, y: ny, w: nw, h: nh } = n;
        if (c === 'br') { nw = Math.max(10, cx - nx); nh = Math.max(10, cy - ny); }
        else if (c === 'bl') { const r = nx + nw; nw = Math.max(10, r - cx); nx = cx; nh = Math.max(10, cy - ny); }
        else if (c === 'tr') { nw = Math.max(10, cx - nx); const b = ny + nh; nh = Math.max(10, b - cy); ny = cy; }
        else { const r = nx + nw; const b = ny + nh; nw = Math.max(10, r - cx); nx = cx; nh = Math.max(10, b - cy); ny = cy; }
        return { ...n, x: nx, y: ny, w: nw, h: nh };
      }));
    }
  }, [editorCoords, editorDrag, nogoDrawing]);

  const handleEditorMouseUp = useCallback(() => {
    if (nogoDrawing) {
      const { x0, y0, x1, y1 } = nogoDrawing;
      const rx = Math.min(x0, x1), ry = Math.min(y0, y1);
      const rw = Math.abs(x1 - x0), rh = Math.abs(y1 - y0);
      if (rw > 5 && rh > 5) {
        setNogoZones((prev) => [...prev, { id: nextEditorId.current++, x: rx, y: ry, w: rw, h: rh }]);
      }
      setNogoDrawing(null);
    }
    setEditorDrag(null);
  }, [nogoDrawing]);

  // ── Name helpers (defined early so all functions below can use them) ────────
  const getSiteName = (site) => siteNameOverrides[site.id] ?? site.name;
  const getMapName = (m) => mapNameOverrides[m.id] ?? m.name;

  const openMapEditor = (siteId, siteName) => {
    const defaultName = `${siteName} 맵 ${userMaps.filter((m) => m.site === siteName).length + 1}`;
    const name = window.prompt('새 맵 이름을 입력하세요', defaultName);
    if (name === null) return;
    const mapName = name.trim() || defaultName;
    const mapId = Date.now();
    // Create map entry immediately → shows in tree right away
    setUserMaps((prev) => [...prev, {
      id: mapId,
      name: mapName,
      site: siteName,
      scannedAt: new Date().toISOString().split('T')[0],
      resolution: '0.05m/px',
      isUserCreated: true,
      polygon: [],
      polygonClosed: false,
      walls: [],
      nogoZones: [],
    }]);
    setActiveEditMapId(mapId);
    setMapEditor({ siteId, siteName, mapName });
    setEditorTool('zone');
    setZonePoints([]); setZoneClosed(false);
    setWalls([]); setNogoZones([]);
    setWallStart(null); setMousePos(null); setSelectedEditorId(null);
    nextEditorId.current = 1;
  };

  // Open an EXISTING user map for editing — always loads fresh from userMaps state
  const openExistingMapEditor = (mapId) => {
    const m = userMaps.find((um) => um.id === mapId);
    if (!m) return;
    const mapName = getMapName(m);
    setActiveEditMapId(m.id);
    setMapEditor({ siteId: null, siteName: m.site, mapName });
    setEditorTool('zone');
    setZonePoints(m.polygon || []);
    setZoneClosed(m.polygonClosed || false);
    setWalls(m.walls || []);
    setNogoZones(m.nogoZones || []);
    setWallStart(null); setMousePos(null); setSelectedEditorId(null);
    const allIds = [
      ...(m.polygon || []), ...(m.walls || []), ...(m.nogoZones || []),
    ].map((x) => x.id || 0);
    nextEditorId.current = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;
  };

  const closeMapEditor = () => {
    // After editing, show the rendered map in route-planning view
    if (activeEditMapId) setSelectedMapId(activeEditMapId);
    setMapEditor(null);
    setActiveEditMapId(null);
    setWallStart(null); setMousePos(null);
    setNogoDrawing(null); setEditorDrag(null);
  };

  const handleSaveEditName = () => {
    if (!editingName) return;
    const newName = editingName.value.trim();
    if (!newName) { setEditingName(null); return; }
    if (editingName.type === 'site') {
      // Store locally only — independent of Sites API
      setSiteNameOverrides((prev) => ({ ...prev, [editingName.id]: newName }));
    } else if (editingName.type === 'map') {
      const isUserMap = userMaps.some((m) => m.id === editingName.id);
      if (isUserMap) {
        setUserMaps((prev) => prev.map((m) => m.id === editingName.id ? { ...m, name: newName } : m));
      } else {
        setMapNameOverrides((prev) => ({ ...prev, [editingName.id]: newName }));
      }
    } else if (editingName.type === 'route') {
      setSavedRoutes((prev) => ({
        ...prev,
        [editingName.mapId]: (prev[editingName.mapId] ?? []).map((r) =>
          r.id === editingName.id ? { ...r, name: newName } : r
        ),
      }));
    }
    setEditingName(null);
  };

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

  // ── Route management ────────────────────────────────────────────────────
  const handleCreateRoute = (mapId) => {
    const defaultName = `경로 ${(savedRoutes[mapId]?.length ?? 0) + 1}`;
    const name = window.prompt('새 경로 이름을 입력하세요', defaultName);
    if (name === null) return;
    const routeId = Date.now();
    const newRoute = {
      id: routeId,
      name: name.trim() || defaultName,
      waypoints: [],
      savedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setSavedRoutes((prev) => ({
      ...prev,
      [mapId]: [...(prev[mapId] ?? []), newRoute],
    }));
    setSelectedMapId(mapId);
    setWaypoints([]);
    nextId.current = 1;
    setSelectedWpId(null);
    setActiveRouteId({ mapId, routeId });
  };

  const handleLoadRoute = (route, mapId) => {
    setSelectedMapId(mapId);
    const wps = route.waypoints.map((wp) => ({ ...wp }));
    setWaypoints(wps);
    nextId.current = wps.length > 0 ? Math.max(...wps.map((w) => w.id)) + 1 : 1;
    setSelectedWpId(null);
    setActiveRouteId({ mapId, routeId: route.id });
  };

  const handleDeleteSavedRoute = (mapId, routeId) => {
    setSavedRoutes((prev) => ({
      ...prev,
      [mapId]: prev[mapId].filter((r) => r.id !== routeId),
    }));
  };

  // ── JSON 파일 불러오기 ─────────────────────────────────────────────────────
  const handleImportRoute = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.map?.id || !Array.isArray(data.waypoints)) {
          alert('유효하지 않은 경로 파일입니다.');
          return;
        }
        const mapId = data.map.id;
        let name = data.routeName || data.map.name;

        // 이름 충돌 확인
        const existing = savedRoutes[mapId] ?? [];
        if (existing.some((r) => r.name === name)) {
          const newName = window.prompt(
            `'${name}' 이름의 경로가 이미 존재합니다.\n새 이름을 입력하세요:`,
            `${name} (2)`
          );
          if (newName === null) return; // 취소
          name = newName.trim() || name;
        }

        const loadedWp = data.waypoints.map((wp) => ({
          id: wp.id,
          x: wp.x_px,
          y: wp.y_px,
          heading: wp.heading_deg ?? 0,
          waitSec: wp.wait_sec ?? 0,
          posture: wp.posture ?? 'normal',
        }));

        const newRoute = {
          id: Date.now(),
          name,
          waypoints: loadedWp,
          savedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        };

        setSavedRoutes((prev) => ({
          ...prev,
          [mapId]: [...(prev[mapId] ?? []), newRoute],
        }));

        // 맵 + 웨이포인트 바로 적용, 활성 경로로 설정
        setSelectedMapId(mapId);
        setWaypoints(loadedWp);
        nextId.current = loadedWp.length > 0 ? Math.max(...loadedWp.map((w) => w.id)) + 1 : 1;
        setSelectedWpId(null);
        setActiveRouteId({ mapId, routeId: newRoute.id });
      } catch {
        alert('파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const saveRoute = () => {
    if (!currentMap) return;
    const mapRoutes = savedRoutes[selectedMapId] ?? [];
    const routeName = mapRoutes.length > 0
      ? mapRoutes[mapRoutes.length - 1].name
      : getMapName(currentMap);
    const data = {
      version: '1.0',
      routeName,
      map: { id: currentMap.id, name: getMapName(currentMap), site: currentMap.site, resolution: currentMap.resolution, width: MAP_W, height: MAP_H },
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
  const selectedUserMap = userMaps.find((m) => m.id === selectedMapId);
  const currentMap = selectedUserMap || selectedMap; // whichever is selected
  const selectedWp = waypoints.find((w) => w.id === selectedWpId);
  const selectedWpIndex = waypoints.findIndex((w) => w.id === selectedWpId);

  return (
    <div className="h-full flex bg-gray-100 overflow-hidden">

      {/* ── Left: site & map tree ───────────────────────── */}
      <div className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Map className="h-4 w-4 text-cyan-500" />사이트 맵 &amp; 경로 계획
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sitesLoading ? (
            <div className="text-xs text-gray-400 text-center py-6">로딩 중...</div>
          ) : mapsBySite.map(({ site, maps }) => (
            <div key={site.id}>
              {/* Site header row */}
              <div className="flex items-center">
                <button
                  onClick={() => toggleSite(site.id)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  {isSiteOpen(site.id)
                    ? <ChevronDown className="h-3 w-3" />
                    : <ChevronRight className="h-3 w-3" />}
                </button>
                {editingName?.type === 'site' && editingName?.id === site.id ? (
                  <input
                    autoFocus
                    value={editingName.value}
                    onChange={(e) => setEditingName((prev) => ({ ...prev, value: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditName(); if (e.key === 'Escape') setEditingName(null); }}
                    onBlur={handleSaveEditName}
                    className="flex-1 text-xs font-semibold border border-cyan-400 rounded px-1 py-0.5 focus:outline-none min-w-0"
                  />
                ) : (
                  <span
                    className="flex-1 text-xs font-semibold text-gray-500 truncate normal-case cursor-pointer px-1 py-1 hover:bg-gray-50 rounded"
                    onClick={() => toggleSite(site.id)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      const isExtra = typeof site.id === 'string' && site.id.startsWith('_extra_');
                      if (!isExtra) setEditingName({ type: 'site', id: site.id, value: getSiteName(site) });
                    }}
                  >{getSiteName(site)}</span>
                )}
                <button
                  onClick={() => openMapEditor(site.id, site.name)}
                  title="새 맵 추가"
                  className="p-0.5 rounded text-gray-300 hover:text-green-500 hover:bg-green-50 flex-shrink-0 mr-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Maps + routes under this site */}
              {isSiteOpen(site.id) && (
                maps.length === 0 ? (
                  <p className="px-4 py-1 text-xs text-gray-300 italic">등록된 맵이 없습니다</p>
                ) : (
                  maps.map((m) => (
                    <div key={m.id}>
                      {/* Map row */}
                      <div className={`flex items-center px-3 py-2 rounded-lg text-xs transition-colors ${
                        activeEditMapId === m.id ? 'bg-green-50 text-green-700 font-medium' :
                        selectedMapId === m.id ? 'bg-cyan-50 text-cyan-700 font-medium' :
                        'text-gray-700 hover:bg-gray-50'
                      }`}>
                        <div
                          onClick={() => {
                            const isUserMap = userMaps.some((um) => um.id === m.id);
                            if (isUserMap) {
                              openExistingMapEditor(m.id);
                            } else {
                              setSelectedMapId(m.id);
                              setWaypoints([]); nextId.current = 1;
                              setSelectedWpId(null); setActiveRouteId(null);
                            }
                          }}
                          className="flex-1 text-left min-w-0 cursor-pointer"
                        >
                          {editingName?.type === 'map' && editingName?.id === m.id ? (
                            <input
                              autoFocus
                              value={editingName.value}
                              onChange={(e) => setEditingName((prev) => ({ ...prev, value: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditName(); if (e.key === 'Escape') setEditingName(null); }}
                              onBlur={handleSaveEditName}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full text-xs font-medium border border-cyan-400 rounded px-1 py-0.5 focus:outline-none"
                            />
                          ) : (
                            <div
                              className="font-medium truncate flex items-center gap-1"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingName({ type: 'map', id: m.id, value: getMapName(m) });
                              }}
                            >
                              {getMapName(m).split(' ').slice(-2).join(' ')}
                              {m.isUserCreated && <span className="text-green-400 text-xs">✎</span>}
                            </div>
                          )}
                          <div className="text-gray-400 mt-0.5">{m.scannedAt}</div>
                        </div>
                        {/* Delete user map */}
                        {m.isUserCreated && (
                          <button
                            onClick={(e) => { e.stopPropagation(); if (window.confirm(`'${m.name}' 맵을 삭제할까요?`)) { setUserMaps((prev) => prev.filter((um) => um.id !== m.id)); if (selectedMapId === m.id) { setSelectedMapId(null); setWaypoints([]); } } }}
                            title="맵 삭제"
                            className="ml-1 p-0.5 rounded text-gray-300 hover:text-red-400 hover:bg-red-50 flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                        {/* Add route button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCreateRoute(m.id); }}
                          title="새 경로 만들기"
                          className="ml-1 p-0.5 rounded text-gray-300 hover:text-cyan-500 hover:bg-cyan-100 flex-shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Saved routes tree under this map */}
                      {(savedRoutes[m.id] ?? []).map((route) => (
                        <div
                          key={route.id}
                          onClick={() => handleLoadRoute(route, m.id)}
                          className={`ml-3 flex items-center gap-1 pl-2 pr-1 py-1.5 border-l-2 rounded-r group transition-colors cursor-pointer ${
                            activeRouteId?.routeId === route.id
                              ? 'border-cyan-500 bg-cyan-50'
                              : 'border-cyan-100 hover:border-cyan-400 hover:bg-cyan-50'
                          }`}
                        >
                          <Navigation2 className={`h-3 w-3 flex-shrink-0 ${activeRouteId?.routeId === route.id ? 'text-cyan-600' : 'text-cyan-400'}`} />
                          {editingName?.type === 'route' && editingName?.id === route.id ? (
                            <input
                              autoFocus
                              value={editingName.value}
                              onChange={(e) => setEditingName((prev) => ({ ...prev, value: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditName(); if (e.key === 'Escape') setEditingName(null); }}
                              onBlur={handleSaveEditName}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 text-xs border border-cyan-400 rounded px-1 py-0.5 focus:outline-none min-w-0"
                            />
                          ) : (
                            <span
                              className={`flex-1 text-xs truncate group-hover:text-cyan-700 ${activeRouteId?.routeId === route.id ? 'text-cyan-700 font-medium' : 'text-gray-600'}`}
                              onDoubleClick={(e) => { e.stopPropagation(); setEditingName({ type: 'route', id: route.id, mapId: m.id, value: route.name }); }}
                            >{route.name}</span>
                          )}
                          <span className="text-xs text-gray-300 flex-shrink-0">{route.savedAt}</span>
                          <button
                            title="삭제"
                            onClick={(e) => { e.stopPropagation(); handleDeleteSavedRoute(m.id, route.id); }}
                            className="p-0.5 text-gray-300 hover:text-red-500 flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))
                )
              )}
            </div>
          ))}
        </div>
        {currentMap && !mapEditor && (
          <div className="border-t border-gray-200 p-3 text-xs text-gray-500 space-y-0.5">
            <div className="font-semibold text-gray-700 truncate">{getMapName(currentMap)}</div>
            <div>해상도: {currentMap.resolution}</div>
            <div>스캔일: {currentMap.scannedAt}</div>
          </div>
        )}
      </div>

      {/* ── Center: canvas + toolbar ─────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ══ MAP EDITOR MODE ══════════════════════════════════════════════════ */}
        {mapEditor ? (<>
          {/* Editor Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800 mr-1">{mapEditor.mapName}</span>
            <span className="text-xs text-gray-400">{mapEditor.siteName}</span>

            {/* Tool tabs */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5 ml-2">
              {[
                { key: 'zone',     icon: <Layers className="h-3.5 w-3.5" />, label: '전체구역' },
                { key: 'wall',     icon: <Minus className="h-3.5 w-3.5" />,  label: '벽 추가' },
                { key: 'nogozone', icon: <Square className="h-3.5 w-3.5" />, label: '주행금지구역' },
              ].map(({ key, icon, label }) => (
                <button key={key}
                  onClick={() => { setEditorTool(key); setWallStart(null); setMousePos(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    editorTool === key ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {icon}{label}
                </button>
              ))}
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)))} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><ZoomIn className="h-4 w-4" /></button>
              <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(1)))} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><ZoomOut className="h-4 w-4" /></button>
              <button onClick={() => setZoom(1)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Maximize2 className="h-4 w-4" /></button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {editorTool === 'zone' && zoneClosed && (
                <span className="text-xs text-green-600 font-medium">● 구역 완성됨</span>
              )}
              {editorTool === 'wall' && wallStart && (
                <span className="text-xs text-yellow-600 font-medium">● 끝점을 클릭하세요</span>
              )}
              <button onClick={closeMapEditor}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300">
                <X className="h-3.5 w-3.5" />편집 종료
              </button>
            </div>
          </div>

          {/* Editor Canvas */}
          <div className="flex-1 overflow-auto p-3 bg-slate-900">
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', position: 'relative', width: MAP_W, height: MAP_H, flexShrink: 0 }}>
              <canvas ref={editorCanvasRef} width={MAP_W} height={MAP_H}
                style={{ display: 'block', borderRadius: 6, boxShadow: '0 0 0 1px rgba(0,200,220,0.25), 0 6px 32px rgba(0,0,0,0.6)' }}
              />
              <svg ref={editorSvgRef} width={MAP_W} height={MAP_H}
                className="absolute inset-0"
                style={{ borderRadius: 6, cursor: editorTool === 'nogozone' ? 'crosshair' : editorTool === 'zone' ? 'crosshair' : 'crosshair' }}
                onClick={handleEditorClick}
                onMouseDown={handleEditorMouseDown}
                onMouseMove={handleEditorMouseMove}
                onMouseUp={handleEditorMouseUp}
                onMouseLeave={handleEditorMouseUp}
              >
                <rect width={MAP_W} height={MAP_H} fill="transparent" data-bg="true" />

                {/* No-go zones */}
                {nogoZones.map((n) => {
                  const isSel = selectedEditorId === n.id;
                  return (
                    <g key={n.id}>
                      <rect x={n.x} y={n.y} width={n.w} height={n.h}
                        fill="#000" stroke={isSel ? '#f97316' : 'rgba(0,231,255,0.5)'} strokeWidth={isSel ? 2 : 1}
                        style={{ cursor: 'move' }}
                        onMouseDown={(e) => { e.stopPropagation(); setSelectedEditorId(n.id); setEditorDrag({ type: 'nogoMove', id: n.id, offX: editorCoords(e).x - n.x, offY: editorCoords(e).y - n.y }); }}
                      />
                      {isSel && [['tl',n.x,n.y],['tr',n.x+n.w,n.y],['bl',n.x,n.y+n.h],['br',n.x+n.w,n.y+n.h]].map(([c,cx,cy]) => (
                        <circle key={c} cx={cx} cy={cy} r={5} fill="#f97316" stroke="#fff" strokeWidth={1.5}
                          style={{ cursor: 'nwse-resize' }}
                          onMouseDown={(e) => { e.stopPropagation(); setEditorDrag({ type: 'nogoResize', id: n.id, corner: c }); }}
                        />
                      ))}
                      {isSel && (
                        <g onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setNogoZones((prev) => prev.filter((z) => z.id !== n.id)); setSelectedEditorId(null); }}>
                          <rect x={n.x+n.w-14} y={n.y-14} width={14} height={14} rx={2} fill="#ef4444" style={{ cursor: 'pointer' }} />
                          <text x={n.x+n.w-7} y={n.y-4} textAnchor="middle" fill="#fff" fontSize={10} style={{ pointerEvents: 'none' }}>×</text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* No-go zone in progress */}
                {nogoDrawing && (() => {
                  const rx = Math.min(nogoDrawing.x0, nogoDrawing.x1);
                  const ry = Math.min(nogoDrawing.y0, nogoDrawing.y1);
                  const rw = Math.abs(nogoDrawing.x1 - nogoDrawing.x0);
                  const rh = Math.abs(nogoDrawing.y1 - nogoDrawing.y0);
                  return <rect x={rx} y={ry} width={rw} height={rh} fill="rgba(0,0,0,0.7)" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 2" style={{ pointerEvents: 'none' }} />;
                })()}

                {/* Walls */}
                {walls.map((w) => {
                  const isSel = selectedEditorId === w.id;
                  return (
                    <g key={w.id}>
                      <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                        stroke={isSel ? '#f97316' : 'rgba(0,231,255,0.85)'} strokeWidth={isSel ? 3 : 2}
                        strokeLinecap="round" style={{ cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedEditorId(w.id); }}
                      />
                      {[['wallPt1',w.x1,w.y1],['wallPt2',w.x2,w.y2]].map(([type,cx,cy]) => (
                        <circle key={type} cx={cx} cy={cy} r={6} fill={isSel ? '#f97316' : '#00e7ff'} stroke="#fff" strokeWidth={1.5}
                          style={{ cursor: 'grab' }}
                          onMouseDown={(e) => { e.stopPropagation(); setSelectedEditorId(w.id); setEditorDrag({ type, id: w.id }); }}
                        />
                      ))}
                      {isSel && (
                        <g onClick={(e) => { e.stopPropagation(); setWalls((prev) => prev.filter((wl) => wl.id !== w.id)); setSelectedEditorId(null); }}>
                          <rect x={(w.x1+w.x2)/2-7} y={(w.y1+w.y2)/2-7} width={14} height={14} rx={2} fill="#ef4444" style={{ cursor: 'pointer' }} />
                          <text x={(w.x1+w.x2)/2} y={(w.y1+w.y2)/2+4} textAnchor="middle" fill="#fff" fontSize={10} style={{ pointerEvents: 'none' }}>×</text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Wall preview while drawing */}
                {editorTool === 'wall' && wallStart && mousePos && (
                  <line x1={wallStart.x} y1={wallStart.y} x2={mousePos.x} y2={mousePos.y}
                    stroke="rgba(251,146,60,0.7)" strokeWidth={2} strokeDasharray="6 3"
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Zone polygon */}
                {zonePoints.length >= 2 && (
                  <polyline
                    points={zonePoints.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none" stroke="#00e7ff" strokeWidth={2} strokeLinejoin="round"
                    style={{ pointerEvents: 'none' }}
                  />
                )}
                {zoneClosed && zonePoints.length >= 3 && (
                  <>
                    <polygon
                      points={zonePoints.map((p) => `${p.x},${p.y}`).join(' ')}
                      fill="rgba(22,90,114,0.55)" stroke="#00e7ff" strokeWidth={2}
                      style={{ pointerEvents: 'none' }}
                    />
                  </>
                )}
                {/* Preview line to cursor while placing zone points */}
                {editorTool === 'zone' && !zoneClosed && zonePoints.length > 0 && mousePos && (
                  <line x1={zonePoints[zonePoints.length-1].x} y1={zonePoints[zonePoints.length-1].y}
                    x2={mousePos.x} y2={mousePos.y}
                    stroke="rgba(0,231,255,0.5)" strokeWidth={1.5} strokeDasharray="5 3"
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Zone points */}
                {zonePoints.map((p, i) => {
                  const isFirst = i === 0;
                  const canClose = isFirst && zonePoints.length >= 3 && !zoneClosed;
                  return (
                    <g key={p.id} transform={`translate(${p.x},${p.y})`}>
                      {canClose && mousePos && Math.hypot(mousePos.x - p.x, mousePos.y - p.y) < 20 && (
                        <circle r={14} fill="rgba(0,231,255,0.2)" stroke="#00e7ff" strokeWidth={1.5} strokeDasharray="3 2" style={{ pointerEvents: 'none' }} />
                      )}
                      <circle r={6}
                        fill={isFirst ? '#00d07a' : '#00e7ff'}
                        stroke="#fff" strokeWidth={1.5}
                        style={{ cursor: 'grab' }}
                        onMouseDown={(e) => { e.stopPropagation(); setEditorDrag({ type: 'zonePoint', id: p.id }); }}
                      />
                      <text textAnchor="middle" y={-10} fill="#fff" fontSize={9} style={{ pointerEvents: 'none' }}>{i + 1}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Editor status bar */}
          <div className="bg-slate-800 border-t border-slate-700 px-4 py-2 flex items-center gap-4 text-xs text-slate-400">
            {editorTool === 'zone' && !zoneClosed && <span>클릭: 꼭짓점 추가 | 첫 번째 점 클릭: 구역 완성</span>}
            {editorTool === 'zone' && zoneClosed && <span className="text-green-400">구역 완성 — 점 드래그로 조정 가능</span>}
            {editorTool === 'wall' && !wallStart && <span>클릭: 벽 시작점 설정</span>}
            {editorTool === 'wall' && wallStart && <span className="text-yellow-400">클릭: 벽 끝점 설정 | 벽 수: {walls.length + 1}</span>}
            {editorTool === 'nogozone' && <span>드래그: 주행금지구역 그리기 | 완성 후 모서리 드래그: 크기 조정</span>}
            <span className="ml-auto">구역점: {zonePoints.length} | 벽: {walls.length} | 금지구역: {nogoZones.length}</span>
          </div>
        </>) : (
        <>
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800 mr-1">
            {currentMap ? getMapName(currentMap) : '맵을 선택하세요'}
          </span>

          {/* 편집 시작 button — only for user maps */}
          {selectedUserMap && (
            <button
              onClick={() => openExistingMapEditor(selectedMapId)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-green-700 hover:bg-green-50 rounded-lg border border-green-300"
            >
              <Pencil className="h-3.5 w-3.5" />편집 시작
            </button>
          )}

          {/* Tool toggle — only useful when there's a map selected */}
          {selectedMapId && (
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
          )}

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)))} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><ZoomIn className="h-4 w-4" /></button>
            <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(1)))} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><ZoomOut className="h-4 w-4" /></button>
            <button onClick={() => setZoom(1)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Maximize2 className="h-4 w-4" /></button>
          </div>

          {/* Legend — hide for user maps with no route yet */}
          {(selectedMap || activeRouteId) && (
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
          )}

          <div className="ml-auto flex items-center gap-2">
            <button onClick={clearAll} disabled={waypoints.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed">
              <RotateCcw className="h-3.5 w-3.5" />초기화
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportRoute} />
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300">
              <FolderOpen className="h-3.5 w-3.5" />불러오기
            </button>
            <button onClick={saveRoute} disabled={!selectedMapId || waypoints.length < 2}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
              <Download className="h-3.5 w-3.5" />경로 다운로드
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
            {activeRouteId && (
              <span className="text-cyan-400">
                ● 자동저장 중
              </span>
            )}
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
        </>
        )} {/* end mapEditor ternary */}
      </div>

      {/* ── Right panel ─────────────────────────────────── */}
      <div className="w-60 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col">

      {mapEditor ? (
        /* ── Map editor right panel ── */
        <>
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-800">
              {editorTool === 'zone' ? '구역 꼭짓점 목록' : editorTool === 'wall' ? '벽 목록' : '주행금지구역 목록'}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {editorTool === 'zone' && (
              zonePoints.length === 0 ? (
                <p className="text-xs text-gray-400 text-center mt-6">캔버스를 클릭하여 꼭짓점 추가</p>
              ) : zonePoints.map((p, i) => (
                <div key={p.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragZPId(p.id); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!dragZPId || dragZPId === p.id) return;
                    setZonePoints((prev) => {
                      const items = [...prev];
                      const fi = items.findIndex((z) => z.id === dragZPId);
                      const ti = items.findIndex((z) => z.id === p.id);
                      const [m] = items.splice(fi, 1);
                      items.splice(ti, 0, m);
                      return items;
                    });
                    setDragZPId(null);
                  }}
                  onDragEnd={() => setDragZPId(null)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors border ${
                    dragZPId === p.id ? 'opacity-40' : ''
                  } border-transparent hover:bg-gray-50`}
                >
                  <GripVertical className="h-3.5 w-3.5 text-gray-300 flex-shrink-0 cursor-grab" />
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: i === 0 ? '#00d07a' : '#00e7ff' }}>{i + 1}</div>
                  <span className="flex-1 text-gray-600">{(p.x*0.05).toFixed(1)}m, {(p.y*0.05).toFixed(1)}m</span>
                  <button onClick={() => { setZonePoints((prev) => prev.filter((z) => z.id !== p.id)); if (zonePoints.length <= 3) setZoneClosed(false); }}
                    className="p-0.5 text-gray-300 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))
            )}
            {editorTool === 'zone' && zoneClosed && (
              <div className="mx-2 mt-1 px-2 py-1 bg-green-50 rounded text-xs text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" />구역 완성
              </div>
            )}
            {editorTool === 'wall' && (
              walls.length === 0 ? (
                <p className="text-xs text-gray-400 text-center mt-6">캔버스를 클릭하여 벽 추가</p>
              ) : walls.map((w, i) => (
                <div key={w.id}
                  onClick={() => setSelectedEditorId(w.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors border ${
                    selectedEditorId === w.id ? 'bg-cyan-50 border-cyan-200' : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-cyan-500">{i + 1}</div>
                  <div className="flex-1 text-gray-600 text-xs leading-tight">
                    <div>({(w.x1*0.05).toFixed(1)},{(w.y1*0.05).toFixed(1)})</div>
                    <div>→ ({(w.x2*0.05).toFixed(1)},{(w.y2*0.05).toFixed(1)})</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setWalls((prev) => prev.filter((wl) => wl.id !== w.id)); if (selectedEditorId === w.id) setSelectedEditorId(null); }}
                    className="p-0.5 text-gray-300 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))
            )}
            {editorTool === 'nogozone' && (
              nogoZones.length === 0 ? (
                <p className="text-xs text-gray-400 text-center mt-6">캔버스를 드래그하여 금지구역 추가</p>
              ) : nogoZones.map((n, i) => (
                <div key={n.id}
                  onClick={() => setSelectedEditorId(n.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors border ${
                    selectedEditorId === n.id ? 'bg-orange-50 border-orange-200' : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-gray-700">{i + 1}</div>
                  <div className="flex-1 text-gray-600 text-xs leading-tight">
                    <div>{(n.w*0.05).toFixed(1)}×{(n.h*0.05).toFixed(1)} m</div>
                    <div className="text-gray-400">@{(n.x*0.05).toFixed(1)},{(n.y*0.05).toFixed(1)}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setNogoZones((prev) => prev.filter((z) => z.id !== n.id)); if (selectedEditorId === n.id) setSelectedEditorId(null); }}
                    className="p-0.5 text-gray-300 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))
            )}
          </div>
          {/* Reset button */}
          <div className="border-t border-gray-200 p-3">
            <button
              onClick={() => {
                if (editorTool === 'zone') { setZonePoints([]); setZoneClosed(false); }
                else if (editorTool === 'wall') setWalls([]);
                else setNogoZones([]);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200"
            >
              <RotateCcw className="h-3 w-3" />현재 탭 초기화
            </button>
          </div>
        </>
      ) : (
        /* ── Route planning right panel ── */
        <>
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
        </> /* end route planning right panel */
      )} {/* end mapEditor ternary */}
      </div>
    </div>
  );
}

export default RoutePlanning;
