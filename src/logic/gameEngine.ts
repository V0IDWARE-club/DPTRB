import type { ColorDef, Directive } from "../types";

export const COLORS: ColorDef[] = [
  { name: "BLUE", hex: "#3987ff", code: "#01", number: "01" },
  { name: "RED", hex: "#ff4564", code: "#02", number: "02" },
  { name: "GREEN", hex: "#36d995", code: "#03", number: "03" },
  { name: "YELLOW", hex: "#ffd447", code: "#04", number: "04" },
  { name: "PINK", hex: "#ff70c8", code: "#05", number: "05" },
  { name: "PURPLE", hex: "#ad82ff", code: "#06", number: "06" },
];

export interface BallPhysics {
  color: ColorDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface GameEngineState {
  status: "idle" | "playing" | "game_over";
  score: number;
  lives: number;
  maxLives: number;
  timeLeft: number;
  streak: number;
  bestStreak: number;
  correctHits: number;
  totalHits: number;
  reactionTimes: number[];
  currentDirective: Directive;
  lastHitDelta: number;
  lastHitStatus: "correct" | "wrong" | null;
  speedMultiplier: number;
}

export function createRandomDirective(): Directive {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const isAvoid = Math.random() < 0.35; // 35% chance of DON'T CLICK directive

  return {
    color,
    type: isAvoid ? "avoid" : "click",
    directiveStartTime: performance.now(),
  };
}

export function initializeBalls(arenaSize: number): BallPhysics[] {
  const center = arenaSize / 2;
  const radius = Math.min(32, Math.max(22, arenaSize * 0.08));
  const limit = center - radius - 8;

  return COLORS.map((color, index) => {
    const angle = (index / COLORS.length) * Math.PI * 2;
    const distance = limit * 0.55;
    const direction = Math.random() * Math.PI * 2;
    const speed = 120 + Math.random() * 80;

    return {
      color,
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
      vx: Math.cos(direction) * speed,
      vy: Math.sin(direction) * speed,
      radius,
    };
  });
}

export function updateBallPhysics(
  balls: BallPhysics[],
  arenaSize: number,
  dt: number,
  velocityMultiplier: number = 1.0
): void {
  const center = arenaSize / 2;
  const radius = balls[0]?.radius || 28;
  const limit = center - radius - 4;

  // Move each ball
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];
    b.x += b.vx * dt * velocityMultiplier;
    b.y += b.vy * dt * velocityMultiplier;

    // Arena boundary collision
    const dx = b.x - center;
    const dy = b.y - center;
    const dist = Math.hypot(dx, dy);

    if (dist >= limit && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;

      const dot = b.vx * nx + b.vy * ny;
      if (dot > 0) {
        b.vx -= 2 * dot * nx;
        b.vy -= 2 * dot * ny;
      }

      b.x = center + nx * limit;
      b.y = center + ny * limit;
    }
  }

  // Inter-ball collisions
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i];
      const b = balls[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDistance = a.radius + b.radius;

      if (dist < minDistance && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDistance - dist;

        // Push apart
        a.x -= (nx * overlap) / 2;
        a.y -= (ny * overlap) / 2;
        b.x += (nx * overlap) / 2;
        b.y += (ny * overlap) / 2;

        // Velocity exchange
        const relVel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (relVel < 0) {
          a.vx += relVel * nx;
          a.vy += relVel * ny;
          b.vx -= relVel * nx;
          b.vy -= relVel * ny;
        }
      }
    }
  }
}

export class GameEngine {
  private state: GameEngineState;
  private onStateChange: (state: GameEngineState) => void;
  private onGameOver: (finalState: GameEngineState) => void;
  private timerInterval: any = null;
  private directiveInterval: any = null;
  private isSubmitted: boolean = false;

  constructor(
    onStateChange: (state: GameEngineState) => void,
    onGameOver: (finalState: GameEngineState) => void
  ) {
    this.onStateChange = onStateChange;
    this.onGameOver = onGameOver;
    this.state = this.getInitialState();
  }

  private getInitialState(): GameEngineState {
    return {
      status: "idle",
      score: 0,
      lives: 6,
      maxLives: 6,
      timeLeft: 120.0,
      streak: 0,
      bestStreak: 0,
      correctHits: 0,
      totalHits: 0,
      reactionTimes: [],
      currentDirective: createRandomDirective(),
      lastHitDelta: 0,
      lastHitStatus: null,
      speedMultiplier: 1.0,
    };
  }

