# ⚡ BUTTON PANIC — VOIDWARE Computer Science Club Event Game

A real-time multiplayer reaction game developed for the **VOIDWARE Computer Science Club**. Built with **React 19, TypeScript, Vite, Python FastAPI, SQLite, and WebSockets**, BUTTON PANIC tests operators' synaptic reflexes under alternating high-speed directives.

---

## 🎮 Game Flow & Architecture

The application strictly follows the event sequence matching the reference designs:

1. **Screen 1 — Welcome / Registration (`components/welcome/Welcome.tsx`)**:
   - Participant registers their unique Operator Codename.
   - Enforces non-empty, trimmed, case-insensitive uniqueness checks in the active session.
   - Communicates with backend via `apiService.registerPlayer()`.
   - Stores operator ID locally to prevent duplicate registrations.

2. **Screen 2 — Waiting Room & Synchronized Countdown (`components/waiting-room/WaitingRoom.tsx`)**:
   - Real-time connected operator count and live player roster.
   - Backend-authoritative countdown broadcast over WebSockets.
   - All connected participants transition to gameplay simultaneously when countdown reaches zero.

3. **Screen 3 — Gameplay (`components/game/Game.tsx`)**:
   - 30-second rapid-fire reaction round with 3 Neural Cores (lives).
   - Dynamic directives: `CLICK <COLOR>!` or `DON'T CLICK <COLOR>!`.
   - Real physics ball-simulation inside a circular radar arena with collision and boundary reflection (`logic/gameEngine.ts`).
   - Speed acceleration based on score (`SPD: 1.0x` to `2.2x`).
   - Tracks score, streak combos, synaptic precision (accuracy %), and microsecond reaction times.
   - Single-submission guarantee recorded to the backend database.

4. **Screen 4 — Individual Player Results (`components/user-score/UserScore.tsx`)**:
   - Shows real stored telemetry from the database.
   - Calculated percentile rank across the club event session.
   - 2x2 stats matrix: Best Streak, Reaction Time (ms), Accuracy (%), Lives Retained.
   - Performance tier evaluation (`TIER S: APEX REFLEX`, `CLASS_A++`).

5. **Screen 5 — Global Leaderboard / Hall of Fame (`components/ranking/Ranking.tsx`)**:
   - Prominent 3-tier podium with gold, silver, and bronze pedestals.
   - Highlights the current participant (`★ YOU`).
   - Ranked concurrent nodes list for ranks #04+.
   - Real-time updates via WebSockets when new participants submit scores.

6. **Screen 6 — Thank-You Screen (`components/thank-you/ThankYou.tsx`)**:
   - Club quote: *"Every great mind starts with curiosity."*
   - Official VOIDWARE telemetry nodes: Instagram, GitHub, TikTok.
   - Safe navigation back to leaderboard or new operator session.

---

## 📁 Final Project Folder Structure

```
DPTRB/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py                # Environment & CORS configuration
│   │   ├── database.py              # SQLite engine & session management
│   │   ├── models.py                # GameSession, Player, PlayerResult models
│   │   ├── schemas.py               # Pydantic validation & response schemas
│   │   ├── connection_manager.py    # WebSocket client manager & broadcaster
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── session_service.py   # Session lifecycle & backend countdown
│   │   │   └── scoring_service.py   # Leaderboard, percentile, and rank calculation
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── session_routes.py    # Active session, status, start-countdown, reset
│   │       ├── player_routes.py     # Player registration & roster
│   │       ├── result_routes.py     # Score submission & leaderboard
│   │       └── ws_routes.py         # Real-time WebSocket endpoint (/ws)
│   ├── requirements.txt             # Python backend dependencies
│   ├── test_backend.py              # Automated unit and integration test suite
│   └── venv/                        # Python virtual environment
├── src/
│   ├── assets/                      # Official club logo & icons
│   │   ├── logo.png
│   │   └── v0idware-icon.png
│   ├── components/
│   │   ├── common/                  # Shared components matching design
│   │   │   ├── Header.tsx           # Logo, Operator info, FPS status, SFX toggle
│   │   │   ├── header.css
│   │   │   ├── Footer.tsx           # Latency, velocity, abort ESC handler
│   │   │   ├── footer.css
│   │   │   └── VoidEmblem.tsx       # Orbiting planet emblem SVG
│   │   ├── welcome/                 # Screen 1
│   │   │   ├── Welcome.tsx
│   │   │   └── welcome.css
│   │   ├── waiting-room/            # Screen 2
│   │   │   ├── WaitingRoom.tsx
│   │   │   └── waiting-room.css
│   │   ├── game/                    # Screen 3
│   │   │   ├── Game.tsx
│   │   │   └── game.css
│   │   ├── user-score/              # Screen 4
│   │   │   ├── UserScore.tsx
│   │   │   └── user-score.css
│   │   ├── ranking/                 # Screen 5
│   │   │   ├── Ranking.tsx
│   │   │   └── ranking.css
│   │   └── thank-you/               # Screen 6
│   │       ├── ThankYou.tsx
│   │       └── thank-you.css
│   ├── logic/
│   │   └── gameEngine.ts            # Independent game physics & state machine
│   ├── services/
│   │   ├── apiService.ts            # Reusable REST client (sessions, players, results)
│   │   └── socketService.ts         # WebSocket client with auto-reconnect
│   ├── utils/
│   │   └── soundEffects.ts          # Web Audio API retro cyber SFX & mute manager
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces & types
│   ├── App.tsx                      # Screen router and session controller
│   ├── App.css
│   ├── index.css                    # Futuristic typography & reset
│   └── main.tsx
├── design/                          # Reference UI screenshots
├── run_backend.py                   # Root runner for FastAPI backend
├── vite.config.ts                   # Vite proxy configuration for /api and /ws
├── package.json
└── README.md
```

