from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import (
    ResultSubmitRequest,
    PlayerResultDetail,
    LeaderboardResponse,
    Top3Response,
)
from ..services.scoring_service import (
    submit_player_result,
    get_player_result_detail,
    get_leaderboard_data,
    get_top3_players,
)
from ..services.session_service import get_or_create_active_session
from ..connection_manager import manager

router = APIRouter(tags=["Results and Leaderboard"])


@router.post("/api/results", response_model=PlayerResultDetail)
async def submit_result(req: ResultSubmitRequest, db: Session = Depends(get_db)):
    if not req.session_id:
        active_sess = get_or_create_active_session(db)
        req.session_id = active_sess.id

    result_detail = submit_player_result(db, req)

    # Get updated leaderboard data to broadcast
    leaderboard = get_leaderboard_data(db, req.session_id)

    # Broadcast updates over WebSockets
    await manager.broadcast({
        "type": "RESULT_SUBMITTED",
        "session_id": req.session_id,
        "player_id": result_detail.player_id,
        "player_name": result_detail.player_name,
        "score": result_detail.final_score,
        "rank": result_detail.rank,
    })

    await manager.broadcast({
        "type": "LEADERBOARD_UPDATE",
        "session_id": req.session_id,
        "leaderboard": [entry.model_dump(mode="json") for entry in leaderboard.all_entries],
        "top3": [entry.model_dump(mode="json") for entry in leaderboard.top3],
    })

    return result_detail


@router.get("/api/results/{player_id}", response_model=PlayerResultDetail)
def get_player_result(
    player_id: str,
    session_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if not session_id:
        active_sess = get_or_create_active_session(db)
        session_id = active_sess.id

    return get_player_result_detail(db, player_id, session_id)


@router.get("/api/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(
    session_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if not session_id:
        active_sess = get_or_create_active_session(db)
        session_id = active_sess.id

    return get_leaderboard_data(db, session_id)


@router.get("/api/leaderboard/top3", response_model=Top3Response)
def get_top3(
    session_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if not session_id:
        active_sess = get_or_create_active_session(db)
        session_id = active_sess.id

    return get_top3_players(db, session_id)
