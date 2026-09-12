import { Beam, BridgeNode, Vehicle } from './bridgeTypes';
import { MATERIALS } from './materials';

export const GRAVITY = 980; // Gia tốc trọng trường (pixels / s^2)
export const SUB_STEPS = 12; // Số bước tích phân con trong 1 frame để chống rung lắc

export interface SimulationState {
  nodes: BridgeNode[];
  beams: Beam[];
  vehicle: Vehicle;
  isSimulating: boolean;
  waterY: number;
  leftAnchorX: number;
  leftAnchorY: number;
  rightAnchorX: number;
  rightAnchorY: number;
}

/**
 * Tính toán 1 frame mô phỏng vật lý (60 FPS, chia thành SUB_STEPS)
 */
export function stepSimulation(state: SimulationState, dt: number): void {
  if (!state.isSimulating) return;

  const subDt = dt / SUB_STEPS;

  for (let step = 0; step < SUB_STEPS; step++) {
    // 1. Reset lực tác dụng lên các nút
    for (const node of state.nodes) {
      if (node.isFixed) {
        node.fx = 0;
        node.fy = 0;
        node.vx = 0;
        node.vy = 0;
        continue;
      }
      node.fx = 0;
      // Trọng lực bản thân thanh và nút
      node.fy = node.mass * GRAVITY;
    }

    // 2. Tính toán lực tương tác của xe tác dụng lên các nút mặt đường
    applyVehicleForces(state);

    // 3. Tính toán lực đàn hồi thanh (Hooke's Law & Damping)
    for (const beam of state.beams) {
      if (beam.isBroken) continue;

      const nodeA = state.nodes.find((n) => n.id === beam.nodeAId);
      const nodeB = state.nodes.find((n) => n.id === beam.nodeBId);
      if (!nodeA || !nodeB) continue;

      const dx = nodeB.x - nodeA.x;
      const dy = nodeB.y - nodeA.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.001) continue;

      beam.currentLength = dist;
      const deltaL = dist - beam.restLength;
      const mat = MATERIALS[beam.materialType];

      // Dây cáp (CABLE) không chịu nén
      if (beam.materialType === 'CABLE' && deltaL < 0) {
        beam.force = 0;
        beam.stressRatio = 0;
        continue;
      }

      // Vận tốc tương đối dọc theo trục thanh
      const nx = dx / dist;
      const ny = dy / dist;
      const relVx = nodeB.vx - nodeA.vx;
      const relVy = nodeB.vy - nodeA.vy;
      const vRel = relVx * nx + relVy * ny;

      // Lực đàn hồi Hooke: F = -k * deltaL - c * vRel
      // Dấu quy ước: deltaL > 0 (kéo dãn) -> F kéo các nút lại với nhau
      const springForce = mat.stiffness * deltaL;
      const maxLimit = springForce > 0 ? mat.maxTension : mat.maxCompression;
      const maxDamp = maxLimit * 0.35;
      const rawDamping = mat.damping * vRel;
      const dampingForce = Math.max(-maxDamp, Math.min(maxDamp, rawDamping));
      const totalForce = springForce + dampingForce;

      beam.force = totalForce;

      // Tính tỷ lệ ứng suất (Stress Ratio)
      const maxAllowed = totalForce > 0 ? mat.maxTension : mat.maxCompression;
      beam.stressRatio = Math.abs(totalForce) / maxAllowed;

      // Kiểm tra gãy thanh khi ứng suất vượt 100%
      if (beam.stressRatio >= 1.05) {
        beam.isBroken = true;
        continue;
      }

      // Truyền lực vào 2 nút đầu mút
      const fx = totalForce * nx;
      const fy = totalForce * ny;

      if (!nodeA.isFixed) {
        nodeA.fx += fx;
        nodeA.fy += fy;
      }
      if (!nodeB.isFixed) {
        nodeB.fx -= fx;
        nodeB.fy -= fy;
      }
    }

    // 4. Cập nhật vị trí các nút (Euler-Cromer / Verlet)
    for (const node of state.nodes) {
      if (node.isFixed) continue;

      const ax = node.fx / node.mass;
      const ay = node.fy / node.mass;

      // Hệ số cản không khí nhẹ
      node.vx = (node.vx + ax * subDt) * 0.999;
      node.vy = (node.vy + ay * subDt) * 0.999;

      node.x += node.vx * subDt;
      node.y += node.vy * subDt;
    }

    // 5. Cập nhật vật lý xe di chuyển
    updateVehiclePhysics(state, subDt);
  }
}

/**
 * Tính toán tiếp xúc bánh xe với mặt đường và phân bổ tải trọng
 */
function applyVehicleForces(state: SimulationState): void {
  const veh = state.vehicle;
  if (veh.state !== 'driving') return;

  // Tọa độ 2 bánh xe trước và sau
  const halfBase = veh.wheelBase / 2;
  const cosA = Math.cos(veh.angle);
  const sinA = Math.sin(veh.angle);

  const rearWheelX = veh.x - halfBase * cosA + veh.wheelRadius * sinA;
  const rearWheelY = veh.y - halfBase * sinA - veh.wheelRadius * cosA;

  const frontWheelX = veh.x + halfBase * cosA + veh.wheelRadius * sinA;
  const frontWheelY = veh.y + halfBase * sinA - veh.wheelRadius * cosA;

  // Lọc các thanh mặt đường (ROAD) còn nguyên vẹn
  const roadBeams = state.beams.filter((b) => !b.isBroken && b.materialType === 'ROAD');

  // Phân bổ trọng lượng nửa xe lên mỗi bánh
  const wheelWeight = (veh.mass * GRAVITY) / 2;

  interactWheelWithRoad(rearWheelX, rearWheelY, roadBeams, state.nodes, wheelWeight);
  interactWheelWithRoad(frontWheelX, frontWheelY, roadBeams, state.nodes, wheelWeight);
}