---

## 🚀 Running Locally

### 1. Prerequisites
- **Node.js**: v18 or higher (with npm)
- **Python**: 3.10+ (tested on Python 3.14)

---

### 2. Backend Setup & Startup

1. Open a terminal in the project root:
   ```bash
   cd /home/zabour_rayhana/DPTRB
   ```

2. If the virtual environment is not already created:
   ```bash
   python3 -m venv backend/venv
   ./backend/venv/bin/pip install -r backend/requirements.txt
   ```

3. Run the backend server:
   ```bash
   ./backend/venv/bin/python3 run_backend.py
   ```
   *The backend starts at `http://localhost:8000` (and `http://0.0.0.0:8000`).*
   - Interactive Swagger API docs are accessible at `http://localhost:8000/docs`.

4. Run the automated backend test suite:
   ```bash
   ./backend/venv/bin/python3 -m unittest backend/test_backend.py
   ```

---

### 3. Frontend Setup & Startup

1. In a second terminal in the project root:
   ```bash
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client runs at `http://localhost:5173`.*

3. To build for production:
   ```bash
   npm run build
   ```

---

## 🌐 Connecting Multiple Devices for the Club Event

1. Ensure the host computer and participants' smartphones/laptops are on the **same Wi-Fi or local network**.
2. Find the host computer's local IP address (e.g. `192.168.1.50`).
3. Participants open their browsers to:
   ```
   http://192.168.1.50:5173
   ```
4. All participants will register into the shared event session, watch the synchronized countdown, play simultaneously, and see their live ranks update on the Hall of Fame podium!

---

## 📡 API & WebSocket Specification

### REST Endpoints
- `GET /api/session/active` — Retrieve or initialize the active game session.
- `GET /api/session/status` — Get current status, participant count, and countdown seconds.
- `POST /api/session/start-countdown` — Start backend countdown (duration in seconds).
- `POST /api/session/reset` — Reset event session for a new round.
- `POST /api/players/register` — Register a player codename (case-insensitive duplicate check).
- `GET /api/players` — Retrieve all registered operators in the active session.
- `POST /api/results` — Submit player's final telemetry (idempotent, prevents duplicates).
- `GET /api/results/{player_id}` — Get individual statistics with calculated rank and percentile.
- `GET /api/leaderboard` — Get full session leaderboard sorted by score desc.
- `GET /api/leaderboard/top3` — Get prominent podium entries (first, second, third).

### WebSocket Events (`/ws`)
- `INITIAL_STATE` — Sent on connection with active session details.
- `PLAYER_JOINED` — Broadcast when any participant registers.
- `COUNTDOWN_STARTED` — Synchronizes countdown start across all clients.
- `COUNTDOWN_TICK` — Transmits remaining seconds every 500ms.
- `GAME_START` — Synchronized signal triggering all players into gameplay.
- `RESULT_SUBMITTED` — Emitted when a participant completes their run.
- `LEADERBOARD_UPDATE` — Broadcasts real-time ranking updates.
- `SESSION_RESET` — Notifies clients when the organizer restarts the session.
