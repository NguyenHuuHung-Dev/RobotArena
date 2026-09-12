import React, { useRef, useEffect, useState } from 'react';
import { Beam, BridgeLevel, BridgeNode, MaterialType, Vehicle } from '../physics/bridgeTypes';
import { MATERIALS, PIXEL_PER_METER } from '../physics/materials';
import { getStressColor, stepSimulation } from '../physics/bridgeEngine';
import { ShopPart } from '../physics/bridgeShop';

interface BridgeCanvasProps {
  level: BridgeLevel;
  nodes: BridgeNode[];
  beams: Beam[];
  onAddBeam: (nodeA: BridgeNode, nodeB: BridgeNode, material: MaterialType) => void;
  onRemoveBeam: (beamId: string) => void;
  selectedMaterial: MaterialType;
  selectedPart: ShopPart | null;
  activeTool: 'build' | 'delete';
  snapToGrid: boolean;
  isSimulating: boolean;
  onSimulationEnd: (status: 'success' | 'fallen') => void;
}

const GRID_SIZE = 20;

export const BridgeCanvas: React.FC<BridgeCanvasProps> = ({
  level,
  nodes,
  beams,
  onAddBeam,
  onRemoveBeam,
  selectedMaterial,
  selectedPart,
  activeTool,
  snapToGrid,
  isSimulating,
  onSimulationEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const getVehicleMass = (lvlId: number) => {
    switch (lvlId) {
      case 1:
        return 1.6;
      case 2:
        return 2.4;
      case 3:
        return 3.2;
      case 4:
        return 4.5;
      default:
        return 2.0;
    }
  };

  // Simulation physics state
  const simNodesRef = useRef<BridgeNode[]>([]);
  const simBeamsRef = useRef<Beam[]>([]);
  const simVehicleRef = useRef<Vehicle>({
    x: 60,
    y: level.leftAnchor[1] - 8.5,
    vx: 0,
    vy: 0,
    width: 48,
    height: 24,
    angle: 0,
    wheelBase: 32,
    wheelRadius: 8.5,
    mass: getVehicleMass(level.id),
    state: 'driving',
  });

  // Dragging / Building state
  const [dragStartNode, setDragStartNode] = useState<BridgeNode | null>(null);
  const [dragCurrentPos, setDragCurrentPos] = useState<[number, number] | null>(null);
  const [hoveredNode, setHoveredNode] = useState<BridgeNode | null>(null);
  const [hoveredBeam, setHoveredBeam] = useState<Beam | null>(null);

  // Sync physics state
  useEffect(() => {
    if (!isSimulating) {
      simNodesRef.current = nodes.map((n) => ({
        ...n,
        ox: n.x,
        oy: n.y,
        vx: 0,
        vy: 0,
        fx: 0,
        fy: 0,
      }));

      simBeamsRef.current = beams.map((b) => ({
        ...b,
        currentLength: b.restLength,
        force: 0,
        stressRatio: 0,
        isBroken: false,
      }));

      simVehicleRef.current = {
        x: 60,
        y: level.leftAnchor[1] - 8.5,
        vx: 0,
        vy: 0,
        width: 48,
        height: 24,
        angle: 0,
        wheelBase: 32,
        wheelRadius: 8.5,
        mass: getVehicleMass(level.id),
        state: 'driving',
      };
    }
  }, [isSimulating, nodes, beams, level]);

  // Main animation loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (isSimulating) {
        stepSimulation(
          {
            nodes: simNodesRef.current,
            beams: simBeamsRef.current,
            vehicle: simVehicleRef.current,
            isSimulating: true,
            waterY: level.waterY,
            leftAnchorX: level.leftAnchor[0],
            leftAnchorY: level.leftAnchor[1],
            rightAnchorX: level.rightAnchor[0],
            rightAnchorY: level.rightAnchor[1],
          },
          dt
        );

        const vState = simVehicleRef.current.state;
        if (vState === 'success' || vState === 'fallen') {
          onSimulationEnd(vState);
        }
      }

      renderCanvas(ctx, canvas.width, canvas.height, currentTime);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isSimulating, level, onSimulationEnd, dragStartNode, dragCurrentPos, hoveredNode, hoveredBeam, selectedPart, selectedMaterial]);

  const renderCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) => {
    ctx.clearRect(0, 0, width, height);

    // 1. Sky Gradient & Ambient Atmosphere
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#f1f5f9');
    skyGrad.addColorStop(0.65, '#e2e8f0');
    skyGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Grid (Subtle Blueprint Dots)
    if (snapToGrid && !isSimulating) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      for (let x = 0; x < width; x += GRID_SIZE) {
        for (let y = 0; y < height; y += GRID_SIZE) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Terrain & Water
    drawTerrain(ctx, width, height, time);

    // 3. Beams with Dimension Tags
    const activeBeams = isSimulating ? simBeamsRef.current : beams;
    const activeNodes = isSimulating ? simNodesRef.current : nodes;

    for (const beam of activeBeams) {
      if (beam.isBroken) continue;

      const nA = activeNodes.find((n) => n.id === beam.nodeAId);
      const nB = activeNodes.find((n) => n.id === beam.nodeBId);
      if (!nA || !nB) continue;

      const isHovered = hoveredBeam?.id === beam.id && activeTool === 'delete';
      const mat = MATERIALS[beam.materialType];

      ctx.save();
      if (isSimulating) {
        ctx.strokeStyle = getStressColor(beam.stressRatio);
        ctx.lineWidth = mat.strokeWidth + 1.5;
      } else {
        ctx.strokeStyle = isHovered ? '#ef4444' : mat.color;
        ctx.lineWidth = isHovered ? mat.strokeWidth + 2.5 : mat.strokeWidth;
      }

      if (beam.materialType === 'CABLE') {
        ctx.setLineDash([4, 3]);
      }

      ctx.beginPath();
      ctx.moveTo(nA.x, nA.y);
      ctx.lineTo(nB.x, nB.y);
      ctx.stroke();

      // Road markings
      if (beam.materialType === 'ROAD') {
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(nA.x, nA.y);
        ctx.lineTo(nB.x, nB.y);
        ctx.stroke();
      }
      ctx.restore();

      // Dimension Chip (Render length in meters in editing mode)
      if (!isSimulating) {
        const midX = (nA.x + nB.x) / 2;
        const midY = (nA.y + nB.y) / 2;
        const lengthM = (beam.restLength / PIXEL_PER_METER).toFixed(1);

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1;
        const badgeWidth = 28;
        const badgeHeight = 13;
        ctx.beginPath();
        ctx.rect(midX - badgeWidth / 2, midY - badgeHeight / 2 - 8, badgeWidth, badgeHeight);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8.5px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${lengthM}m`, midX, midY - 8);
        ctx.restore();
      }
    }

    // 4. Render Active Drag Line with Part Dimensions
    if (dragStartNode && dragCurrentPos) {
      const mat = MATERIALS[selectedMaterial];
      const targetPos = getSnappedTarget(dragStartNode, dragCurrentPos);

      ctx.save();
      ctx.strokeStyle = mat.color;
      ctx.lineWidth = mat.strokeWidth;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(dragStartNode.x, dragStartNode.y);
      ctx.lineTo(targetPos[0], targetPos[1]);
      ctx.stroke();

      // Length & Cost preview chip
      const distPx = Math.hypot(targetPos[0] - dragStartNode.x, targetPos[1] - dragStartNode.y);
      const distM = (distPx / PIXEL_PER_METER).toFixed(1);
      const estCost = selectedPart
        ? selectedPart.price
        : Math.round((distPx / PIXEL_PER_METER) * mat.costPerMeter);

      const midX = (dragStartNode.x + targetPos[0]) / 2;
      const midY = (dragStartNode.y + targetPos[1]) / 2;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.rect(midX - 35, midY - 22, 70, 18);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9.5px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${distM}m · $${estCost}`, midX, midY - 13);
      ctx.restore();
    }

    // 5. Render Nodes
    for (const node of activeNodes) {
      ctx.save();
      if (node.isFixed) {
        // Bedrock Pillar Anchor
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(node.x - 7, node.y - 7, 14, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const isHovered = hoveredNode?.id === node.id;
        ctx.fillStyle = node.isRoad ? '#f59e0b' : '#ffffff';
        ctx.strokeStyle = isHovered ? '#0284c7' : '#0f172a';
        ctx.lineWidth = isHovered ? 2.5 : 1.5;

        ctx.beginPath();
        ctx.arc(node.x, node.y, isHovered ? 6.5 : 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. Render Vehicle
    if (isSimulating) {
      drawVehicle(ctx, simVehicleRef.current);
    } else {
      drawVehicle(ctx, {
        x: 60,
        y: level.leftAnchor[1] - 12,
        vx: 0,
        vy: 0,
        width: 48,
        height: 24,
        angle: 0,
        wheelBase: 32,
        wheelRadius: 8.5,
        mass: 22,
        state: 'idle',
      });
    }
  };

  const drawTerrain = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) => {
    // Water with animated waves
    const waterGrad = ctx.createLinearGradient(0, level.waterY, 0, height);
    waterGrad.addColorStop(0, '#0284c7');
    waterGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, level.waterY, width, height - level.waterY);

    // Dynamic wave ripples
    const waveOffset = (time / 1000) * 30;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x < width; x += 40) {
      const waveX = (x + waveOffset) % width;
      ctx.moveTo(waveX, level.waterY + 5);
      ctx.quadraticCurveTo(waveX + 15, level.waterY + 2, waveX + 30, level.waterY + 5);
    }
    ctx.stroke();

    // Left Cliff
    const leftAnchorX = level.leftAnchor[0];
    const leftAnchorY = level.leftAnchor[1];

    const cliffGrad = ctx.createLinearGradient(0, 0, leftAnchorX, height);
    cliffGrad.addColorStop(0, '#475569');
    cliffGrad.addColorStop(1, '#334155');
    ctx.fillStyle = cliffGrad;
    ctx.beginPath();
    ctx.moveTo(0, leftAnchorY);
    ctx.lineTo(leftAnchorX, leftAnchorY);
    ctx.lineTo(leftAnchorX - 25, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Top grass on left
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.roundRect(0, leftAnchorY - 5, leftAnchorX, 7, [0, 3, 3, 0]);
    ctx.fill();

    // Right Cliff
    const rightAnchorX = level.rightAnchor[0];
    const rightAnchorY = level.rightAnchor[1];

    ctx.fillStyle = cliffGrad;
    ctx.beginPath();
    ctx.moveTo(rightAnchorX, rightAnchorY);
    ctx.lineTo(width, rightAnchorY);
    ctx.lineTo(width, height);
    ctx.lineTo(rightAnchorX + 25, height);
    ctx.closePath();
    ctx.fill();

    // Top grass on right
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.roundRect(rightAnchorX, rightAnchorY - 5, width - rightAnchorX, 7, [3, 0, 0, 3]);
    ctx.fill();

    // Middle Pier if exists
    if (level.middleAnchors) {
      for (const [mx, my] of level.middleAnchors) {
        if (my > level.leftAnchor[1]) {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.roundRect(mx - 16, my, 32, height - my, 4);
          ctx.fill();
        } else {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.roundRect(mx - 14, my, 28, leftAnchorY - my, 4);
          ctx.fill();
        }
      }
    }
  };

  const drawVehicle = (ctx: CanvasRenderingContext2D, veh: Vehicle) => {
    ctx.save();
    ctx.translate(veh.x, veh.y);
    ctx.rotate(veh.angle);

    // Chassis body
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(-veh.width / 2, -veh.height, veh.width * 0.65, veh.height * 0.85, 3);
    ctx.fill();

    // Driver Cabin
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(veh.width * 0.15, -veh.height * 1.35, veh.width * 0.35, veh.height * 1.25, 4);
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.roundRect(veh.width * 0.28, -veh.height * 1.2, veh.width * 0.2, veh.height * 0.65, 2);
    ctx.fill();

    // Glowing Headlight
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 8;
    ctx.fillRect(veh.width * 0.48, -veh.height * 0.45, 4, 5);
    ctx.shadowBlur = 0;

    // Wheels
    const halfBase = veh.wheelBase / 2;
    drawWheel(ctx, -halfBase, 0, veh.wheelRadius);
    drawWheel(ctx, halfBase, 0, veh.wheelRadius);

    ctx.restore();
  };

  const drawWheel = (ctx: CanvasRenderingContext2D, wx: number, wy: number, r: number) => {
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(wx, wy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(wx, wy, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Coordinate helper
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = (e.clientX - rect.left) * scaleX;
    let y = (e.clientY - rect.top) * scaleY;

    if (snapToGrid) {
      x = Math.round(x / GRID_SIZE) * GRID_SIZE;
      y = Math.round(y / GRID_SIZE) * GRID_SIZE;
    }
    return [x, y];
  };

  const findNearestNode = (x: number, y: number, maxDist = 20): BridgeNode | null => {
    let closest: BridgeNode | null = null;
    let minDist = maxDist;

    for (const node of nodes) {
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist < minDist) {
        minDist = dist;
        closest = node;
      }
    }
    return closest;
  };

  const findNearestBeam = (x: number, y: number, maxDist = 12): Beam | null => {
    let closest: Beam | null = null;
    let minDist = maxDist;

    for (const beam of beams) {
      const nA = nodes.find((n) => n.id === beam.nodeAId);
      const nB = nodes.find((n) => n.id === beam.nodeBId);
      if (!nA || !nB) continue;

      const dx = nB.x - nA.x;
      const dy = nB.y - nA.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;

      let t = ((x - nA.x) * dx + (y - nA.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const projX = nA.x + t * dx;
      const projY = nA.y + t * dy;
      const dist = Math.hypot(x - projX, y - projY);

      if (dist < minDist) {
        minDist = dist;
        closest = beam;
      }
    }
    return closest;
  };

  /**
   * Tính toán điểm đích tự động snap vào kích thước mảnh ghép hoặc góc chuẩn
   */
  const getSnappedTarget = (
    startNode: BridgeNode,
    currentPos: [number, number]
  ): [number, number] => {
    // 1. Nếu gần một nút có sẵn -> Khóa vào nút đó
    const nearNode = findNearestNode(currentPos[0], currentPos[1]);
    if (nearNode && nearNode.id !== startNode.id) {
      return [nearNode.x, nearNode.y];
    }

    // 2. Nếu người chơi đang chọn mảnh ghép có kích thước chuẩn từ Cửa Hàng
    if (selectedPart) {
      const targetLen = selectedPart.lengthPixels;
      const dx = currentPos[0] - startNode.x;
      const dy = currentPos[1] - startNode.y;
      let angle = Math.atan2(dy, dx);

      // Snap vào các góc cơ học đẹp: 0°, 30°, 45°, 60°, 90°, v.v.
      const standardAngles = [
        0,
        Math.PI / 6,
        Math.PI / 4,
        Math.PI / 3,
        Math.PI / 2,
        Math.PI,
        -Math.PI / 6,
        -Math.PI / 4,
        -Math.PI / 3,
        -Math.PI / 2,
      ];

      for (const stdA of standardAngles) {
        if (Math.abs(angle - stdA) < Math.PI / 12) {
          angle = stdA;
          break;
        }
      }

      const snapX = Math.round((startNode.x + targetLen * Math.cos(angle)) / (snapToGrid ? GRID_SIZE : 1)) * (snapToGrid ? GRID_SIZE : 1);
      const snapY = Math.round((startNode.y + targetLen * Math.sin(angle)) / (snapToGrid ? GRID_SIZE : 1)) * (snapToGrid ? GRID_SIZE : 1);
      return [snapX, snapY];
    }

    return currentPos;
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isSimulating) return;
    const [x, y] = getCanvasCoords(e);

    if (activeTool === 'delete') {
      const beam = findNearestBeam(x, y);
      if (beam) {
        onRemoveBeam(beam.id);
      }
      return;
    }

    const existing = findNearestNode(x, y);
    if (existing) {
      setDragStartNode(existing);
      setDragCurrentPos([x, y]);
    } else {
      if (x > level.leftAnchor[0] - 10 && x < level.rightAnchor[0] + 10 && y < level.waterY - 10) {
        const newNode: BridgeNode = {
          id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          x,
          y,
          ox: x,
          oy: y,
          vx: 0,
          vy: 0,
          fx: 0,
          fy: 0,
          mass: 0.2,
          isFixed: false,
          isRoad: selectedMaterial === 'ROAD',
        };
        setDragStartNode(newNode);
        setDragCurrentPos([x, y]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [x, y] = getCanvasCoords(e);

    if (activeTool === 'delete') {
      setHoveredBeam(findNearestBeam(x, y));
      setHoveredNode(null);
    } else {
      setHoveredNode(findNearestNode(x, y));
      setHoveredBeam(null);
    }

    if (dragStartNode) {
      setDragCurrentPos([x, y]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragStartNode || isSimulating) {
      setDragStartNode(null);
      setDragCurrentPos(null);
      return;
    }

    const [rawX, rawY] = getCanvasCoords(e);
    const [targetX, targetY] = getSnappedTarget(dragStartNode, [rawX, rawY]);

    let targetNode = findNearestNode(targetX, targetY);

    if (!targetNode && (Math.abs(targetX - dragStartNode.x) > 10 || Math.abs(targetY - dragStartNode.y) > 10)) {
      if (targetX >= level.leftAnchor[0] - 20 && targetX <= level.rightAnchor[0] + 20 && targetY < level.waterY) {
        targetNode = {
          id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          x: targetX,
          y: targetY,
          ox: targetX,
          oy: targetY,
          vx: 0,
          vy: 0,
          fx: 0,
          fy: 0,
          mass: 0.2,
          isFixed: false,
          isRoad: selectedMaterial === 'ROAD',
        };
      }
    }

    if (targetNode && targetNode.id !== dragStartNode.id) {
      const dist = Math.hypot(targetNode.x - dragStartNode.x, targetNode.y - dragStartNode.y);
      if (dist >= 15 && dist <= 240) {
        onAddBeam(dragStartNode, targetNode, selectedMaterial);
      }
    }

    setDragStartNode(null);
    setDragCurrentPos(null);
  };

  return (
    <div className="relative border-2 border-black bg-white select-none">
      <canvas
        ref={canvasRef}
        width={720}
        height={460}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`w-full h-auto block ${
          isSimulating
            ? 'cursor-default'
            : activeTool === 'delete'
            ? 'cursor-pointer'
            : 'cursor-crosshair'
        }`}
      />

      {/* Overlay Badges */}
      <div className="absolute top-3 left-3 bg-white border border-black px-2.5 py-1 text-xs font-mono font-bold uppercase text-black">
        MÀN {level.id}: {level.title}
      </div>

      <div className="absolute top-3 right-3 bg-white border border-black px-2.5 py-1 text-xs font-mono font-bold uppercase text-neutral-800">
        XE THỬ TẢI: {level.vehicleWeight}
      </div>

      {isSimulating && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black text-white border border-neutral-700 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm">
          <span className="w-2 h-2 bg-emerald-400" />
          ĐANG MÔ PHỎNG VẬT LÝ KẾT CẤU (60 FPS)...
        </div>
      )}
    </div>
  );
};
