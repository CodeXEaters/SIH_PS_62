"""
DHRUV Telemetry Simulator
Simulates GPS tracking points, speeds, and battery levels for Polar Traverse Missions
or Logistics Transports, sending updates to the DHRUV backend API.
"""

import os
import sys
import time
import argparse
import logging
from typing import List, Tuple
import httpx

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("dhruv.telemetry_sim")

# Realistic waypoints in East Antarctica (Maitri to Field Camp Alpha)
DEFAULT_ROUTE_WAYPOINTS: List[Tuple[float, float]] = [
    (-70.7667, 11.7333),  # Maitri Research Base
    (-70.8200, 11.8500),  # Schirmacher Oasis Glacier Boundary
    (-70.9100, 12.0100),  # Polar Plateau Waypoint 1
    (-70.9900, 12.1800),  # Crevasse Zone Crossing Point
    (-71.0800, 12.3200),  # Wohlthat Mountains Approach
    (-71.1500, 12.4100),  # South Glaciology Ridge
    (-71.2000, 12.5000),  # Field Camp Alpha Arrival Depot
]


def interpolate_route(waypoints: List[Tuple[float, float]], total_points: int) -> List[Tuple[float, float]]:
    """Generates an interpolated list of coordinates along the waypoint path."""
    if total_points <= len(waypoints):
        return waypoints[:total_points]

    points = []
    num_segments = len(waypoints) - 1
    points_per_seg = (total_points - 1) // num_segments
    extra = (total_points - 1) % num_segments

    for i in range(num_segments):
        start_lat, start_lon = waypoints[i]
        end_lat, end_lon = waypoints[i + 1]
        seg_count = points_per_seg + (1 if i < extra else 0)

        for step in range(seg_count):
            fraction = step / seg_count
            lat = start_lat + (end_lat - start_lat) * fraction
            lon = start_lon + (end_lon - start_lon) * fraction
            points.append((round(lat, 4), round(lon, 4)))

    points.append(waypoints[-1])
    return points


def authenticate(base_url: str, username: str, password: str) -> str:
    """Authenticates against the backend and returns a valid JWT access token."""
    login_url = f"{base_url.rstrip('/')}/auth/login"
    logger.info(f"Authenticating as {username} against {login_url}...")
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(login_url, json={"email": username, "password": password})
            if resp.status_code != 200:
                # Try OAuth2 form fallback
                resp = client.post(login_url, data={"username": username, "password": password})
            resp.raise_for_status()
            data = resp.json()
            return data["access_token"]
    except Exception as exc:
        logger.error(f"Authentication failed: {exc}")
        raise


def run_simulation(
    base_url: str,
    entity_type: str,
    entity_id: int,
    interval: float,
    total_points: int,
    anomaly_stop: bool,
    token: str,
) -> int:
    """Streams simulated telemetry points to /tracking/update."""
    update_url = f"{base_url.rstrip('/')}/tracking/update"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    route = interpolate_route(DEFAULT_ROUTE_WAYPOINTS, total_points)
    stop_at = (total_points // 2) if anomaly_stop else total_points

    logger.info(
        f"Starting simulation for {entity_type} #{entity_id} "
        f"({len(route)} waypoints, {interval}s interval, anomaly_stop={anomaly_stop})..."
    )

    sent = 0
    with httpx.Client(timeout=10.0) as client:
        for idx, (lat, lon) in enumerate(route):
            if anomaly_stop and idx >= stop_at:
                logger.warning(
                    f"SIMULATED ANOMALY TRIGGERED: Halting telemetry after {sent} pings! "
                    f"Signal-loss condition initiated for Member 3 anomaly detection demo."
                )
                break

            speed = round(12.0 + (idx % 4) * 2.5, 1)
            battery = round(max(15.0, 98.0 - (idx * (80.0 / total_points))), 1)

            payload = {
                "entity_type": entity_type,
                "entity_id": entity_id,
                "latitude": lat,
                "longitude": lon,
                "speed": speed,
                "battery": battery,
            }

            try:
                resp = client.post(update_url, json=payload, headers=headers)
                resp.raise_for_status()
                sent += 1
                logger.info(
                    f"[{sent}/{total_points}] Ping sent -> "
                    f"Lat: {lat}, Lon: {lon}, Speed: {speed} km/h, Battery: {battery}%"
                )
            except Exception as exc:
                logger.error(f"Failed to transmit telemetry ping {idx + 1}: {exc}")

            if idx < len(route) - 1:
                time.sleep(interval)

    logger.info(f"Simulation completed. Successfully dispatched {sent} telemetry points.")
    return sent


def main():
    parser = argparse.ArgumentParser(description="DHRUV Polar Tracking Telemetry Simulator")
    parser.add_argument("--base-url", default=os.getenv("DHRUV_API_URL", "http://localhost:8000"), help="Backend URL")
    parser.add_argument("--entity-type", default="MISSION", choices=["MISSION", "TRANSPORT"], help="Entity type")
    parser.add_argument("--entity-id", type=int, default=1, help="Entity ID")
    parser.add_argument("--interval", type=float, default=3.0, help="Interval between pings in seconds")
    parser.add_argument("--points", type=int, default=10, help="Total points in route")
    parser.add_argument("--username", default=os.getenv("DHRUV_SIM_USER", "ops@dhruv.gov.in"), help="Auth username")
    parser.add_argument("--password", default=os.getenv("DHRUV_SIM_PASSWORD", "Ops@123456"), help="Auth password")
    parser.add_argument("--anomaly-stop", action="store_true", help="Simulate deliberate signal loss after N pings")

    args = parser.parse_args()

    try:
        token = authenticate(args.base_url, args.username, args.password)
        run_simulation(
            base_url=args.base_url,
            entity_type=args.entity_type,
            entity_id=args.entity_id,
            interval=args.interval,
            total_points=args.points,
            anomaly_stop=args.anomaly_stop,
            token=token,
        )
    except Exception as exc:
        logger.error(f"Simulator terminated with error: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
