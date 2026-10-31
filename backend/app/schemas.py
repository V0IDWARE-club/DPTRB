from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Player schemas
class PlayerRegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=30)
    session_id: Optional[str] = None


class PlayerResponse(BaseModel):
    id: str
    session_id: str
    name: str
    joined_at: datetime

    class Config:
        from_attributes = True


# Result schemas
class ResultSubmitRequest(BaseModel):
    player_id: str
    session_id: Optional[str] = None
    final_score: int = Field(ge=0)
    best_streak: int = Field(ge=0, default=0)
    accuracy: float = Field(ge=0.0, le=100.0, default=100.0)
    average_reaction_time: float = Field(ge=0.0, default=350.0)
    remaining_lives: int = Field(ge=0, le=3, default=0)


class PlayerResultDetail(BaseModel):
    id: str
    player_id: str
    session_id: str
    player_name: str
    final_score: int
    best_streak: int
    accuracy: float
    average_reaction_time: float
    remaining_lives: int
    completed_at: datetime
    tier: str
    rank_evaluation: str
    class_rating: str
    rank: int
    total_players: int
    percentile: float

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    rank: int
    player_id: str
    player_name: str
    final_score: int
    best_streak: int
    accuracy: float
    average_reaction_time: float
    remaining_lives: int
    tier: str
    rank_evaluation: str
    class_rating: str
    completed_at: datetime


class Top3Response(BaseModel):
    first: Optional[LeaderboardEntry] = None
    second: Optional[LeaderboardEntry] = None
    third: Optional[LeaderboardEntry] = None


class LeaderboardResponse(BaseModel):
    session_id: str
    total_participants: int
    completed_count: int
    top3: List[LeaderboardEntry]
    remaining: List[LeaderboardEntry]
    all_entries: List[LeaderboardEntry]


# Session schemas
class StartCountdownRequest(BaseModel):
    duration_seconds: int = Field(default=15, ge=3, le=60)


class GameSessionResponse(BaseModel):
    id: str
    status: str
    created_at: datetime
    countdown_started_at: Optional[datetime] = None
    countdown_duration: int
    countdown_remaining_seconds: Optional[float] = None
    game_started_at: Optional[datetime] = None
    game_ended_at: Optional[datetime] = None
    player_count: int
    completed_count: int

    class Config:
        from_attributes = True
