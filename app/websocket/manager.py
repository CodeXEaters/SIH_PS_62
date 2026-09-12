import logging
from typing import Dict, List, Any
from fastapi import WebSocket

logger = logging.getLogger("dhruv.websocket")


class ConnectionManager:
    def __init__(self):
        # Map of channel name -> list of active WebSocket connections
        self.active_channels: Dict[str, List[WebSocket]] = {
            "alerts": [],
            "tracking": [],
        }

    async def connect(self, websocket: WebSocket, channel: str = "alerts"):
        await websocket.accept()
        if channel not in self.active_channels:
            self.active_channels[channel] = []
        self.active_channels[channel].append(websocket)
        logger.info("WebSocket connected to channel '%s'. Active listeners: %d", channel, len(self.active_channels[channel]))

    def disconnect(self, websocket: WebSocket, channel: str = "alerts"):
        if channel in self.active_channels and websocket in self.active_channels[channel]:
            self.active_channels[channel].remove(websocket)
            logger.info("WebSocket disconnected from channel '%s'. Remaining: %d", channel, len(self.active_channels[channel]))

    async def broadcast(self, channel: str, message: Dict[str, Any]):
        if channel not in self.active_channels:
            return

        stale_connections = []
        for connection in self.active_channels[channel]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.debug("Failed to send WebSocket message: %s. Marking connection stale.", e)
                stale_connections.append(connection)

        for stale in stale_connections:
            self.disconnect(stale, channel)


ws_manager = ConnectionManager()
