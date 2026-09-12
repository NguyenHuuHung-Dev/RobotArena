import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Beam, BridgeLevel, BridgeNode, MaterialType } from './physics/bridgeTypes';
import { BRIDGE_LEVELS } from './levels/bridgeLevels';
import { MATERIALS, PIXEL_PER_METER } from './physics/materials';
import { SHOP_PARTS, ShopPart } from './physics/bridgeShop';
import { BridgeCanvas } from './components/BridgeCanvas';
import { BridgeToolbar } from './components/BridgeToolbar';
import { BridgeResultModal } from './components/BridgeResultModal';
import { BridgeGuideModal } from './components/BridgeGuideModal';

export const BridgeView: React.FC = () => {
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const level: BridgeLevel = BRIDGE_LEVELS[currentLevelIdx];

  const [nodes, setNodes] = useState<BridgeNode[]>([]);
  const [beams, setBeams] = useState<Beam[]>([]);

  const [selectedPart, setSelectedPart] = useState<ShopPart | null>(SHOP_PARTS[1]); // Mặc định Mặt đường chuẩn 4m
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>('ROAD');
  const [activeTool, setActiveTool] = useState<'build' | 'delete'>('build');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [guideModalOpen, setGuideModalOpen] = useState<boolean>(false);
  const [resultStatus, setResultStatus] = useState<'success' | 'fallen'>('success');

  // Khởi tạo các mố neo ban đầu của màn chơi
  const initLevelAnchors = useCallback((lvl: BridgeLevel) => {
    const initialNodes: BridgeNode[] = [
      {
        id: 'anchor-left',
        x: lvl.leftAnchor[0],
        y: lvl.leftAnchor[1],
        ox: lvl.leftAnchor[0],
        oy: lvl.leftAnchor[1],
        vx: 0,
        vy: 0,
        fx: 0,
        fy: 0,
        mass: 100,
        isFixed: true,
        isRoad: true,
      },
      {
        id: 'anchor-right',
        x: lvl.rightAnchor[0],
        y: lvl.rightAnchor[1],
        ox: lvl.rightAnchor[0],
        oy: lvl.rightAnchor[1],
        vx: 0,
        vy: 0,
        fx: 0,
        fy: 0,
        mass: 100,
        isFixed: true,
        isRoad: true,
      },
    ];

    if (lvl.middleAnchors) {
      lvl.middleAnchors.forEach(([mx, my], idx) => {
        initialNodes.push({
          id: `anchor-mid-${idx}`,
          x: mx,
          y: my,
          ox: mx,
          oy: my,
          vx: 0,
          vy: 0,
          fx: 0,
          fy: 0,
          mass: 100,
          isFixed: true,
          isRoad: false,
        });
      });
    }

    setNodes(initialNodes);
    setBeams([]);
  }, []);

  useEffect(() => {
    initLevelAnchors(level);
    setIsSimulating(false);
    setModalOpen(false);
  }, [currentLevelIdx, level, initLevelAnchors]);

  // Tính tổng chi phí xây cầu
  const totalCost = useMemo(() => {
    let cost = 0;
    for (const b of beams) {
      const nA = nodes.find((n) => n.id === b.nodeAId);
      const nB = nodes.find((n) => n.id === b.nodeBId);
      if (nA && nB) {
        const distPx = Math.hypot(nB.x - nA.x, nB.y - nA.y);
        const distM = distPx / PIXEL_PER_METER;
        const mat = MATERIALS[b.materialType];
        cost += distM * mat.costPerMeter;
      }
    }
    return Math.round(cost);
  }, [nodes, beams]);

  // Thêm thanh nối giữa 2 nút
  const handleAddBeam = (nodeA: BridgeNode, nodeB: BridgeNode, material: MaterialType) => {
    setNodes((prevNodes) => {
      const updated = [...prevNodes];
      if (!updated.some((n) => n.id === nodeA.id)) updated.push(nodeA);
      if (!updated.some((n) => n.id === nodeB.id)) updated.push(nodeB);
      return updated;
    });

    setBeams((prevBeams) => {
      const exists = prevBeams.some(
        (b) =>
          (b.nodeAId === nodeA.id && b.nodeBId === nodeB.id) ||
          (b.nodeAId === nodeB.id && b.nodeBId === nodeA.id)
      );
      if (exists) return prevBeams;

      const dist = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y);
      const newBeam: Beam = {
        id: `beam-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        nodeAId: nodeA.id,
        nodeBId: nodeB.id,
        materialType: material,
        restLength: dist,
        currentLength: dist,
        force: 0,
        stressRatio: 0,
        isBroken: false,
      };

      return [...prevBeams, newBeam];
    });
  };

  const handleRemoveBeam = (beamId: string) => {
    setBeams((prev) => prev.filter((b) => b.id !== beamId));

    setTimeout(() => {
      setNodes((prevNodes) => {
        return prevNodes.filter((n) => {
          if (n.isFixed) return true;
          return beams.some(
            (b) => b.id !== beamId && (b.nodeAId === n.id || b.nodeBId === n.id)
          );
        });
      });
    }, 0);
  };

  const handleClearAll = () => {
    initLevelAnchors(level);
  };

  // Tiện ích ⚡ Tự Động Trải Mặt Cầu Chuẩn (Auto-Deck)
  const handleAutoDeck = () => {
    const startX = level.leftAnchor[0];
    const startY = level.leftAnchor[1];
    const endX = level.rightAnchor[0];
    const endY = level.rightAnchor[1];

    const spanDistance = Math.hypot(endX - startX, endY - startY);
    // Mỗi nhịp chuẩn ~80px (khoảng 3.2m)
    const numSegments = Math.max(2, Math.round(spanDistance / 80));

    const newNodes: BridgeNode[] = [...nodes];
    const newBeams: Beam[] = [...beams.filter((b) => b.materialType !== 'ROAD')];

    // Xóa các thanh road cũ để trải đồng bộ
    let prevNodeId = 'anchor-left';

    for (let i = 1; i < numSegments; i++) {
      const t = i / numSegments;
      const x = Math.round(startX + t * (endX - startX));
      const y = Math.round(startY + t * (endY - startY));

      const nodeId = `road-auto-node-${i}`;
      let roadNode = newNodes.find((n) => n.id === nodeId);
      if (!roadNode) {
        roadNode = {
          id: nodeId,
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
          isRoad: true,
        };
        newNodes.push(roadNode);
      } else {
        roadNode.x = x;
        roadNode.y = y;
        roadNode.isRoad = true;
      }

      // Nối từ node trước tới node này
      const prevNode = newNodes.find((n) => n.id === prevNodeId)!;
      const dist = Math.hypot(roadNode.x - prevNode.x, roadNode.y - prevNode.y);

      newBeams.push({
        id: `beam-auto-road-${i}`,
        nodeAId: prevNodeId,
        nodeBId: nodeId,
        materialType: 'ROAD',
        restLength: dist,
        currentLength: dist,
        force: 0,
        stressRatio: 0,
        isBroken: false,
      });

      prevNodeId = nodeId;
    }

    // Nối đoạn cuối vào anchor-right
    const lastNode = newNodes.find((n) => n.id === prevNodeId)!;
    const rightAnchorNode = newNodes.find((n) => n.id === 'anchor-right')!;
    const lastDist = Math.hypot(rightAnchorNode.x - lastNode.x, rightAnchorNode.y - lastNode.y);

    newBeams.push({
      id: `beam-auto-road-final`,
      nodeAId: prevNodeId,
      nodeBId: 'anchor-right',
      materialType: 'ROAD',
      restLength: lastDist,
      currentLength: lastDist,
      force: 0,
      stressRatio: 0,
      isBroken: false,
    });

    setNodes(newNodes);
    setBeams(newBeams);
  };

  // Nạp cấu trúc cầu mẫu chuẩn kỹ sư tham khảo cho từng màn
  const handleLoadSampleBridge = () => {
    if (level.id === 1) {
      // Màn 1: Cầu dàn Warren bằng Gỗ
      const nLeft: BridgeNode = { id: 'anchor-left', x: 180, y: 260, ox: 180, oy: 260, vx: 0, vy: 0, fx: 0, fy: 0, mass: 100, isFixed: true, isRoad: true };
      const nRight: BridgeNode = { id: 'anchor-right', x: 420, y: 260, ox: 420, oy: 260, vx: 0, vy: 0, fx: 0, fy: 0, mass: 100, isFixed: true, isRoad: true };
      const r1: BridgeNode = { id: 'r1', x: 260, y: 260, ox: 260, oy: 260, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: true };
      const r2: BridgeNode = { id: 'r2', x: 340, y: 260, ox: 340, oy: 260, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: true };
      const t1: BridgeNode = { id: 't1', x: 260, y: 320, ox: 260, oy: 320, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: false };
      const t2: BridgeNode = { id: 't2', x: 340, y: 320, ox: 340, oy: 320, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: false };

      const sampleNodes = [nLeft, nRight, r1, r2, t1, t2];
      const createB = (id: string, a: string, b: string, mat: MaterialType): Beam => {
        const na = sampleNodes.find((n) => n.id === a)!;
        const nb = sampleNodes.find((n) => n.id === b)!;
        const dist = Math.hypot(nb.x - na.x, nb.y - na.y);
        return { id, nodeAId: a, nodeBId: b, materialType: mat, restLength: dist, currentLength: dist, force: 0, stressRatio: 0, isBroken: false };
      };

      const sampleBeams = [
        createB('sb-r1', 'anchor-left', 'r1', 'ROAD'),
        createB('sb-r2', 'r1', 'r2', 'ROAD'),
        createB('sb-r3', 'r2', 'anchor-right', 'ROAD'),
        createB('sb-w1', 'anchor-left', 't1', 'WOOD'),
        createB('sb-w2', 'r1', 't1', 'WOOD'),
        createB('sb-w3', 't1', 't2', 'WOOD'),
        createB('sb-w4', 'r1', 't2', 'WOOD'),
        createB('sb-w5', 'r2', 't2', 'WOOD'),
        createB('sb-w6', 't2', 'anchor-right', 'WOOD'),
      ];

      setNodes(sampleNodes);
      setBeams(sampleBeams);
    } else if (level.id === 2) {
      // Màn 2: Dàn thép tựa trụ đá giữa
      const nLeft: BridgeNode = { id: 'anchor-left', x: 140, y: 260, ox: 140, oy: 260, vx: 0, vy: 0, fx: 0, fy: 0, mass: 100, isFixed: true, isRoad: true };
      const nRight: BridgeNode = { id: 'anchor-right', x: 540, y: 260, ox: 540, oy: 260, vx: 0, vy: 0, fx: 0, fy: 0, mass: 100, isFixed: true, isRoad: true };
      const nMid: BridgeNode = { id: 'anchor-mid-0', x: 340, y: 360, ox: 340, oy: 360, vx: 0, vy: 0, fx: 0, fy: 0, mass: 100, isFixed: true, isRoad: false };
      const r1: BridgeNode = { id: 'r1', x: 240, y: 260, ox: 240, oy: 260, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: true };
      const r2: BridgeNode = { id: 'r2', x: 340, y: 260, ox: 340, oy: 260, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: true };
      const r3: BridgeNode = { id: 'r3', x: 440, y: 260, ox: 440, oy: 260, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: true };
      const t1: BridgeNode = { id: 't1', x: 240, y: 320, ox: 240, oy: 320, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: false };
      const t2: BridgeNode = { id: 't2', x: 440, y: 320, ox: 440, oy: 320, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: false };

      const sampleNodes = [nLeft, nRight, nMid, r1, r2, r3, t1, t2];
      const createB = (id: string, a: string, b: string, mat: MaterialType): Beam => {
        const na = sampleNodes.find((n) => n.id === a)!;
        const nb = sampleNodes.find((n) => n.id === b)!;
        const dist = Math.hypot(nb.x - na.x, nb.y - na.y);
        return { id, nodeAId: a, nodeBId: b, materialType: mat, restLength: dist, currentLength: dist, force: 0, stressRatio: 0, isBroken: false };
      };

      const sampleBeams = [
        createB('sb-r1', 'anchor-left', 'r1', 'ROAD'),
        createB('sb-r2', 'r1', 'r2', 'ROAD'),
        createB('sb-r3', 'r2', 'r3', 'ROAD'),
        createB('sb-r4', 'r3', 'anchor-right', 'ROAD'),
        createB('sb-s1', 'anchor-left', 't1', 'STEEL'),
        createB('sb-s2', 'r1', 't1', 'STEEL'),
        createB('sb-s3', 't1', 'anchor-mid-0', 'STEEL'),
        createB('sb-s4', 'r2', 'anchor-mid-0', 'STEEL'),
        createB('sb-s5', 'r1', 'anchor-mid-0', 'STEEL'),
        createB('sb-s6', 'anchor-mid-0', 't2', 'STEEL'),
        createB('sb-s7', 'anchor-mid-0', 'r3', 'STEEL'),
        createB('sb-s8', 'r3', 't2', 'STEEL'),
        createB('sb-s9', 't2', 'anchor-right', 'STEEL'),
      ];

      setNodes(sampleNodes);
      setBeams(sampleBeams);
    } else if (level.id === 3) {
      // Màn 3: Cầu dây cáp treo mỏm đá cao
      const nLeft: BridgeNode = { id: 'anchor-left', x: 130, y: 250, ox: 130, oy: 250, vx: 0, vy: 0, fx: 0, fy: 0, mass: 100, isFixed: true, isRoad: true };
      const nRight: BridgeNode = { id: 'anchor-right', x: 550, y: 250, ox: 550, oy: 250, vx: 0, vy: 0, fx: 0, fy: 0, mass: 100, isFixed: true, isRoad: true };
      const nTowerL: BridgeNode = { id: 'anchor-mid-0', x: 130, y: 130, ox: 130, oy: 130, vx: 0, vy: 0, fx: 0, fy: 0, mass: 100, isFixed: true, isRoad: false };
      const nTowerR: BridgeNode = { id: 'anchor-mid-1', x: 550, y: 130, ox: 550, oy: 130, vx: 0, vy: 0, fx: 0, fy: 0, mass: 100, isFixed: true, isRoad: false };
      const r1: BridgeNode = { id: 'r1', x: 235, y: 250, ox: 235, oy: 250, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: true };
      const r2: BridgeNode = { id: 'r2', x: 340, y: 250, ox: 340, oy: 250, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: true };
      const r3: BridgeNode = { id: 'r3', x: 445, y: 250, ox: 445, oy: 250, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: true };
      const t1: BridgeNode = { id: 't1', x: 235, y: 310, ox: 235, oy: 310, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: false };
      const t2: BridgeNode = { id: 't2', x: 340, y: 310, ox: 340, oy: 310, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: false };
      const t3: BridgeNode = { id: 't3', x: 445, y: 310, ox: 445, oy: 310, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: false };

      const sampleNodes = [nLeft, nRight, nTowerL, nTowerR, r1, r2, r3, t1, t2, t3];
      const createB = (id: string, a: string, b: string, mat: MaterialType): Beam => {
        const na = sampleNodes.find((n) => n.id === a)!;
        const nb = sampleNodes.find((n) => n.id === b)!;
        const dist = Math.hypot(nb.x - na.x, nb.y - na.y);
        return { id, nodeAId: a, nodeBId: b, materialType: mat, restLength: dist, currentLength: dist, force: 0, stressRatio: 0, isBroken: false };
      };

      const sampleBeams = [
        createB('sb-r1', 'anchor-left', 'r1', 'ROAD'),
        createB('sb-r2', 'r1', 'r2', 'ROAD'),
        createB('sb-r3', 'r2', 'r3', 'ROAD'),
        createB('sb-r4', 'r3', 'anchor-right', 'ROAD'),
        createB('sb-w1', 'anchor-left', 't1', 'WOOD'),
        createB('sb-w2', 'r1', 't1', 'WOOD'),
        createB('sb-w3', 't1', 't2', 'WOOD'),
        createB('sb-w4', 'r1', 't2', 'WOOD'),
        createB('sb-w5', 'r2', 't2', 'WOOD'),
        createB('sb-w6', 't2', 't3', 'WOOD'),
        createB('sb-w7', 'r2', 't3', 'WOOD'),
        createB('sb-w8', 'r3', 't3', 'WOOD'),
        createB('sb-w9', 't3', 'anchor-right', 'WOOD'),
        createB('sb-c1', 'anchor-mid-0', 'r1', 'CABLE'),
        createB('sb-c2', 'anchor-mid-0', 'r2', 'CABLE'),
        createB('sb-c3', 'anchor-mid-1', 'r2', 'CABLE'),
        createB('sb-c4', 'anchor-mid-1', 'r3', 'CABLE'),
      ];

      setNodes(sampleNodes);
      setBeams(sampleBeams);
    } else {
      // Màn 4: Thử thách xe container tải nặng (Thép + Cáp)
      const nLeft: BridgeNode = { id: 'anchor-left', x: 110, y: 260, ox: 110, oy: 260, vx: 0, vy: 0, fx: 0, fy: 0, mass: 100, isFixed: true, isRoad: true };
      const nRight: BridgeNode = { id: 'anchor-right', x: 590, y: 260, ox: 590, oy: 260, vx: 0, vy: 0, fx: 0, fy: 0, mass: 100, isFixed: true, isRoad: true };
      const nTowerL: BridgeNode = { id: 'anchor-mid-0', x: 110, y: 110, ox: 110, oy: 110, vx: 0, vy: 0, fx: 0, fy: 0, mass: 100, isFixed: true, isRoad: false };
      const nTowerR: BridgeNode = { id: 'anchor-mid-1', x: 590, y: 110, ox: 590, oy: 110, vx: 0, vy: 0, fx: 0, fy: 0, mass: 100, isFixed: true, isRoad: false };
      const r1: BridgeNode = { id: 'r1', x: 230, y: 260, ox: 230, oy: 260, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: true };
      const r2: BridgeNode = { id: 'r2', x: 350, y: 260, ox: 350, oy: 260, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: true };
      const r3: BridgeNode = { id: 'r3', x: 470, y: 260, ox: 470, oy: 260, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: true };
      const t1: BridgeNode = { id: 't1', x: 230, y: 320, ox: 230, oy: 320, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: false };
      const t2: BridgeNode = { id: 't2', x: 350, y: 320, ox: 350, oy: 320, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: false };
      const t3: BridgeNode = { id: 't3', x: 470, y: 320, ox: 470, oy: 320, vx: 0, vy: 0, fx: 0, fy: 0, mass: 0.2, isFixed: false, isRoad: false };

      const sampleNodes = [nLeft, nRight, nTowerL, nTowerR, r1, r2, r3, t1, t2, t3];
      const createB = (id: string, a: string, b: string, mat: MaterialType): Beam => {
        const na = sampleNodes.find((n) => n.id === a)!;
        const nb = sampleNodes.find((n) => n.id === b)!;
        const dist = Math.hypot(nb.x - na.x, nb.y - na.y);
        return { id, nodeAId: a, nodeBId: b, materialType: mat, restLength: dist, currentLength: dist, force: 0, stressRatio: 0, isBroken: false };
      };

      const sampleBeams = [
        createB('sb-r1', 'anchor-left', 'r1', 'ROAD'),
        createB('sb-r2', 'r1', 'r2', 'ROAD'),
        createB('sb-r3', 'r2', 'r3', 'ROAD'),
        createB('sb-r4', 'r3', 'anchor-right', 'ROAD'),
        createB('sb-s1', 'anchor-left', 't1', 'STEEL'),
        createB('sb-s2', 'r1', 't1', 'STEEL'),
        createB('sb-s3', 't1', 't2', 'STEEL'),
        createB('sb-s4', 'r1', 't2', 'STEEL'),
        createB('sb-s5', 'r2', 't2', 'STEEL'),
        createB('sb-s6', 't2', 't3', 'STEEL'),
        createB('sb-s7', 'r2', 't3', 'STEEL'),
        createB('sb-s8', 'r3', 't3', 'STEEL'),
        createB('sb-s9', 't3', 'anchor-right', 'STEEL'),
        createB('sb-c1', 'anchor-mid-0', 'r1', 'CABLE'),
        createB('sb-c2', 'anchor-mid-0', 'r2', 'CABLE'),
        createB('sb-c3', 'anchor-mid-1', 'r2', 'CABLE'),
        createB('sb-c4', 'anchor-mid-1', 'r3', 'CABLE'),
      ];

      setNodes(sampleNodes);
      setBeams(sampleBeams);
    }
  };

  const handleSimulationEnd = (status: 'success' | 'fallen') => {
    setResultStatus(status);
    setModalOpen(true);
    setIsSimulating(false);
  };

  return (
    <div className="space-y-8 font-sans text-neutral-900">
      {/* Header Banner */}
      <div className="border border-black bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-mono font-bold uppercase tracking-wider">
              BRIDGE BUILDER
            </span>
            <button
              type="button"
              onClick={() => setGuideModalOpen(true)}
              className="px-2.5 py-0.5 border border-black hover:bg-neutral-100 text-neutral-900 text-[11px] font-mono font-bold uppercase transition"
            >
              HƯỚNG DẪN KẾT CẤU
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black">
            Kỹ Sư Xây Cầu
          </h1>
          <p className="text-sm text-neutral-600 font-sans max-w-2xl leading-relaxed">
            Chọn mảnh ghép tiêu chuẩn từ cửa hàng (2m, 3m, 4m, 6m). Thiết kế kết cấu chịu lực, tối ưu chi phí và đưa phương tiện sang bờ an toàn.
          </p>
        </div>

        {/* Level Select Buttons */}
        <div className="flex flex-wrap items-center gap-1 p-1 border border-black bg-neutral-100">
          {BRIDGE_LEVELS.map((lvl, idx) => (
            <button
              key={lvl.id}
              onClick={() => {
                if (!isSimulating) setCurrentLevelIdx(idx);
              }}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition ${
                currentLevelIdx === idx
                  ? 'bg-black text-white'
                  : 'bg-transparent text-neutral-700 hover:text-black hover:bg-neutral-200'
              } ${isSimulating ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              MÀN {lvl.id}
            </button>
          ))}
        </div>
      </div>

      {/* Main Bridge Builder Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Canvas View */}
        <div className="lg:col-span-8 space-y-4">
          <BridgeCanvas
            level={level}
            nodes={nodes}
            beams={beams}
            onAddBeam={handleAddBeam}
            onRemoveBeam={handleRemoveBeam}
            selectedMaterial={selectedMaterial}
            selectedPart={selectedPart}
            activeTool={activeTool}
            snapToGrid={snapToGrid}
            isSimulating={isSimulating}
            onSimulationEnd={handleSimulationEnd}
          />

          {/* Level Briefing */}
          <div className="border border-black bg-white p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between font-mono font-bold text-black uppercase">
              <span>Nhiệm vụ: {level.subtitle}</span>
              <span className="border border-neutral-300 px-2 py-0.5 bg-neutral-50 text-[11px]">
                Tải trọng xe: <strong>{level.vehicleWeight}</strong>
              </span>
            </div>
            <p className="text-neutral-600 leading-relaxed font-sans">{level.description}</p>
          </div>
        </div>

        {/* Right Column: Toolbar & Shop */}
        <div className="lg:col-span-4 space-y-6">
          <BridgeToolbar
            selectedMaterial={selectedMaterial}
            onSelectMaterial={setSelectedMaterial}
            selectedPart={selectedPart}
            onSelectPart={(part) => {
              setSelectedPart(part);
              setSelectedMaterial(part.materialType);
            }}
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            isSimulating={isSimulating}
            onStartSimulation={() => setIsSimulating(true)}
            onResetSimulation={() => setIsSimulating(false)}
            onClearAll={handleClearAll}
            onAutoDeck={handleAutoDeck}
            onOpenGuide={() => setGuideModalOpen(true)}
            onLoadSample={handleLoadSampleBridge}
            snapToGrid={snapToGrid}
            onToggleSnap={() => setSnapToGrid(!snapToGrid)}
            totalCost={totalCost}
            budget={level.budget}
            threeStarBudget={level.targetStars.threeStar}
            twoStarBudget={level.targetStars.twoStar}
          />
        </div>
      </div>

      {/* Result Modal */}
      <BridgeResultModal
        isOpen={modalOpen}
        status={resultStatus}
        totalCost={totalCost}
        budget={level.budget}
        threeStarBudget={level.targetStars.threeStar}
        twoStarBudget={level.targetStars.twoStar}
        onRetry={() => {
          setModalOpen(false);
          setIsSimulating(false);
        }}
        onNextLevel={() => {
          setModalOpen(false);
          if (currentLevelIdx < BRIDGE_LEVELS.length - 1) {
            setCurrentLevelIdx(currentLevelIdx + 1);
          }
        }}
        hasNextLevel={currentLevelIdx < BRIDGE_LEVELS.length - 1}
      />

      {/* Guide & Engineering How-To Modal */}
      <BridgeGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        onLoadSample={handleLoadSampleBridge}
      />
    </div>
  );
};
