import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import relationship
from .database import Base


def utc_now():
    return datetime.now(timezone.utc)


class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(String(64), primary_key=True, default=lambda: f"0x{uuid.uuid4().hex[:6].upper()}")
    # Status: 'registration', 'waiting', 'playing', 'completed'
    status = Column(String(32), default="registration", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    countdown_started_at = Column(DateTime, nullable=True)
    countdown_duration = Column(Integer, default=15, nullable=False)
    game_started_at = Column(DateTime, nullable=True)
    game_ended_at = Column(DateTime, nullable=True)

    players = relationship("Player", back_populates="session", cascade="all, delete-orphan")
    results = relationship("PlayerResult", back_populates="session", cascade="all, delete-orphan")


class Player(Base):
    __tablename__ = "players"

    id = Column(String(64), primary_key=True, default=lambda: f"0x{uuid.uuid4().hex[:6].upper()}")
    session_id = Column(String(64), ForeignKey("game_sessions.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(64), nullable=False)
    joined_at = Column(DateTime, default=utc_now, nullable=False)

    session = relationship("GameSession", back_populates="players")
    result = relationship("PlayerResult", back_populates="player", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_players_session_name", "session_id", "name"),
    )


class PlayerResult(Base):
    __tablename__ = "player_results"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    player_id = Column(String(64), ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(64), ForeignKey("game_sessions.id", ondelete="CASCADE"), nullable=False)
    final_score = Column(Integer, default=0, nullable=False)
    best_streak = Column(Integer, default=0, nullable=False)
    accuracy = Column(Float, default=0.0, nullable=False)
    average_reaction_time = Column(Float, default=0.0, nullable=False)
    remaining_lives = Column(Integer, default=0, nullable=False)
    completed_at = Column(DateTime, default=utc_now, nullable=False)
    tier = Column(String(32), default="TIER S", nullable=False)
    rank_evaluation = Column(String(64), default="APEX REFLEX", nullable=False)
    class_rating = Column(String(32), default="CLASS_A++", nullable=False)

    player = relationship("Player", back_populates="result")
    session = relationship("GameSession", back_populates="results")

    __table_args__ = (
        UniqueConstraint("session_id", "player_id", name="uq_session_player_result"),
        Index("ix_results_session_score", "session_id", "final_score"),
    )
