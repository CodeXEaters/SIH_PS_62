#!/usr/bin/env python3
"""
DHRUV Polar Expedition Platform — Production Smoke Test Script
=============================================================

Validates a live, deployed DHRUV backend environment (such as on Render or local).
Performs end-to-end verification of:
  - System health (/health)
  - Operator authentication & JWT issuance (/api/v1/auth/login)
  - Role identity verification (/api/v1/auth/me)
  - Core logistics endpoints (stations, personnel, inventory, assets, cargo, transport, missions, live tracking)
  - PPT Parity endpoints (permits, environment observations, waste governance, intelligence attention, emergency, executive reports)
  - Real-time WebSocket connectivity (/ws/alerts)

Safety:
  This script is 100% READ-ONLY. It never mutates state, drops tables, or leaves
  permanent test records behind in production.

Usage:
  python scripts/production_smoke_test.py --base-url https://dhruv-backend.onrender.com
  python scripts/production_smoke_test.py --base-url http://localhost:8000
"""

import sys
import time
import argparse
import asyncio
from typing import Dict, Any, Optional

try:
    import httpx
except ImportError:
    print("Error: 'httpx' is required. Run 'pip install httpx'.")
    sys.exit(1)

try:
    import websockets
except ImportError:
    websockets = None


class ProductionSmokeTester:
    def __init__(self, base_url: str, email: str, password: str, timeout: float = 15.0, skip_ws: bool = False):
        self.base_url = base_url.rstrip("/")
        self.email = email
        self.password = password
        self.timeout = timeout
        self.skip_ws = skip_ws
        self.token: Optional[str] = None
        self.passed_count = 0
        self.failed_count = 0
        self.results = []

    def log_result(self, name: str, passed: bool, detail: str, duration_ms: float = 0.0):
        status_icon = "[PASS]" if passed else "[FAIL]"
        if passed:
            self.passed_count += 1
            print(f"  {status_icon} {name:<45} ({duration_ms:.1f}ms) -> {detail}")
        else:
            self.failed_count += 1
            print(f"  {status_icon} {name:<45} ({duration_ms:.1f}ms) -> ERROR: {detail}")
        self.results.append({"name": name, "passed": passed, "detail": detail, "duration_ms": duration_ms})

    def run_http_test(self, client: httpx.Client, name: str, method: str, path: str, expected_status: int = 200, json_body: Any = None, auth: bool = True) -> Optional[Any]:
        url = f"{self.base_url}{path}"
        headers = {}
        if auth and self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        start = time.perf_counter()
        try:
            if method.upper() == "GET":
                resp = client.get(url, headers=headers, timeout=self.timeout)
            elif method.upper() == "POST":
                resp = client.post(url, headers=headers, json=json_body, timeout=self.timeout)
            else:
                raise ValueError(f"Unsupported method: {method}")

            elapsed_ms = (time.perf_counter() - start) * 1000.0

            if resp.status_code == expected_status:
                try:
                    data = resp.json()
                    summary = f"HTTP {resp.status_code}"
                    if isinstance(data, list):
                        summary += f" ({len(data)} items)"
                    elif isinstance(data, dict):
                        summary += f" (keys: {list(data.keys())[:4]})"
                    self.log_result(name, True, summary, elapsed_ms)
                    return data
                except Exception:
                    self.log_result(name, True, f"HTTP {resp.status_code} (non-JSON)", elapsed_ms)
                    return resp.text
            else:
                elapsed_ms = (time.perf_counter() - start) * 1000.0
                err_preview = resp.text[:120].replace("\n", " ")
                self.log_result(name, False, f"Expected HTTP {expected_status}, got {resp.status_code} - {err_preview}", elapsed_ms)
                return None
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            self.log_result(name, False, str(exc), elapsed_ms)
            return None

    async def run_websocket_test(self):
        if self.skip_ws:
            print("  [SKIP] WebSocket test skipped by user flag.")
            return

        if websockets is None:
            self.log_result("WebSocket Connection", False, "'websockets' package not installed in environment.")
            return

        # Derive ws/wss URL
        ws_base = self.base_url.replace("https://", "wss://").replace("http://", "ws://")
        ws_url = f"{ws_base}/ws/alerts"

        start = time.perf_counter()
        try:
            async with asyncio.timeout(self.timeout):
                async with websockets.connect(ws_url) as ws:
                    await ws.send("ping")
                    response = await ws.recv()
                    elapsed_ms = (time.perf_counter() - start) * 1000.0
                    if response == "pong":
                        self.log_result("WebSocket Telemetry (/ws/alerts)", True, f"Received 'pong' handshake reply", elapsed_ms)
                    else:
                        self.log_result("WebSocket Telemetry (/ws/alerts)", True, f"Connected & received: {response[:60]}", elapsed_ms)
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            self.log_result("WebSocket Telemetry (/ws/alerts)", False, str(exc), elapsed_ms)

    def run_all(self) -> bool:
        print("=" * 80)
        print("DHRUV POLAR EXPEDITION PLATFORM — PRODUCTION SMOKE TEST")
        print(f"Target Backend: {self.base_url}")
        print(f"Operator Email: {self.email}")
        print("=" * 80)

        with httpx.Client(follow_redirects=True) as client:
            # 1. Health Checks
            print("\n[Phase 1] System Health & Readiness")
            self.run_http_test(client, "Health Check (/health)", "GET", "/health", auth=False)
            self.run_http_test(client, "Root Endpoint (/)", "GET", "/", auth=False)

            # 2. Authentication
            print("\n[Phase 2] Authentication & RBAC")
            login_data = self.run_http_test(
                client,
                "Operator Login (JWT Issuance)",
                "POST",
                "/api/v1/auth/login",
                expected_status=200,
                json_body={"username": self.email, "password": self.password},
                auth=False,
            )
            if login_data and "access_token" in login_data:
                self.token = login_data["access_token"]
            else:
                print("  [CRITICAL] Login failed; subsequent authenticated endpoints cannot be tested.")

            if self.token:
                self.run_http_test(client, "Current User Identity (/auth/me)", "GET", "/api/v1/auth/me")

            # 3. Core Logistics & Polar Operations
            print("\n[Phase 3] Core Polar Operations & Inventory")
            self.run_http_test(client, "Polar Research Stations", "GET", "/api/v1/stations/")
            self.run_http_test(client, "Active Station Personnel", "GET", "/api/v1/personnel/")
            self.run_http_test(client, "Critical Life-Support Inventory", "GET", "/api/v1/inventory/")
            self.run_http_test(client, "High-Value Field Assets", "GET", "/api/v1/assets/")
            self.run_http_test(client, "Expedition Cargo Manifest", "GET", "/api/v1/cargo/")
            self.run_http_test(client, "Transport & Traverse Vehicles", "GET", "/api/v1/transport/")
            self.run_http_test(client, "Field Missions & Sorties", "GET", "/api/v1/missions/")
            self.run_http_test(client, "GPS/Iridium Live Tracking Telemetry", "GET", "/api/v1/tracking/live")
            self.run_http_test(client, "Operational Incident Alerts", "GET", "/api/v1/alerts/")

            # 4. Strict PPT Parity Endpoints
            print("\n[Phase 4] PPT Parity Compliance & Intelligence")
            self.run_http_test(client, "Antarctic Treaty Permits", "GET", "/api/v1/permits/")
            self.run_http_test(client, "Current Environmental Observations", "GET", "/api/v1/environment/current")
            self.run_http_test(client, "Environmental Waste Governance", "GET", "/api/v1/waste/")
            self.run_http_test(client, "AI Operational Attention Feed", "GET", "/api/v1/intelligence/attention")
            self.run_http_test(client, "Active Emergency Incident", "GET", "/api/v1/emergency/active")
            self.run_http_test(client, "Emergency Incident Records", "GET", "/api/v1/emergency")
            self.run_http_test(client, "Executive Readiness Summary Reports", "GET", "/api/v1/reports/summary")

            # 5. Real-Time WebSocket Channel
            print("\n[Phase 5] Real-Time WebSocket Streaming")
            asyncio.run(self.run_websocket_test())

        print("\n" + "=" * 80)
        print("SMOKE TEST SUMMARY")
        print(f"Total Tests Run: {self.passed_count + self.failed_count}")
        print(f"Passed:         {self.passed_count}")
        print(f"Failed:         {self.failed_count}")
        print("=" * 80)

        return self.failed_count == 0


def main():
    parser = argparse.ArgumentParser(description="DHRUV Production Smoke Test Utility")
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Target backend base URL (e.g., https://dhruv-backend.onrender.com or http://localhost:8000)",
    )
    parser.add_argument(
        "--email",
        default="admin@dhruv.gov.in",
        help="Operator email credential (default: admin@dhruv.gov.in)",
    )
    parser.add_argument(
        "--password",
        default="Admin@123456",
        help="Operator password credential (default: Admin@123456)",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=15.0,
        help="Request timeout in seconds (default: 15.0)",
    )
    parser.add_argument(
        "--skip-ws",
        action="store_true",
        help="Skip WebSocket connectivity check",
    )

    args = parser.parse_args()
    tester = ProductionSmokeTester(
        base_url=args.base_url,
        email=args.email,
        password=args.password,
        timeout=args.timeout,
        skip_ws=args.skip_ws,
    )
    success = tester.run_all()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
