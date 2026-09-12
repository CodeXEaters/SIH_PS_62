import pytest
import asyncio
from unittest.mock import AsyncMock
from app.websocket.manager import ConnectionManager, ws_manager


def test_websocket_alerts_ping_pong(client):
    """Test connecting to /ws/alerts and ping-pong communication."""
    with client.websocket_connect("/ws/alerts") as websocket:
        websocket.send_text("ping")
        data = websocket.receive_text()
        assert data == "pong"


def test_websocket_tracking_ping_pong(client):
    """Test connecting to /ws/tracking and ping-pong communication."""
    with client.websocket_connect("/ws/tracking") as websocket:
        websocket.send_text("ping")
        data = websocket.receive_text()
        assert data == "pong"


@pytest.mark.anyio
async def test_connection_manager_lifecycle_and_broadcast():
    """Test ConnectionManager connect, broadcast, and disconnect handling."""
    manager = ConnectionManager()
    
    mock_ws1 = AsyncMock()
    mock_ws2 = AsyncMock()
    
    # Test connect
    await manager.connect(mock_ws1, channel="alerts")
    await manager.connect(mock_ws2, channel="alerts")
    assert len(manager.active_channels["alerts"]) == 2
    
    # Test broadcast
    payload = {"type": "ALERT_TRIGGERED", "severity": "CRITICAL"}
    await manager.broadcast("alerts", payload)
    
    mock_ws1.send_json.assert_awaited_once_with(payload)
    mock_ws2.send_json.assert_awaited_once_with(payload)
    
    # Test disconnect
    manager.disconnect(mock_ws1, channel="alerts")
    assert len(manager.active_channels["alerts"]) == 1
    assert manager.active_channels["alerts"][0] == mock_ws2
    
    # Test stale connection cleanup during broadcast
    mock_ws2.send_json.side_effect = Exception("Connection lost")
    await manager.broadcast("alerts", {"type": "ANOTHER_ALERT"})
    # mock_ws2 should have been removed due to error
    assert len(manager.active_channels["alerts"]) == 0
