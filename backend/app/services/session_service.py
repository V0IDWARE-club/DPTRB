import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from ..models import GameSession, Player, PlayerResult, utc_now
from ..schemas import GameSessionResponse
from ..connection_manager import manager
from ..database import SessionLocal

countdown_tasks = {}


def get_or_create_active_session(db: Session) -> GameSession:
    # Look for any session that is not completed, or the latest session
    session = (
        db.query(GameSession)
        .filter(GameSession.status.in_(["registration", "waiting", "playing"]))
        .order_by(GameSession.created_at.desc())
        .first()
    )

    if not session:
        # Check if there is any session at all
        session = db.query(GameSession).order_by(GameSession.created_at.desc()).first()

    if not session:
        session = GameSession(status="registration")
        db.add(session)
        db.commit()
        db.refresh(session)

    return session


def get_session_response(db: Session, session: GameSession) -> GameSessionResponse:
    player_count = db.query(Player).filter(Player.session_id == session.id).count()
    completed_count = db.query(PlayerResult).filter(PlayerResult.session_id == session.id).count()

    countdown_remaining = None
    if session.status in ["waiting", "registration"] and session.countdown_started_at:
        now = utc_now()
        elapsed = (now - session.countdown_started_at.replace(tzinfo=timezone.utc if session.countdown_started_at.tzinfo is None else None)).total_seconds()
        remaining = max(0.0, session.countdown_duration - elapsed)
        countdown_remaining = round(remaining, 1)

    return GameSessionResponse(
        id=session.id,
        status=session.status,
        created_at=session.created_at,
        countdown_started_at=session.countdown_started_at,
        countdown_duration=session.countdown_duration,
        countdown_remaining_seconds=countdown_remaining,
        game_started_at=session.game_started_at,
        game_ended_at=session.game_ended_at,
        player_count=player_count,
        completed_count=completed_count,
    )


async def _run_countdown(session_id: str, duration_seconds: int):
    """Background task to broadcast countdown ticks and trigger game start when finished."""
    try:
        start_time = datetime.now(timezone.utc)
        end_time = start_time + timedelta(seconds=duration_seconds)

        # Broadcast initial start
        await manager.broadcast({
            "type": "COUNTDOWN_STARTED",
            "session_id": session_id,
            "duration": duration_seconds,
            "ends_at": end_time.isoformat(),
        })

        while True:
            await asyncio.sleep(0.5)
            now = datetime.now(timezone.utc)
            remaining = (end_time - now).total_seconds()

            if remaining <= 0:
                break

            await manager.broadcast({
                "type": "COUNTDOWN_TICK",
                "session_id": session_id,
                "seconds_remaining": round(remaining, 1),
            })

        # Transition session to playing
        with SessionLocal() as db:
            session = db.query(GameSession).filter(GameSession.id == session_id).first()
            if session:
                session.status = "playing"
                session.game_started_at = utc_now()
                db.commit()

        # Broadcast GAME_START to all connected players
        await manager.broadcast({
            "type": "GAME_START",
            "session_id": session_id,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "round_duration": 120,
        })
    except asyncio.CancelledError:
        pass
    except Exception as e:
        print(f"Error in countdown task: {e}")
    finally:
        if session_id in countdown_tasks:
            del countdown_tasks[session_id]


def start_session_countdown(db: Session, session_id: str, duration_seconds: int = 15) -> GameSessionResponse:
    session = db.query(GameSession).filter(GameSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Game session not found")

    session.status = "waiting"
    session.countdown_started_at = utc_now()
    session.countdown_duration = duration_seconds
    db.commit()
    db.refresh(session)

    # Cancel any existing task for this session
    if session_id in countdown_tasks:
        countdown_tasks[session_id].cancel()

    # Launch background countdown loop
    task = asyncio.create_task(_run_countdown(session_id, duration_seconds))
    countdown_tasks[session_id] = task

    return get_session_response(db, session)


def reset_or_create_new_session(db: Session) -> GameSessionResponse:
    # Cancel running countdown if any
    for sid, t in list(countdown_tasks.items()):
        t.cancel()
    countdown_tasks.clear()

    # Mark existing active sessions as completed
    active_sessions = db.query(GameSession).filter(GameSession.status != "completed").all()
    for s in active_sessions:
        s.status = "completed"
        s.game_ended_at = utc_now()

    new_session = GameSession(status="registration")
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return get_session_response(db, new_session)
