from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Player, GameSession
from ..schemas import PlayerRegisterRequest, PlayerResponse
from ..services.session_service import get_or_create_active_session
from ..connection_manager import manager

router = APIRouter(prefix="/api/players", tags=["Players"])


@router.post("/register", response_model=PlayerResponse, status_code=status.HTTP_201_CREATED)
async def register_player(req: PlayerRegisterRequest, db: Session = Depends(get_db)):
    clean_name = req.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Player name cannot be empty")

    if len(clean_name) > 30:
        raise HTTPException(status_code=400, detail="Player name cannot exceed 30 characters")

    # Get active session if session_id is not provided
    if req.session_id:
        session = db.query(GameSession).filter(GameSession.id == req.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Specified game session not found")
    else:
        session = get_or_create_active_session(db)

    # Check for duplicate player name within the same session (case-insensitive)
    existing_player = (
        db.query(Player)
        .filter(
            Player.session_id == session.id,
            func.lower(Player.name) == clean_name.lower(),
        )
        .first()
    )

    if existing_player:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Codename '{clean_name}' is already taken in this session. Choose a different name.",
        )

    # Create new player
    player = Player(
        session_id=session.id,
        name=clean_name,
    )
    db.add(player)
    db.commit()
    db.refresh(player)

    # Count players
    player_count = db.query(Player).filter(Player.session_id == session.id).count()

    # Broadcast player joined event to all connected clients
    await manager.broadcast({
        "type": "PLAYER_JOINED",
        "player": {
            "id": player.id,
            "name": player.name,
            "joined_at": player.joined_at.isoformat(),
        },
        "player_count": player_count,
        "session_id": session.id,
    })

    return player


@router.get("", response_model=List[PlayerResponse])
def get_registered_players(
    session_id: Optional[str] = None, db: Session = Depends(get_db)
):
    if not session_id:
        session = get_or_create_active_session(db)
        session_id = session.id

    players = (
        db.query(Player)
        .filter(Player.session_id == session_id)
        .order_by(Player.joined_at.asc())
        .all()
    )
    return players


@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: str, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player
