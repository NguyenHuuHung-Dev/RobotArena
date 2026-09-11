import React, { useEffect, useRef } from 'react';
import { MazeSimulationTick, Vector2D } from '@robot-arena/shared-types';

interface SimulationCanvasProps {
  tickData: MazeSimulationTick | null;
  selectedRobotId: string | null;
  onSelectRobot: (id: string) => void;
  showExploredHeatmap?: boolean;
  smoothCorners?: boolean;
  fogOfWar?: boolean;
  width?: number;
  height?: number;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  tickData,
  selectedRobotId,
  onSelectRobot,
  showExploredHeatmap = true,
  smoothCorners = true,
  fogOfWar = false,
  width = 720,
  height = 720,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Smooth sub-pixel positions for continuous 60 FPS gliding without discrete snapping
  const visualPositionsRef = useRef<
    Map<string, { x: number; y: number; angle: number }>
  >(new Map());

  // Clear visual positions on reset or maze regeneration to immediately snap to start
  useEffect(() => {
    if (!tickData || tickData.tick === 0) {
      visualPositionsRef.current.clear();
    }
  }, [tickData?.tick, tickData?.maze]);

  useEffect(() => {
    let animId: number;
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const canvas = canvasRef.current;
      if (canvas && tickData && tickData.maze) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawCanvas(ctx);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
    };
  }, [tickData, selectedRobotId, showExploredHeatmap, smoothCorners, fogOfWar, width, height]);

  const drawCanvas = (ctx: CanvasRenderingContext2D) => {
    if (!tickData || !tickData.maze) return;

    // Pure white minimalist background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const { maze, robots } = tickData;
    const rows = maze.rows;
    const cols = maze.cols;

    const padding = 16;
    const availableW = width - padding * 2;
    const availableH = height - padding * 2;
    const cellSize = Math.min(availableW / cols, availableH / rows);

    const startX = padding + (availableW - cols * cellSize) / 2;
    const startY = padding + (availableH - rows * cellSize) / 2;

    const getVectorPos = (v: Vector2D) => ({
      x: startX + v.x * cellSize + cellSize / 2,
      y: startY + v.y * cellSize + cellSize / 2,
    });

    // Sương mù khám phá: Tổng hợp các ô đã được cảm biến quét mở
    const revealedCells = new Set<string>();
    revealedCells.add(`${maze.start.row},${maze.start.col}`);

    for (const robot of robots) {
      for (const cell of robot.exploredCells) {
        revealedCells.add(`${cell.row},${cell.col}`);
      }
      // Vùng quét cảm biến tức thời xung quanh vị trí chuột (bán kính 1 ô)
      const pr = robot.position.row;
      const pc = robot.position.col;
      revealedCells.add(`${pr},${pc}`);
      if (pr > 0) revealedCells.add(`${pr - 1},${pc}`);
      if (pr < rows - 1) revealedCells.add(`${pr + 1},${pc}`);
      if (pc > 0) revealedCells.add(`${pr},${pc - 1}`);
      if (pc < cols - 1) revealedCells.add(`${pr},${pc + 1}`);
    }

    // 1. Cell Floor
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;
        const hasBeenExplored = revealedCells.has(`${r},${c}`);
        if (fogOfWar) {
          if (hasBeenExplored) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y, cellSize, cellSize);
          } else {
            // Sương mù che phủ vùng chưa biết (Dark Blueprint)
            ctx.fillStyle = '#18181b';
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.fillStyle = '#27272a';
            ctx.fillRect(x + cellSize / 2 - 1, y + cellSize / 2 - 1, 2, 2);
          }
        } else {
          // Góc nhìn toàn cảnh (Khán giả): Vùng chuột chưa khám phá hiển thị sơ đồ blueprint
          if (hasBeenExplored) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y, cellSize, cellSize);
          } else {
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(x, y, cellSize, cellSize);
            // Dấu chấm lưới tọa độ sơ phác (chưa được radar quét qua)
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(x + cellSize / 2 - 1, y + cellSize / 2 - 1, 2, 2);
          }
        }
      }
    }

    // 2. Start (S) & Goal (G) Zones
    // Start Zone
    const startPos = maze.start;
    const sx = startX + startPos.col * cellSize;
    const sy = startY + startPos.row * cellSize;
    ctx.fillStyle = '#f0fdf4';
    ctx.fillRect(sx, sy, cellSize, cellSize);
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx + 1, sy + 1, cellSize - 2, cellSize - 2);

    // Goal Zone (Chỉ bừng sáng khi chuột đã thực sự dò quét tới đích)
    const goalPos = maze.goal;
    const gx = startX + goalPos.col * cellSize;
    const gy = startY + goalPos.row * cellSize;
    const isGoalRevealed = revealedCells.has(`${goalPos.row},${goalPos.col}`);

    if (isGoalRevealed) {
      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(gx, gy, cellSize, cellSize);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(gx + 1, gy + 1, cellSize - 2, cellSize - 2);
    } else {
      ctx.strokeStyle = '#d9770660';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(gx + 2, gy + 2, cellSize - 4, cellSize - 4);
      ctx.setLineDash([]);
    }

    // Sharp Typography Labels for S & G
    if (cellSize >= 16) {
      ctx.font = `bold ${Math.max(10, Math.floor(cellSize * 0.38))}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#16a34a';
      ctx.fillText('S', sx + cellSize / 2, sy + cellSize / 2);

      if (isGoalRevealed) {
        ctx.fillStyle = '#d97706';
        ctx.fillText('G', gx + cellSize / 2, gy + cellSize / 2);
      } else {
        ctx.fillStyle = '#d9770680';
        ctx.fillText('?', gx + cellSize / 2, gy + cellSize / 2);
      }
    }

    // 3. Explored Heatmap (Soft monochromatic tint for selected robot)
    if (showExploredHeatmap && selectedRobotId) {
      const selectedRobot = robots.find((r) => r.id === selectedRobotId);
      if (selectedRobot) {
        ctx.fillStyle = `${selectedRobot.color}15`;
        for (const cellPos of selectedRobot.exploredCells) {
          const cx = startX + cellPos.col * cellSize;
          const cy = startY + cellPos.row * cellSize;
          ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
        }
      }
    }

    // 4. Maze Walls: Architectural Real-time Exploration Mapping
    // Pass A: Unscanned Blueprint walls (Faint light blueprint lines in Spectator Mode, Hidden in Fog of War)
    if (!fogOfWar) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.lineCap = 'square';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!revealedCells.has(`${r},${c}`)) {
            const cell = maze.cells[r][c];
            const x = startX + c * cellSize;
            const y = startY + r * cellSize;
            if (cell.walls.north) {
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + cellSize, y);
              ctx.stroke();
            }
            if (cell.walls.east) {
              ctx.beginPath();
              ctx.moveTo(x + cellSize, y);
              ctx.lineTo(x + cellSize, y + cellSize);
              ctx.stroke();
            }
            if (cell.walls.south) {
              ctx.beginPath();
              ctx.moveTo(x, y + cellSize);
              ctx.lineTo(x + cellSize, y + cellSize);
              ctx.stroke();
            }
            if (cell.walls.west) {
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x, y + cellSize);
              ctx.stroke();
            }
          }
        }
      }
    }

    // Pass B: Actively Scanned & Discovered Walls (Crisp Architectural Solid Black #000000)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1.8, Math.floor(cellSize * 0.1));
    ctx.lineCap = 'square';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = maze.cells[r][c];
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;
        const thisRevealed = revealedCells.has(`${r},${c}`);

        if (thisRevealed) {
          if (cell.walls.north) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + cellSize, y);
            ctx.stroke();
          }
          if (cell.walls.east) {
            ctx.beginPath();
            ctx.moveTo(x + cellSize, y);
            ctx.lineTo(x + cellSize, y + cellSize);
            ctx.stroke();
          }
          if (cell.walls.south) {
            ctx.beginPath();
            ctx.moveTo(x, y + cellSize);
            ctx.lineTo(x + cellSize, y + cellSize);
            ctx.stroke();
          }
          if (cell.walls.west) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + cellSize);
            ctx.stroke();
          }
        }
      }
    }

    // Outer Boundary Frame
    ctx.strokeStyle = fogOfWar ? '#3f3f46' : '#000000';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(startX, startY, cols * cellSize, rows * cellSize);

    // 5. Smoothed Trails for Robots (with subtle track offset so overlapping paths are visible)
    robots.forEach((robot, robotIdx) => {
      const trail =
        smoothCorners && robot.smoothedTrail
          ? robot.smoothedTrail
          : robot.pathHistory.map((p) => ({ x: p.col, y: p.row }));
      if (trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = `${robot.color}80`;
        ctx.lineWidth = Math.max(1.2, cellSize * 0.09);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Parallel offset for overlapping corridors
        const trailOffset = (robotIdx - (robots.length - 1) / 2) * Math.min(2.5, cellSize * 0.12);

        ctx.beginPath();
        const p0 = getVectorPos(trail[0]);
        ctx.moveTo(p0.x + trailOffset, p0.y + trailOffset);
        for (let i = 1; i < trail.length; i++) {
          const pt = getVectorPos(trail[i]);
          ctx.lineTo(pt.x + trailOffset, pt.y + trailOffset);
        }
        ctx.stroke();
        ctx.restore();
      }
    });

    // 6. Minimalist Robotic Mice Units with continuous 60 FPS Gliding & Multi-bot cell spacing
    const cellGroups = new Map<string, string[]>();
    for (const robot of robots) {
      const key = `${robot.position.row},${robot.position.col}`;
      if (!cellGroups.has(key)) cellGroups.set(key, []);
      cellGroups.get(key)!.push(robot.id);
    }

    for (const robot of robots) {
      const targetX = robot.position.col;
      const targetY = robot.position.row;

      let targetAngle = 0;
      if (robot.direction === 'NORTH') targetAngle = -Math.PI / 2;
      else if (robot.direction === 'EAST') targetAngle = 0;
      else if (robot.direction === 'SOUTH') targetAngle = Math.PI / 2;
      else if (robot.direction === 'WEST') targetAngle = Math.PI;

      let current = visualPositionsRef.current.get(robot.id);
      if (!current) {
        current = { x: targetX, y: targetY, angle: targetAngle };
        visualPositionsRef.current.set(robot.id, current);
      } else {
        // Continuous exponential gliding towards target cell
        current.x += (targetX - current.x) * 0.22;
        current.y += (targetY - current.y) * 0.22;

        // Smooth angle rotation
        let dAngle = targetAngle - current.angle;
        while (dAngle < -Math.PI) dAngle += Math.PI * 2;
        while (dAngle > Math.PI) dAngle -= Math.PI * 2;
        current.angle += dAngle * 0.25;
      }

      const rawCenter = getVectorPos({ x: current.x, y: current.y });

      // Multi-robot offset inside the same cell so NO ROBOT IS EVER HIDDEN
      const sameCellBots = cellGroups.get(`${robot.position.row},${robot.position.col}`) || [robot.id];
      const botIndexInCell = sameCellBots.indexOf(robot.id);
      const totalInCell = sameCellBots.length;

      let offsetX = 0;
      let offsetY = 0;
      let radius = Math.max(4.5, cellSize * 0.35);

      if (totalInCell > 1) {
        radius = Math.max(3.5, cellSize * 0.23); // Scale down to fit comfortably in the cell
        if (totalInCell === 2) {
          const shift = cellSize * 0.20;
          offsetX = botIndexInCell === 0 ? -shift : shift;
          offsetY = botIndexInCell === 0 ? -shift : shift;
        } else if (totalInCell === 3) {
          const shift = cellSize * 0.22;
          if (botIndexInCell === 0) {
            offsetX = -shift;
            offsetY = -shift * 0.7;
          } else if (botIndexInCell === 1) {
            offsetX = shift;
            offsetY = -shift * 0.7;
          } else {
            offsetX = 0;
            offsetY = shift * 0.8;
          }
        } else {
          const shift = cellSize * 0.20;
          offsetX = botIndexInCell % 2 === 0 ? -shift : shift;
          offsetY = botIndexInCell < 2 ? -shift : shift;
        }
      }

      const center = { x: rawCenter.x + offsetX, y: rawCenter.y + offsetY };
      const isSelected = robot.id === selectedRobotId;

      ctx.save();
      ctx.translate(center.x, center.y);

      // Selection square highlight
      if (isSelected) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(-radius - 3, -radius - 3, (radius + 3) * 2, (radius + 3) * 2);
        ctx.setLineDash([]);
      }

      // Heading rotation
      ctx.rotate(current.angle);

      // Sleek Geometric Robot Body
      ctx.fillStyle = robot.color;
      ctx.beginPath();
      ctx.roundRect(-radius * 0.9, -radius * 0.7, radius * 1.8, radius * 1.4, 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Front sensor direction pointer
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(radius * 0.6, 0);
      ctx.lineTo(-radius * 0.2, -radius * 0.4);
      ctx.lineTo(-radius * 0.2, radius * 0.4);
      ctx.closePath();
      ctx.fill();

      // Active Sensor Scanner Beams (Chùm tia quét cảm biến tường trực tiếp)
      ctx.save();
      ctx.strokeStyle = `${robot.color}88`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Tia quét phía trước (Front Ray)
      ctx.beginPath();
      ctx.moveTo(radius * 0.9, 0);
      ctx.lineTo(radius * 0.9 + cellSize * 0.65, 0);
      ctx.stroke();

      // Tia quét sườn trái (Left Ray)
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.7);
      ctx.lineTo(0, -radius * 0.7 - cellSize * 0.55);
      ctx.stroke();

      // Tia quét sườn phải (Right Ray)
      ctx.beginPath();
      ctx.moveTo(0, radius * 0.7);
      ctx.lineTo(0, radius * 0.7 + cellSize * 0.55);
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      // 7. Floating Name Tag badge above robot every 5 seconds (visible for 2.2s every 5s cycle)
      const now = Date.now();
      const isNameTagVisible = (now % 5000) < 2200;
      if (isNameTagVisible) {
        ctx.save();
        const labelText = robot.name;
        ctx.font = 'bold 10px monospace, sans-serif';
        const textMetrics = ctx.measureText(labelText);
        const badgeWidth = textMetrics.width + 14;
        const badgeHeight = 18;
        const badgeX = center.x - badgeWidth / 2;
        const badgeY = center.y - radius - 20;

        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(badgeX + 1.5, badgeY + 1.5, badgeWidth, badgeHeight);

        // Badge body
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);

        // Arrow notch pointing to mouse
        ctx.beginPath();
        ctx.moveTo(center.x - 3, badgeY + badgeHeight);
        ctx.lineTo(center.x + 3, badgeY + badgeHeight);
        ctx.lineTo(center.x, badgeY + badgeHeight + 3);
        ctx.closePath();
        ctx.fillStyle = '#000000';
        ctx.fill();

        // Color indicator bar
        ctx.fillStyle = robot.color;
        ctx.fillRect(badgeX + 3, badgeY + 4, 3, 10);

        // Text
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, badgeX + 9, badgeY + badgeHeight / 2);
        ctx.restore();
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !tickData) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const { maze, robots } = tickData;
    const padding = 16;
    const availableW = width - padding * 2;
    const availableH = height - padding * 2;
    const cellSize = Math.min(availableW / maze.cols, availableH / maze.rows);
    const startX = padding + (availableW - maze.cols * cellSize) / 2;
    const startY = padding + (availableH - maze.rows * cellSize) / 2;

    for (const robot of robots) {
      const rx = startX + robot.position.col * cellSize + cellSize / 2;
      const ry = startY + robot.position.row * cellSize + cellSize / 2;
      if (Math.hypot(rx - clickX, ry - clickY) <= cellSize * 1.2) {
        onSelectRobot(robot.id);
        return;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      className="border-2 border-black bg-white cursor-pointer max-w-full h-auto aspect-square shadow-sm"
    />
  );
};
