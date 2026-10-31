from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import ALLOWED_ORIGINS
from .database import engine, Base
from .routes import session_routes, player_routes, result_routes, ws_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables if they do not exist
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="BUTTON PANIC API - VOIDWARE CS CLUB",
    description="Backend API for BUTTON PANIC real-time multiplayer reaction game",
    version="2.5.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(session_routes.router)
app.include_router(player_routes.router)
app.include_router(result_routes.router)
app.include_router(ws_routes.router)


@app.get("/")
def root():
    return {
        "system": "VOIDWARE BUTTON PANIC ENGINE",
        "version": "2.5.0",
        "status": "OPERATIONAL",
        "protocol": "ACTIVE",
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "system": "healthy"}
