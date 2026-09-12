import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import ws_manager

logger = logging.getLogger("dhruv.websocket")
router = APIRouter()


@router.websocket("/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket, channel="alerts")
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, channel="alerts")
    except Exception as e:
        logger.debug("WebSocket alerts connection terminated: %s", e)
        ws_manager.disconnect(websocket, channel="alerts")


@router.websocket("/tracking")
async def websocket_tracking_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket, channel="tracking")
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, channel="tracking")
    except Exception as e:
        logger.debug("WebSocket tracking connection terminated: %s", e)
        ws_manager.disconnect(websocket, channel="tracking")
