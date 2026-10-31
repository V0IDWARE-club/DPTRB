from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import GameSessionResponse, StartCountdownRequest
from ..services.session_service import (
    get_or_create_active_session,
    get_session_response,
    start_session_countdown,
    reset_or_create_new_session,
)
from ..models import GameSession
from ..connection_manager import manager

router = APIRouter(prefix="/api/session", tags=["Session"])


@router.get("/active", response_model=GameSessionResponse)
def get_active_session(db: Session = Depends(get_db)):
    session = get_or_create_active_session(db)
    return get_session_response(db, session)


@router.get("/status", response_model=GameSessionResponse)
def get_session_status(db: Session = Depends(get_db)):
    session = get_or_create_active_session(db)
    return get_session_response(db, session)


@router.post("/start-countdown", response_model=GameSessionResponse)
async def start_countdown(req: StartCountdownRequest, db: Session = Depends(get_db)):
    session = get_or_create_active_session(db)
    res = start_session_countdown(db, session.id, req.duration_seconds)
    return res


@router.post("/reset", response_model=GameSessionResponse)
async def reset_session(db: Session = Depends(get_db)):
    res = reset_or_create_new_session(db)
    await manager.broadcast({
        "type": "SESSION_RESET",
        "session_id": res.id,
    })
    return res
