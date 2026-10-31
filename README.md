# BUTTON PANIC — VOIDWARE Computer Science Club Event Game

A real-time multiplayer reaction game developed for the **VOIDWARE Computer Science Club**. Built with **React 19, TypeScript, Vite, Python FastAPI, SQLite, and WebSockets**, BUTTON PANIC tests operators' synaptic reflexes under alternating high-speed directives.

---

##  Game Flow & Architecture

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