function interactWheelWithRoad(
  wx: number,
  wy: number,
  roadBeams: Beam[],
  nodes: BridgeNode[],
  load: number
): void {
  for (const beam of roadBeams) {
    const nA = nodes.find((n) => n.id === beam.nodeAId);
    const nB = nodes.find((n) => n.id === beam.nodeBId);
    if (!nA || !nB) continue;

    // Chiếu tọa độ bánh xe lên đoạn thẳng nối 2 nút
    const dx = nB.x - nA.x;
    const dy = nB.y - nA.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) continue;

    let t = ((wx - nA.x) * dx + (wy - nA.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const projX = nA.x + t * dx;
    const projY = nA.y + t * dy;

    const dist = Math.hypot(wx - projX, wy - projY);

    // Nếu bánh xe đè lên thanh đường (bán kính tương tác 24px)
    if (dist < 24) {
      // Phân bổ tải trọng theo đòn bẩy: nA chịu (1-t), nB chịu t
      if (!nA.isFixed) {
        nA.fy += load * (1 - t);
      }
      if (!nB.isFixed) {
        nB.fy += load * t;
      }
    }
  }
}

/**
 * Cập nhật động học xe tải
 */
function updateVehiclePhysics(state: SimulationState, dt: number): void {
  const veh = state.vehicle;
  if (veh.state !== 'driving') return;

  // 1. Trọng lực tác dụng lên xe
  veh.vy += GRAVITY * dt;

  // 2. Động cơ đẩy xe tiến về phía trước (trục X dương)
  const targetSpeed = 120; // ~ 5 m/s
  if (veh.vx < targetSpeed) {
    veh.vx += 160 * dt;
  }

  // 3. Kiểm tra tiếp xúc mặt đường để nâng xe và bám mặt cầu
  let onRoad = false;
  let groundY = Infinity;
  let roadAngle = 0;

  // Hỗ trợ bờ vách đá bên trái (vùng xuất phát)
  if (veh.x <= state.leftAnchorX) {
    groundY = state.leftAnchorY - veh.wheelRadius;
    roadAngle = 0;
    onRoad = true;
  }
  // Hỗ trợ bờ vách đá bên phải (vùng đích đến)
  else if (veh.x >= state.rightAnchorX) {
    groundY = state.rightAnchorY - veh.wheelRadius;
    roadAngle = 0;
    onRoad = true;
  } else {
    const roadBeams = state.beams.filter((b) => !b.isBroken && b.materialType === 'ROAD');
    for (const beam of roadBeams) {
      const nA = state.nodes.find((n) => n.id === beam.nodeAId);
      const nB = state.nodes.find((n) => n.id === beam.nodeBId);
      if (!nA || !nB) continue;

      const minX = Math.min(nA.x, nB.x) - 10;
      const maxX = Math.max(nA.x, nB.x) + 10;

      if (veh.x >= minX && veh.x <= maxX) {
        const t = (veh.x - nA.x) / (nB.x - nA.x || 1);
        if (t >= 0 && t <= 1) {
          const yAtX = nA.y + t * (nB.y - nA.y);
          // Mặt trên của cầu (trừ bán kính bánh)
          const expectedY = yAtX - veh.wheelRadius;
          if (Math.abs(veh.y - expectedY) < 35) {
            groundY = expectedY;
            roadAngle = Math.atan2(nB.y - nA.y, nB.x - nA.x);
            onRoad = true;
            break;
          }
        }
      }
    }
  }

  if (onRoad && groundY !== Infinity) {
    // Xe chạm mặt đường -> giữ xe trên mặt đường và triệt tiêu vận tốc rơi
    veh.y = groundY;
    veh.vy = 0;
    // Đồng bộ góc nghiêng xe theo độ dốc mặt cầu
    veh.angle = veh.angle * 0.85 + roadAngle * 0.15;
  } else {
    // Rơi tự do
    veh.x += veh.vx * dt;
    veh.y += veh.vy * dt;
  }

  // Cập nhật vị trí tiến
  if (onRoad) {
    veh.x += veh.vx * dt * Math.cos(roadAngle);
    veh.y += veh.vx * dt * Math.sin(roadAngle);
  }

  // 4. Kiểm tra xe rơi xuống nước hoặc văng khỏi cầu
  if (veh.y > state.waterY - 10 || Math.abs(veh.angle) > 1.2) {
    veh.state = 'fallen';
  }

  // 5. Kiểm tra xe sang bờ bên kia an toàn
  if (veh.x > state.rightAnchorX + 40 && veh.y < state.waterY - 30) {
    veh.state = 'success';
  }
}

/**
 * Trả về màu sắc trực quan ứng suất của thanh dầm
 */
export function getStressColor(ratio: number): string {
  if (ratio < 0.4) return '#22c55e'; // Xanh lá an toàn
  if (ratio < 0.7) return '#eab308'; // Vàng chú ý
  if (ratio < 0.88) return '#f97316'; // Cam cảnh báo tải cao
  return '#ef4444'; // Đỏ nguy hiểm sắp gãy
}
