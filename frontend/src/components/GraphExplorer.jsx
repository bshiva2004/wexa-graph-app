import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Filter, Search, Info, Layers, Eye } from 'lucide-react';

const NODE_COLORS = {
  User: '#3b82f6',     // Blue
  Skill: '#10b981',    // Emerald
  Job: '#f59e0b',      // Amber
  Company: '#8b5cf6',  // Purple
  Default: '#94a3b8',  // Slate
};

const NODE_RADIUS = {
  User: 16,
  Company: 18,
  Job: 14,
  Skill: 11,
  Default: 12,
};

export default function GraphExplorer({ graphData, isLoading }) {
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Transform / Camera state
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const isDraggingCanvas = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const draggedNode = useRef(null);
  const animationFrameId = useRef(null);

  // Nodes & Links simulation references
  const nodesRef = useRef([]);
  const linksRef = useRef([]);

  // Initialize simulation data when graphData changes
  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) return;

    const width = canvasRef.current ? canvasRef.current.clientWidth : 800;
    const height = canvasRef.current ? canvasRef.current.clientHeight : 600;

    // Position nodes radially or randomly around center
    const nodes = graphData.nodes.map((node, index) => {
      const angle = (index / graphData.nodes.length) * 2 * Math.PI;
      const radius = 180 + Math.random() * 120;
      return {
        ...node,
        x: width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
        y: height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
      };
    });

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const links = (graphData.links || [])
      .map(link => {
        const sourceNode = nodeMap.get(link.source);
        const targetNode = nodeMap.get(link.target);
        if (sourceNode && targetNode) {
          return {
            ...link,
            sourceNode,
            targetNode,
          };
        }
        return null;
      })
      .filter(Boolean);

    nodesRef.current = nodes;
    linksRef.current = links;

    // Center camera
    cameraRef.current = { x: 0, y: 0, zoom: 1 };
  }, [graphData]);

  // Main Physics Simulation & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let isRunning = true;

    const tickPhysics = () => {
      const nodes = nodesRef.current;
      const links = linksRef.current;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Repulsion between all node pairs (Coulomb's Law)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy + 1;
          const dist = Math.sqrt(distSq);

          if (dist < 350) {
            const force = 1800 / (distSq + 100);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (n1 !== draggedNode.current) {
              n1.vx -= fx;
              n1.vy -= fy;
            }
            if (n2 !== draggedNode.current) {
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }
      }

      // 2. Link Attraction (Hooke's Law)
      for (const link of links) {
        const n1 = link.sourceNode;
        const n2 = link.targetNode;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 90;
        const force = (dist - targetDist) * 0.04;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (n1 !== draggedNode.current) {
          n1.vx += fx;
          n1.vy += fy;
        }
        if (n2 !== draggedNode.current) {
          n2.vx -= fx;
          n2.vy -= fy;
        }
      }

      // 3. Center gravity & damping
      for (const node of nodes) {
        if (node === draggedNode.current) continue;

        // Weak gravity to center
        node.vx += (centerX - node.x) * 0.002;
        node.vy += (centerY - node.y) * 0.002;

        // Apply velocities with damping friction
        node.vx *= 0.88;
        node.vy *= 0.88;

        node.x += node.vx;
        node.y += node.vy;
      }
    };

    const render = () => {
      if (!canvas) return;

      // Handle retina displays
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Apply camera transformation
      const { x: camX, y: camY, zoom } = cameraRef.current;
      ctx.translate(width / 2 + camX, height / 2 + camY);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      const nodes = nodesRef.current;
      const links = linksRef.current;

      // Draw Links
      for (const link of links) {
        const { sourceNode, targetNode, type } = link;

        // Check filter
        if (filterType !== 'ALL') {
          if (sourceNode.type !== filterType && targetNode.type !== filterType) {
            continue;
          }
        }

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw small relationship label if zoomed in
        if (zoom > 0.8) {
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(type, midX, midY);
        }
      }

      // Draw Nodes
      for (const node of nodes) {
        // Filter Check
        const matchesFilter = filterType === 'ALL' || node.type === filterType;
        const matchesSearch = !searchQuery || node.label.toLowerCase().includes(searchQuery.toLowerCase());
        const isHighlighted = matchesSearch && searchQuery.length > 0;
        const isSelected = selectedNode?.id === node.id;

        const baseRadius = NODE_RADIUS[node.type] || NODE_RADIUS.Default;
        const radius = isSelected ? baseRadius * 1.3 : baseRadius;
        const color = NODE_COLORS[node.type] || NODE_COLORS.Default;

        // Outer glow for selected or searched
        if (isSelected || isHighlighted) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 7, 0, 2 * Math.PI);
          ctx.fillStyle = isSelected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)';
          ctx.fill();
        }

        // Node Body
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = matchesFilter ? color : 'rgba(71, 85, 105, 0.3)';
        ctx.fill();
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
        ctx.stroke();

        // Node Label
        ctx.font = `${isSelected ? 'bold 12px' : '11px'} Inter, sans-serif`;
        ctx.fillStyle = matchesFilter ? (isSelected ? '#ffffff' : '#cbd5e1') : 'rgba(148, 163, 184, 0.4)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.label, node.x, node.y + radius + 4);
      }

      ctx.restore();
    };

    const loop = () => {
      if (!isRunning) return;
      tickPhysics();
      render();
      animationFrameId.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      isRunning = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [filterType, searchQuery, selectedNode]);

  // Coordinate transformations
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const { x: camX, y: camY, zoom } = cameraRef.current;

    const worldX = (screenX - width / 2 - camX) / zoom + width / 2;
    const worldY = (screenY - height / 2 - camY) / zoom + height / 2;

    return { worldX, worldY, screenX, screenY };
  };

  const handleMouseDown = (e) => {
    const { worldX, worldY, screenX, screenY } = getCanvasCoords(e);

    // Check if clicked on a node
    let hitNode = null;
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const radius = NODE_RADIUS[node.type] || NODE_RADIUS.Default;
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      if (dx * dx + dy * dy <= radius * radius * 1.5) {
        hitNode = node;
        break;
      }
    }

    if (hitNode) {
      draggedNode.current = hitNode;
      setSelectedNode(hitNode);
    } else {
      isDraggingCanvas.current = true;
      dragStart.current = { x: screenX, y: screenY };
    }
  };

  const handleMouseMove = (e) => {
    const { worldX, worldY, screenX, screenY } = getCanvasCoords(e);

    if (draggedNode.current) {
      draggedNode.current.x = worldX;
      draggedNode.current.y = worldY;
      draggedNode.current.vx = 0;
      draggedNode.current.vy = 0;
    } else if (isDraggingCanvas.current) {
      const dx = screenX - dragStart.current.x;
      const dy = screenY - dragStart.current.y;
      cameraRef.current.x += dx;
      cameraRef.current.y += dy;
      dragStart.current = { x: screenX, y: screenY };
    }
  };

  const handleMouseUp = () => {
    draggedNode.current = null;
    isDraggingCanvas.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    cameraRef.current.zoom = Math.max(0.3, Math.min(3.0, cameraRef.current.zoom * zoomFactor));
  };

  const handleResetCamera = () => {
    cameraRef.current = { x: 0, y: 0, zoom: 1 };
    setSelectedNode(null);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col h-[740px] relative backdrop-blur-sm">
      
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 z-10">
        
        {/* Left: Legend and Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">Interactive Graph Topology</span>
          </div>

          <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
            {['ALL', 'User', 'Skill', 'Job', 'Company'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  filterType === type
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type === 'ALL' ? 'All Types' : `${type}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Search & Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950/90 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 w-36 sm:w-48"
            />
          </div>

          <button
            onClick={() => { cameraRef.current.zoom = Math.min(3.0, cameraRef.current.zoom * 1.2); }}
            className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => { cameraRef.current.zoom = Math.max(0.3, cameraRef.current.zoom * 0.8); }}
            className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCamera}
            className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 w-full overflow-hidden rounded-xl bg-slate-950/80 mt-4 cursor-grab active:cursor-grabbing border border-slate-800/60">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* Floating Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-lg flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-300">Candidate (User)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Skill</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-300">Job Posting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-slate-300">Company</span>
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-72 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl z-20 text-xs">
            <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
              <div>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${NODE_COLORS[selectedNode.type]}20`,
                    color: NODE_COLORS[selectedNode.type],
                  }}
                >
                  {selectedNode.type}
                </span>
                <h4 className="text-sm font-bold text-white mt-1">{selectedNode.label}</h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {Object.entries(selectedNode.properties || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 py-0.5 border-b border-slate-800/40">
                  <span className="text-slate-400 font-mono text-[11px]">{k}:</span>
                  <span className="text-slate-200 text-right truncate max-w-[150px] font-medium">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

