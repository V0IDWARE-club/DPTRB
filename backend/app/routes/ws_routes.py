import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..connection_manager import manager
from ..database import SessionLocal
from ..services.session_service import get_or_create_active_session, get_session_response, start_session_countdown

logger = logging.getLogger("voidware.ws")
router = APIRouter(tags=["WebSockets"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial status
        with SessionLocal() as db:
            session = get_or_create_active_session(db)
            session_info = get_session_response(db, session)

        await manager.send_personal(
            {
                "type": "INITIAL_STATE",
                "session": session_info.model_dump(mode="json"),
            },
            websocket,
        )

        while True:
            text = await websocket.receive_text()
            try:
                data = json.loads(text)
                msg_type = data.get("type")

                if msg_type == "PING":
                    await manager.send_personal({"type": "PONG"}, websocket)

                elif msg_type == "START_COUNTDOWN":
                    duration = int(data.get("duration", 15))
                    with SessionLocal() as db:
                        active_s = get_or_create_active_session(db)
                        start_session_countdown(db, active_s.id, duration)

                elif msg_type == "GET_STATUS":
                    with SessionLocal() as db:
                        active_s = get_or_create_active_session(db)
                        s_info = get_session_response(db, active_s)
                    await manager.send_personal(
                        {
                            "type": "SESSION_UPDATE",
                            "session": s_info.model_dump(mode="json"),
                        },
                        websocket,
                    )
            except json.JSONDecodeError:
                pass
            except Exception as e:
                logger.error(f"Error handling websocket message: {e}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        manager.disconnect(websocket)
