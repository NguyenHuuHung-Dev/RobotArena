import React, { useEffect, useRef, useState } from 'react';

export const HeroLiveRadar: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 11x11 mini maze grid
    const size = 11;
    const cellSize = canvas.width / size;

    // Generate a simple symmetric maze with corridors and center goal
    const walls: { [key: string]: boolean } = {};
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Outer boundary walls
        if (r === 0) walls[`${r},${c},N`] = true;
        if (r === size - 1) walls[`${r},${c},S`] = true;
        if (c === 0) walls[`${r},${c},W`] = true;
        if (c === size - 1) walls[`${r},${c},E`] = true;

        // Interior maze walls pattern
        if ((r === 2 || r === 8) && c >= 2 && c <= 8 && c !== 5) {
          walls[`${r},${c},N`] = true;
        }
        if ((c === 2 || c === 8) && r >= 2 && r <= 8 && r !== 5) {
          walls[`${r},${c},W`] = true;
        }
        if ((r === 4 || r === 6) && c >= 3 && c <= 7 && c !== 5) {
          walls[`${r},${c},S`] = true;
        }
      }
    }

    // 3 Simulated Racer Mice
    const bots = [
      {
        name: 'Micromouse Flood Fill',
        color: '#10b981', // Emerald
        path: [
          { r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 },
          { r: 2, c: 2 }, { r: 3, c: 2 }, { r: 3, c: 3 }, { r: 3, c: 4 },
          { r: 4, c: 4 }, { r: 5, c: 4 }, { r: 5, c: 5 } // Goal
        ],
        currIdx: 0,
        x: 0,
        y: 0,
      },
      {
        name: 'A* Phạt Cua',
        color: '#ef4444', // Red
        path: [
          { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 2 },
          { r: 1, c: 3 }, { r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 5 },
          { r: 3, c: 5 }, { r: 4, c: 5 }, { r: 5, c: 5 } // Goal
        ],
        currIdx: 0,
        x: 0,
        y: 0,
      },
      {
        name: 'DFS Trémaux',
        color: '#000000', // Black
        path: [
          { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }, { r: 2, c: 1 },
          { r: 3, c: 1 }, { r: 4, c: 1 }, { r: 5, c: 1 }, { r: 5, c: 2 },
          { r: 5, c: 3 }, { r: 5, c: 4 }, { r: 5, c: 5 } // Goal
        ],
        currIdx: 0,
        x: 0,
        y: 0,
      },
    ];

    bots.forEach((b) => {
      b.x = b.path[0].c;
      b.y = b.path[0].r;
    });

    let animationFrameId: number;
    let tickCount = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid background dots
      ctx.fillStyle = '#e2e8f0';
      for (let r = 0; r <= size; r++) {
        for (let c = 0; c <= size; c++) {
          ctx.beginPath();
          ctx.arc(c * cellSize, r * cellSize, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Goal Center (5, 5) Clean monochrome target
      const goalX = 5 * cellSize;
      const goalY = 5 * cellSize;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(goalX, goalY, cellSize, cellSize);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(goalX + 2, goalY + 2, cellSize - 4, cellSize - 4);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ĐÍCH', goalX + cellSize / 2, goalY + cellSize / 2);

      // Draw Walls
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'square';

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const x1 = c * cellSize;
          const y1 = r * cellSize;
          const x2 = (c + 1) * cellSize;
          const y2 = (r + 1) * cellSize;

          if (walls[`${r},${c},N`]) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y1);
            ctx.stroke();
          }
          if (walls[`${r},${c},S`]) {
            ctx.beginPath();
            ctx.moveTo(x1, y2);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
          if (walls[`${r},${c},W`]) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1, y2);
            ctx.stroke();
          }
          if (walls[`${r},${c},E`]) {
            ctx.beginPath();
            ctx.moveTo(x2, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      // Progress Bot Movement Every ~22 ticks
      tickCount++;
      if (tickCount % 22 === 0) {
        bots.forEach((b) => {
          if (b.currIdx < b.path.length - 1) {
            b.currIdx++;
          } else {
            // Loop restart
            b.currIdx = 0;
            b.x = b.path[0].c;
            b.y = b.path[0].r;
          }
        });
        setActiveStep((prev) => (prev + 1) % 11);
      }

      // Draw Trails and Bots
      bots.forEach((bot, bIdx) => {
        const targetPt = bot.path[bot.currIdx];
        bot.x += (targetPt.c - bot.x) * 0.15;
        bot.y += (targetPt.r - bot.y) * 0.15;

        // Trail
        ctx.beginPath();
        ctx.strokeStyle = `${bot.color}40`;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        for (let i = 0; i <= bot.currIdx; i++) {
          const pt = bot.path[i];
          const px = pt.c * cellSize + cellSize / 2;
          const py = pt.r * cellSize + cellSize / 2;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Bot Body
        const bx = bot.x * cellSize + cellSize / 2 + (bIdx - 1) * 2.5;
        const by = bot.y * cellSize + cellSize / 2 + (bIdx - 1) * 2.5;

        // Scanner Radar Ring
        const ringSize = (cellSize * 0.5) + (Math.sin((Date.now() + bIdx * 300) / 200) * 2);
        ctx.strokeStyle = `${bot.color}30`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bx, by, ringSize, 0, Math.PI * 2);
        ctx.stroke();

        // Robot Dot
        ctx.fillStyle = bot.color;
        ctx.beginPath();
        ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="border-2 border-black bg-white shadow-xl overflow-hidden font-mono text-xs w-full max-w-[380px] mx-auto">
      {/* Mini Radar Top Bar */}
      <div className="bg-neutral-100 border-b border-black p-2.5 flex items-center justify-between text-[10px] font-bold uppercase text-neutral-700">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-black" />
          <span className="text-black font-bold tracking-wider">RADAR MÔ PHỎNG LIVE</span>
        </div>
        <div className="text-neutral-500 font-mono">60 FPS · 3 BOTS</div>
      </div>

      {/* Canvas Area */}
      <div className="relative p-3 bg-white flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="border border-black w-full max-w-[320px] aspect-square"
        />

        {/* Live Overlay Badge */}
        <div className="absolute bottom-5 left-5 bg-white border border-black px-2 py-1 text-[9px] font-bold text-black shadow-xs">
          TỰ ĐỘNG TỐI ƯU GÓC RẼ
        </div>
      </div>

      {/* Mini Telemetry Footer */}
      <div className="bg-neutral-50 border-t border-black p-2.5 space-y-1.5 text-[10px]">
        <div className="flex items-center justify-between">
          <span className="text-neutral-500 uppercase">THUẬT TOÁN:</span>
          <span className="font-bold text-black font-sans">FLOOD FILL vs A* vs DFS</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-500 uppercase">TIẾN ĐỘ TÌM ĐÍCH:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-neutral-200 overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-300"
                style={{ width: `${Math.min(100, (activeStep + 1) * 9.5)}%` }}
              />
            </div>
            <span className="font-bold text-black font-mono">{Math.min(100, Math.round((activeStep + 1) * 9.5))}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