  public getState(): GameEngineState {
    return this.state;
  }

  public start(): void {
    this.isSubmitted = false;
    this.state = {
      ...this.getInitialState(),
      status: "playing",
      currentDirective: createRandomDirective(),
    };
    this.onStateChange({ ...this.state });

    // 120s (2 min) game timer countdown (0.1s resolution)
    const startTime = performance.now();
    const durationMs = 120000;

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.state.status !== "playing") return;

      const elapsed = performance.now() - startTime;
      const remainingMs = Math.max(0, durationMs - elapsed);
      const remainingSec = parseFloat((remainingMs / 1000).toFixed(1));

      this.state.timeLeft = remainingSec;

      if (remainingSec <= 0) {
        this.endGame();
      } else {
        this.onStateChange({ ...this.state });
      }
    }, 100);

    this.scheduleNextDirective();
  }

  private scheduleNextDirective(): void {
    if (this.directiveInterval) clearInterval(this.directiveInterval);
    if (this.state.status !== "playing") return;

    // Increase directive tempo based on score
    // 1500ms initially down to 600ms
    const intervalMs = Math.max(600, 1600 - this.state.score * 0.8);
    const speedMult = parseFloat((1.0 + (this.state.score / 2500) * 0.8).toFixed(1));
    this.state.speedMultiplier = Math.min(2.2, speedMult);

    this.directiveInterval = setInterval(() => {
      if (this.state.status !== "playing") return;
      this.state.currentDirective = createRandomDirective();
      this.onStateChange({ ...this.state });
      this.scheduleNextDirective();
    }, intervalMs);
  }

  public handleColorClick(color: ColorDef): boolean {
    // Prevent clicks after game ends
    if (this.state.status !== "playing") return false;

    const now = performance.now();
    const reactionTime = Math.max(40, Math.round(now - this.state.currentDirective.directiveStartTime));
    this.state.reactionTimes.push(reactionTime);
    this.state.totalHits += 1;

    const directive = this.state.currentDirective;
    const isCorrect =
      directive.type === "click"
        ? color.name === directive.color.name
        : color.name !== directive.color.name;

    if (isCorrect) {
      // Correct input
      const streakBonus = this.state.streak * 4;
      const hitPoints = 20 + streakBonus;

      this.state.score += hitPoints;
      this.state.streak += 1;
      this.state.bestStreak = Math.max(this.state.bestStreak, this.state.streak);
      this.state.correctHits += 1;
      this.state.lastHitDelta = hitPoints;
      this.state.lastHitStatus = "correct";

      // Rotate directive immediately on hit
      this.state.currentDirective = createRandomDirective();
      this.scheduleNextDirective();
      this.onStateChange({ ...this.state });
      return true;
    } else {
      // Incorrect input
      this.state.lives = Math.max(0, this.state.lives - 1);
      this.state.streak = 0;
      this.state.lastHitDelta = 0;
      this.state.lastHitStatus = "wrong";

      if (this.state.lives <= 0) {
        this.endGame();
      } else {
        this.state.currentDirective = createRandomDirective();
        this.scheduleNextDirective();
        this.onStateChange({ ...this.state });
      }
      return false;
    }
  }

  public endGame(): void {
    if (this.state.status === "game_over") return;

    this.state.status = "game_over";
    this.state.timeLeft = 0;

    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.directiveInterval) clearInterval(this.directiveInterval);

    this.onStateChange({ ...this.state });

    if (!this.isSubmitted) {
      this.isSubmitted = true;
      this.onGameOver({ ...this.state });
    }
  }

  public destroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.directiveInterval) clearInterval(this.directiveInterval);
  }

  public getAccuracy(): number {
    if (this.state.totalHits === 0) return 100.0;
    return parseFloat(((this.state.correctHits / this.state.totalHits) * 100).toFixed(1));
  }

  public getAverageReactionTime(): number {
    if (this.state.reactionTimes.length === 0) return 350.0;
    const sum = this.state.reactionTimes.reduce((acc, v) => acc + v, 0);
    return Math.round(sum / this.state.reactionTimes.length);
  }
}
