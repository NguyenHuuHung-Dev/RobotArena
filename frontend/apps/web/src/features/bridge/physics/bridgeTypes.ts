export type MaterialType = 'ROAD' | 'WOOD' | 'STEEL' | 'CABLE';

export interface MaterialDef {
  type: MaterialType;
  name: string;
  description: string;
  costPerMeter: number;
  maxTension: number;      // Lực kéo tối đa cho phép (kN)
  maxCompression: number;  // Lực nén tối đa cho phép (kN)
  stiffness: number;       // Độ cứng k (N/m hoặc đơn vị mô phỏng)
  damping: number;         // Hệ số giảm chấn c
  color: string;
  strokeWidth: number;
  isDriveable: boolean;    // Xe có thể lăn bánh lên được không
}

export interface BridgeNode {
  id: string;
  x: number;
  y: number;
  ox: number;               // Vị trí gốc ban đầu
  oy: number;
  vx: number;
  vy: number;
  fx: number;
  fy: number;
  mass: number;
  isFixed: boolean;         // Neo cố định vào đá/bờ sông
  isRoad: boolean;          // Nút thuộc mặt đường xe chạy
}

export interface Beam {
  id: string;
  nodeAId: string;
  nodeBId: string;
  materialType: MaterialType;
  restLength: number;
  currentLength: number;
  force: number;            // Dương: Kéo (Tension), Âm: Nén (Compression)
  stressRatio: number;      // 0.0 -> 1.0 (vượt quá 1.0 thì gãy)
  isBroken: boolean;
}

export interface Vehicle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  angle: number;
  wheelBase: number;
  wheelRadius: number;
  mass: number;
  state: 'idle' | 'driving' | 'success' | 'fallen';
}

export interface BridgeLevel {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  budget: number;
  leftAnchor: [number, number];
  rightAnchor: [number, number];
  middleAnchors?: [number, number][];
  waterY: number;
  targetStars: {
    threeStar: number; // Ngân sách tiết kiệm tối đa để đạt 3 sao
    twoStar: number;   // Ngân sách đạt 2 sao
  };
  vehicleWeight: string;
}
