from datetime import datetime, timezone, timedelta
from app.models.permit import PermitType


def test_evaluate_mission_plan_pass(client, auth_headers):
    now = datetime.now(timezone.utc)
    # Ensure Personnel 1 has active health clearance and readiness
    client.patch(
        "/api/v1/personnel/1/readiness",
        json={
            "readiness_status": "READY",
            "health_clearance_status": "APPROVED",
            "clearance_expiry": (now + timedelta(days=180)).isoformat(),
        },
        headers=auth_headers,
    )

    # Create valid permit
    permit_payload = {
        "permit_type": PermitType.SCIENTIFIC_RESEARCH.value,
        "issuing_authority": "NCPOR",
        "station_id": 1,
        "issue_date": now.isoformat(),
        "expiry_date": (now + timedelta(days=90)).isoformat(),
        "responsible_officer": "Dr. Priya Nair",
    }
    p_resp = client.post("/api/v1/permits", json=permit_payload, headers=auth_headers)
    permit_id = p_resp.json()["id"]

    eval_payload = {
        "mission_name": "Routine Port Logistics Survey",
        "origin_station_id": 6,
        "destination_station_id": 6,
        "mission_type": "LOGISTICS_SUPPLY",
        "team_lead_id": 1,
        "assigned_personnel_ids": [1],
        "assigned_asset_ids": [],
        "start_time": now.isoformat(),
        "expected_return": (now + timedelta(days=2)).isoformat(),
        "requires_permit": True,
        "permit_id": permit_id,
    }
    response = client.post("/api/v1/missions/evaluate-plan", json=eval_payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["overall_status"] in ["PASS", "WARNING"]
    categories = [c["category"] for c in data["checks"]]
    assert "PERMIT" in categories
    assert "PERSONNEL" in categories
    assert "ENVIRONMENT" in categories


def test_evaluate_mission_plan_blocked_missing_permit(client, auth_headers):
    now = datetime.now(timezone.utc)
    eval_payload = {
        "mission_name": "Deep Continental Ice Core Extraction",
        "origin_station_id": 1,
        "destination_station_id": 2,
        "mission_type": "FIELD_TRAVERSE",
        "team_lead_id": 1,
        "assigned_personnel_ids": [1],
        "assigned_asset_ids": [],
        "start_time": now.isoformat(),
        "expected_return": (now + timedelta(days=5)).isoformat(),
        "requires_permit": True,
        "permit_id": None,  # Missing mandatory permit
    }
    response = client.post("/api/v1/missions/evaluate-plan", json=eval_payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["overall_status"] == "BLOCKED"
    permit_check = next(c for c in data["checks"] if c["category"] == "PERMIT")
    assert permit_check["status"] == "BLOCKED"
    assert "permit" in permit_check["details"].lower()


def test_evaluate_mission_plan_blocked_expired_personnel(client, auth_headers):
    now = datetime.now(timezone.utc)
    # Set personnel readiness to CLEARANCE_EXPIRED
    client.patch(
        "/api/v1/personnel/1/readiness",
        json={"readiness_status": "CLEARANCE_EXPIRED", "clearance_expiry": (now - timedelta(days=5)).isoformat()},
        headers=auth_headers,
    )

    eval_payload = {
        "mission_name": "Lake Vanda Hydrology Sampling",
        "origin_station_id": 1,
        "destination_station_id": 1,
        "mission_type": "SCIENTIFIC_SURVEY",
        "team_lead_id": 1,
        "start_time": now.isoformat(),
        "expected_return": (now + timedelta(days=2)).isoformat(),
        "requires_permit": False,
    }
    response = client.post("/api/v1/missions/evaluate-plan", json=eval_payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["overall_status"] == "BLOCKED"
    p_check = next(c for c in data["checks"] if c["category"] == "PERSONNEL")
    assert p_check["status"] == "BLOCKED"

    # Reset personnel 1 back to READY
    client.patch(
        "/api/v1/personnel/1/readiness",
        json={
            "readiness_status": "READY",
            "health_clearance_status": "APPROVED",
            "clearance_expiry": (now + timedelta(days=180)).isoformat(),
        },
        headers=auth_headers,
    )
