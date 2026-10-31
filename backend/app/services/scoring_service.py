from datetime import datetime, timezone
from typing import Tuple, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from fastapi import HTTPException

from ..models import PlayerResult, Player, GameSession, utc_now
from ..schemas import (
    ResultSubmitRequest,
    PlayerResultDetail,
    LeaderboardEntry,
    LeaderboardResponse,
    Top3Response,
)


def evaluate_tier_and_rank(score: int, accuracy: float, reaction_time: float) -> Tuple[str, str, str]:
    """Calculates performance rank category matching the cybernetic VOIDWARE theme."""
    if score >= 2800 or (score >= 2400 and accuracy >= 90):
        return "TIER S", "APEX REFLEX", "CLASS_A++"
    elif score >= 2000:
        return "TIER A", "SYNAPSE OVERDRIVE", "CLASS_A+"
    elif score >= 1400:
        return "TIER B", "NEURAL RUNNER", "CLASS_A"
    elif score >= 800:
        return "TIER C", "KINETIC OPERATIVE", "CLASS_B"
    else:
        return "TIER D", "TACTICAL INITIATE", "CLASS_C"


def submit_player_result(db: Session, req: ResultSubmitRequest) -> PlayerResultDetail:
    # Verify player exists
    player = db.query(Player).filter(Player.id == req.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    session_id = req.session_id or player.session_id

    # Check if a result already exists for this player and session
    existing = (
        db.query(PlayerResult)
        .filter(PlayerResult.player_id == player.id, PlayerResult.session_id == session_id)
        .first()
    )

    if existing:
        # Prevent multiple submissions of final score
        # Return the existing result instead of duplicating or overwriting
        return get_player_result_detail(db, player.id, session_id)

    tier, rank_eval, class_rate = evaluate_tier_and_rank(
        req.final_score, req.accuracy, req.average_reaction_time
    )

    result = PlayerResult(
        player_id=player.id,
        session_id=session_id,
        final_score=req.final_score,
        best_streak=req.best_streak,
        accuracy=round(req.accuracy, 1),
        average_reaction_time=round(req.average_reaction_time, 1),
        remaining_lives=req.remaining_lives,
        completed_at=utc_now(),
        tier=tier,
        rank_evaluation=rank_eval,
        class_rating=class_rate,
    )

    db.add(result)
    db.commit()
    db.refresh(result)

    return get_player_result_detail(db, player.id, session_id)


def get_player_result_detail(db: Session, player_id: str, session_id: str) -> PlayerResultDetail:
    result = (
        db.query(PlayerResult)
        .filter(PlayerResult.player_id == player_id, PlayerResult.session_id == session_id)
        .first()
    )
    if not result:
        raise HTTPException(status_code=404, detail="Player result not found")

    player = db.query(Player).filter(Player.id == player_id).first()
    player_name = player.name if player else "UNKNOWN_OPERATOR"

    # Calculate actual rank: count how many results have higher score (or tie-breakers)
    higher_count = (
        db.query(PlayerResult)
        .filter(
            PlayerResult.session_id == session_id,
            (PlayerResult.final_score > result.final_score)
            | (
                (PlayerResult.final_score == result.final_score)
                & (PlayerResult.best_streak > result.best_streak)
            )
            | (
                (PlayerResult.final_score == result.final_score)
                & (PlayerResult.best_streak == result.best_streak)
                & (PlayerResult.completed_at < result.completed_at)
            ),
        )
        .count()
    )
    rank = higher_count + 1

    total_results = (
        db.query(PlayerResult).filter(PlayerResult.session_id == session_id).count()
    )
    total_players = (
        db.query(Player).filter(Player.session_id == session_id).count()
    )
    effective_total = max(total_results, total_players, 1)

    # Percentile: (players scored <= this player) / total * 100
    lower_or_equal = (
        db.query(PlayerResult)
        .filter(
            PlayerResult.session_id == session_id,
            PlayerResult.final_score <= result.final_score,
        )
        .count()
    )
    percentile = round((lower_or_equal / max(total_results, 1)) * 100, 1)

    return PlayerResultDetail(
        id=result.id,
        player_id=result.player_id,
        session_id=result.session_id,
        player_name=player_name,
        final_score=result.final_score,
        best_streak=result.best_streak,
        accuracy=result.accuracy,
        average_reaction_time=result.average_reaction_time,
        remaining_lives=result.remaining_lives,
        completed_at=result.completed_at,
        tier=result.tier,
        rank_evaluation=result.rank_evaluation,
        class_rating=result.class_rating,
        rank=rank,
        total_players=effective_total,
        percentile=percentile,
    )


def get_leaderboard_data(db: Session, session_id: str) -> LeaderboardResponse:
    results = (
        db.query(PlayerResult)
        .filter(PlayerResult.session_id == session_id)
        .order_by(
            desc(PlayerResult.final_score),
            desc(PlayerResult.best_streak),
            desc(PlayerResult.accuracy),
            asc(PlayerResult.completed_at),
        )
        .all()
    )

    total_participants = (
        db.query(Player).filter(Player.session_id == session_id).count()
    )

    entries: List[LeaderboardEntry] = []
    for index, res in enumerate(results):
        p = db.query(Player).filter(Player.id == res.player_id).first()
        p_name = p.name if p else f"OP_{res.player_id[:6]}"
        entries.append(
            LeaderboardEntry(
                rank=index + 1,
                player_id=res.player_id,
                player_name=p_name,
                final_score=res.final_score,
                best_streak=res.best_streak,
                accuracy=res.accuracy,
                average_reaction_time=res.average_reaction_time,
                remaining_lives=res.remaining_lives,
                tier=res.tier,
                rank_evaluation=res.rank_evaluation,
                class_rating=res.class_rating,
                completed_at=res.completed_at,
            )
        )

    top3 = entries[:3]
    remaining = entries[3:]

    return LeaderboardResponse(
        session_id=session_id,
        total_participants=total_participants,
        completed_count=len(entries),
        top3=top3,
        remaining=remaining,
        all_entries=entries,
    )


def get_top3_players(db: Session, session_id: str) -> Top3Response:
    board = get_leaderboard_data(db, session_id)
    first = board.top3[0] if len(board.top3) > 0 else None
    second = board.top3[1] if len(board.top3) > 1 else None
    third = board.top3[2] if len(board.top3) > 2 else None

    return Top3Response(first=first, second=second, third=third)
