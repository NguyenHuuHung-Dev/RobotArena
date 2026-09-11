import { SimulationTick, RobotState, ProjectileState, ObstacleState } from '@robot-arena/shared-types';

export class LocalSimulationEngine {
  private tickCount: number = 0;
  private width: number = 800;
  private height: number = 600;
  private robots: RobotState[] = [];
  private projectiles: ProjectileState[] = [];
  private obstacles: ObstacleState[] = [];

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.tickCount = 0;
    this.projectiles = [];
    this.obstacles = [
      { id: 'obs-1', x: 400, y: 300, width: 60, height: 60 },
      { id: 'obs-2', x: 200, y: 150, width: 40, height: 40 },
      { id: 'obs-3', x: 600, y: 450, width: 40, height: 40 },
    ];

    this.robots = [
      {
        id: 'bot-1',
        name: 'Alpha Blade',
        x: 150,
        y: 150,
        direction: 45,
        turretDirection: 45,
        hp: 100,
        energy: 100,
        score: 0,
        color: '#38bdf8', // sky blue
        isAlive: true,
      },
      {
        id: 'bot-2',
        name: 'Vanguard Tank',
        x: 650,
        y: 150,
        direction: 135,
        turretDirection: 180,
        hp: 100,
        energy: 100,
        score: 0,
        color: '#f59e0b', // amber
        isAlive: true,
      },
      {
        id: 'bot-3',
        name: 'Cyber Sentinel',
        x: 650,
        y: 450,
        direction: 225,
        turretDirection: 270,
        hp: 100,
        energy: 100,
        score: 0,
        color: '#10b981', // emerald
        isAlive: true,
      },
      {
        id: 'bot-4',
        name: 'Phantom Rogue',
        x: 150,
        y: 450,
        direction: 315,
        turretDirection: 0,
        hp: 100,
        energy: 100,
        score: 0,
        color: '#a855f7', // purple
        isAlive: true,
      },
    ];
  }

  public nextTick(): SimulationTick {
    this.tickCount++;

    // Update projectiles
    const nextProjectiles: ProjectileState[] = [];
    for (const p of this.projectiles) {
      const rad = (p.direction * Math.PI) / 180;
      const nx = p.x + Math.cos(rad) * p.speed;
      const ny = p.y + Math.sin(rad) * p.speed;

      // Check boundary collision
      if (nx < 0 || nx > this.width || ny < 0 || ny > this.height) {
        continue; // Wall hit
      }

      // Check obstacle hit
      let obstacleHit = false;
      for (const obs of this.obstacles) {
        if (
          nx >= obs.x - obs.width / 2 &&
          nx <= obs.x + obs.width / 2 &&
          ny >= obs.y - obs.height / 2 &&
          ny <= obs.y + obs.height / 2
        ) {
          obstacleHit = true;
          break;
        }
      }
      if (obstacleHit) continue;

      // Check robot hit
      let hitRobot = false;
      for (const robot of this.robots) {
        if (!robot.isAlive || robot.id === p.ownerId) continue;
        const dist = Math.hypot(robot.x - nx, robot.y - ny);
        if (dist < 20) {
          hitRobot = true;
          robot.hp = Math.max(0, robot.hp - p.damage);
          if (robot.hp <= 0) {
            robot.isAlive = false;
          }
          // Award score to owner
          const shooter = this.robots.find((r) => r.id === p.ownerId);
          if (shooter) {
            shooter.score += robot.isAlive ? 15 : 100;
          }
          break;
        }
      }

      if (!hitRobot) {
        nextProjectiles.push({ ...p, x: nx, y: ny });
      }
    }
    this.projectiles = nextProjectiles;

    // Update robots
    for (const robot of this.robots) {
      if (!robot.isAlive) continue;

      // AI movement logic: move forward, steer away from walls
      const rad = (robot.direction * Math.PI) / 180;
      let nx = robot.x + Math.cos(rad) * 1.8;
      let ny = robot.y + Math.sin(rad) * 1.8;

      if (nx < 30 || nx > this.width - 30 || ny < 30 || ny > this.height - 30) {
        robot.direction = (robot.direction + 45) % 360;
      } else {
        robot.x = nx;
        robot.y = ny;
      }

      // Rotate turret
      robot.turretDirection = ((robot.turretDirection ?? robot.direction) + 3) % 360;

      // Periodic fire
      if (this.tickCount % 25 === 0 && Math.random() > 0.3) {
        this.projectiles.push({
          id: `proj-${this.tickCount}-${robot.id}`,
          ownerId: robot.id,
          x: robot.x,
          y: robot.y,
          direction: robot.turretDirection ?? robot.direction,
          speed: 7,
          damage: 12,
        });
      }

      // Passive energy regen
      robot.energy = Math.min(100, robot.energy + 0.2);
    }

    return {
      tick: this.tickCount,
      robots: this.robots.map((r) => ({ ...r })),
      projectiles: this.projectiles.map((p) => ({ ...p })),
      obstacles: this.obstacles,
      timestamp: Date.now(),
    };
  }
}
