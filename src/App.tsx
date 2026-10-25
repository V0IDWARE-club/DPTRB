
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import "./App.css";

const COLORS = [
  { name: "BLUE", hex: "#3987ff" },
  { name: "RED", hex: "#ff4564" },
  { name: "GREEN", hex: "#36d995" },
  { name: "YELLOW", hex: "#ffd447" },
  { name: "PINK", hex: "#ff70c8" },
  { name: "PURPLE", hex: "#ad82ff" },
];

type Color = (typeof COLORS)[number];

type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const randomColor = () =>
  COLORS[Math.floor(Math.random() * COLORS.length)];

const randomInstruction = (): { color: Color; type: "click" | "avoid" } => {
  const color = randomColor();
  const isAvoid = Math.random() < 0.4;

  return {
    color,
    type: isAvoid ? "avoid" : "click",
  };
};

export default function App() {
  const [status, setStatus] = useState<"ready" | "playing" | "over">("ready");

  const [instruction, setInstruction] = useState({
    color: COLORS[0],
    type: "click" as "click" | "avoid",
  });

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [message, setMessage] = useState("READY?");
  const [streak, setStreak] = useState(0);

  const arenaRef = useRef<HTMLDivElement>(null);
  const ballRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const ballsRef = useRef<Ball[]>([]);
  const statusRef = useRef(status);
  const instructionRef = useRef(instruction);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    instructionRef.current = instruction;
  }, [instruction]);

  const changeInstruction = () => {
    const next = randomInstruction();
    instructionRef.current = next;
    setInstruction(next);
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    setTimeLeft(30);
    setStreak(0);
    setMessage("GOOD LUCK!");
    changeInstruction();

    statusRef.current = "playing";
    setStatus("playing");
  };

  // Game countdown
  useEffect(() => {
    if (status !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          statusRef.current = "over";
          setStatus("over");
          return 0;
        }

        return time - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Change the instruction faster as the score increases
  useEffect(() => {
    if (status !== "playing") return;

    const speed = Math.max(450, 1500 - score * 45);

    const timer = setInterval(() => {
      changeInstruction();
    }, speed);

    return () => clearInterval(timer);
  }, [status, score]);

  // Move the balls with JavaScript
  useEffect(() => {
    if (status !== "playing") return;

    const arena = arenaRef.current;
    if (!arena) return;

    const elements = ballRefs.current.slice(0, COLORS.length);

    if (elements.some((el) => !el)) return;

    const size = arena.clientWidth;
    const center = size / 2;
    const radius = Math.min(31, size * 0.075);
    const limit = center - radius - 5;

    // Give each ball a separate starting position and velocity
    const balls: Ball[] = COLORS.map((_, index) => {
      const angle = (index / COLORS.length) * Math.PI * 2;
      const distance = limit * 0.55;
      const direction = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 100;

      return {
        x: center + Math.cos(angle) * distance,
        y: center + Math.sin(angle) * distance,
        vx: Math.cos(direction) * speed,
        vy: Math.sin(direction) * speed,
      };
    });

    ballsRef.current = balls;

    elements.forEach((el) => {
      if (!el) return;

      el.style.width = `${radius * 2}px`;
      el.style.height = `${radius * 2}px`;
      el.style.fontSize = `${Math.max(9, radius * 0.27)}px`;
    });

    let animationId = 0;
    let previousTime = 0;

    const animate = (time: number) => {
      const dt = previousTime
        ? Math.min((time - previousTime) / 1000, 0.025)
        : 0;

      previousTime = time;

      // Update each ball's position
      balls.forEach((ball) => {
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        // Keep the balls inside the circular boundary
        const dx = ball.x - center;
        const dy = ball.y - center;
        const distance = Math.hypot(dx, dy);

        if (distance >= limit && distance > 0) {
          const nx = dx / distance;
          const ny = dy / distance;

          // Reflect the velocity when hitting the wall
          const dot = ball.vx * nx + ball.vy * ny;

          if (dot > 0) {
            ball.vx -= 2 * dot * nx;
            ball.vy -= 2 * dot * ny;
          }

          ball.x = center + nx * limit;
          ball.y = center + ny * limit;
        }
      });

      // Balls bounce off each other
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i];
          const b = balls[j];

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy);
          const minDistance = radius * 2;

          if (distance < minDistance && distance > 0) {
            const nx = dx / distance;
            const ny = dy / distance;
            const overlap = minDistance - distance;

            // Separate the balls so they don't stick together
            a.x -= nx * overlap / 2;
            a.y -= ny * overlap / 2;
            b.x += nx * overlap / 2;
            b.y += ny * overlap / 2;

            // Exchange the velocity along the collision direction
            const relativeVelocity =
              (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;

            if (relativeVelocity < 0) {
              a.vx += relativeVelocity * nx;
              a.vy += relativeVelocity * ny;
              b.vx -= relativeVelocity * nx;
              b.vy -= relativeVelocity * ny;
            }
          }
        }
      }

      // Apply positions directly to the buttons
      balls.forEach((ball, index) => {
        const el = elements[index];

        if (el) {
          el.style.left = `${ball.x - radius}px`;
          el.style.top = `${ball.y - radius}px`;
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [status]);

  const handleClick = (color: Color) => {
    if (statusRef.current !== "playing") return;

    const current = instructionRef.current;

    const correct =
      current.type === "click"
        ? color.name === current.color.name
        : color.name !== current.color.name;

    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      setMessage("NICE!");
    } else {
      setLives((previousLives) => {
        if (previousLives <= 1) {
          statusRef.current = "over";
          setStatus("over");
          return 0;
        }

        return previousLives - 1;
      });

      setStreak(0);
      setMessage("WRONG BUTTON!");
    }

    changeInstruction();
  };

  return (
    <main className="game">
      <header className="topbar">
        <div className="brand">⚡ BUTTON PANIC</div>
        <div className="badge">REACTION GAME</div>
      </header>

      <section className="hero">
        <p className="eyebrow">THINK FAST. CLICK SMART.</p>

        <h1>
          DON'T PRESS
          <br />
          <span>THE WRONG BUTTON.</span>
        </h1>

        <p className="subtitle">
          Your brain says one thing. Your fingers say another.
        </p>
      </section>

      <section className="stats">
        <div className="stat">
          <span>SCORE</span>
          <strong>{score}</strong>
        </div>

        <div className="stat timer">
          <span>TIME</span>
          <strong>{timeLeft}s</strong>
        </div>

        <div className="stat">
          <span>LIVES</span>
          <strong>{lives > 0 ? "❤️".repeat(lives) : "💀"}</strong>
        </div>
      </section>

      
<section className="play-area">
  {status === "ready" ? (
    <div className="start-screen">
      <div className="zap"></div>
      <h2>Can you handle the pressure?</h2>
      <p>Follow the instruction. Don't overthink it.</p>
      <button className="start-button" onClick={startGame}>
        START GAME →
      </button>
    </div>
  ) : status === "over" ? (
    <div className="start-screen">
      <div className="zap"></div>
      <h2>GAME OVER!</h2>
      <p>
        You scored <strong>{score}</strong> points.
      </p>
      <button className="start-button" onClick={startGame}>
        PLAY AGAIN ↻
      </button>
    </div>
  ) : (
    <>
      <div className="instruction-card">
        <span className="instruction-label">YOUR INSTRUCTION</span>
        <h2>
          {instruction.type === "avoid" ? "DON'T CLICK" : "CLICK"}{" "}
          <span style={{ color: instruction.color.hex }}>
            {instruction.color.name}!
          </span>
        </h2>
        <p>{message}</p>
      </div>

      <div className="buttons-grid" ref={arenaRef}>
        {COLORS.map((color, index) => (
          <button
            key={color.name}
            ref={(el) => {
              ballRefs.current[index] = el;
            }}
            className="color-button"
            style={
              {
                "--button-color": color.hex,
              } as CSSProperties
            }
            onClick={() => handleClick(color)}
            aria-label={`Click ${color.name}`}
          >
            {color.name}
          </button>
        ))}
      </div>

      <div className="streak">
        🔥 STREAK: <strong>{streak}</strong>
      </div>
    </>
  )}
</section>


      <footer>MADE FOR THE BOLD · BUILT FOR CHAOS</footer>
    </main>
  );
}
