import pytest
from app.models.emergency import EmergencyType, EmergencySeverity, EmergencyStatus, EmergencyDecision
from app.models.tracking_event import TrackingEntityType


def test_end_to_end_cross_member_operational_flow(client, auth_headers):
    """
    Comprehensive End-to-End Cross-Member Integration Test:
    
    Member 1: Stations, Personnel (Medical), Assets (Vehicle)
    Member 2: Mission, Transport, Tracking/Telemetry
    Member 3: Anomaly Detection -> Alert Ingestion -> Risk Engine ->
              Emergency SOS -> Rescue Optimization (Doctor + Transport matching) ->
              Human Decision Dispatch -> Alert Lifecycle Resolution -> What-If Simulator -> Attention Queue
    """
    
    # -------------------------------------------------------------------------
    # 1. Verification of Member 1 Foundation (Stations, Personnel, Assets)
    # -------------------------------------------------------------------------
    station_res = client.get("/stations/1", headers=auth_headers)
    assert station_res.status_code == 200, "Member 1 Station 1 must exist"
    station_data = station_res.json()
    st_lat = station_data["latitude"]
    st_lon = station_data["longitude"]

    # Verify medical personnel exists in Member 1 personnel registry
    personnel_res = client.get("/personnel", headers=auth_headers)
    assert personnel_res.status_code == 200
    personnel_list = personnel_res.json()
    doctors = [
        p for p in personnel_list 
        if "Medic" in p.get("team", "") or "Doctor" in p.get("designation", "") or "Medical" in p.get("team", "")
    ]
    assert len(doctors) > 0, "Member 1 Medical officer must exist"

    # -------------------------------------------------------------------------
    # 2. Telemetry Ingestion from Member 2 (Simulate low battery event)
    # -------------------------------------------------------------------------
    tracking_payload = {
        "entity_type": TrackingEntityType.TRANSPORT.value,
        "entity_id": 1,
        "latitude": st_lat - 0.05,
        "longitude": st_lon + 0.05,
        "speed": 22.0,
        "battery": 14.5,  # Trigger LOW_BATTERY anomaly (< 20%)
    }
    track_res = client.post("/tracking/update", json=tracking_payload, headers=auth_headers)
    assert track_res.status_code == 201, f"Member 2 Tracking failed: {track_res.text}"

    # -------------------------------------------------------------------------
    # 3. Member 3 Anomaly Detection Scan
    # -------------------------------------------------------------------------
    scan_res = client.post("/intelligence/anomalies/scan", headers=auth_headers)
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert "anomalies_detected" in scan_data
    assert "anomalies" in scan_data
    assert isinstance(scan_data["anomalies"], list)

    # -------------------------------------------------------------------------
    # 4. Member 3 Risk Scoring Engine & Delay Predictor
    # -------------------------------------------------------------------------
    risk_res = client.get("/intelligence/risk/mission/1", headers=auth_headers)
    assert risk_res.status_code == 200
    risk_data = risk_res.json()
    assert risk_data["mission_id"] == 1
    assert 0.0 <= risk_data["risk_score"] <= 100.0
    assert risk_data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert len(risk_data["key_drivers"]) > 0
    assert len(risk_data["recommended_action"]) > 0

    delay_res = client.get("/intelligence/delay/cargo/1", headers=auth_headers)
    assert delay_res.status_code == 200
    delay_data = delay_res.json()
    assert delay_data["cargo_id"] == 1
    assert 0.0 <= delay_data["delay_probability"] <= 1.0
    assert delay_data["estimated_delay_hours"] >= 0.0
    assert len(delay_data["recommendation"]) > 0

    # -------------------------------------------------------------------------
    # 5. Member 3 Emergency SOS Declaration & Automated Rescue Optimization
    # -------------------------------------------------------------------------
    sos_payload = {
        "title": "Medical Evacuation Required in Sector 4",
        "emergency_type": EmergencyType.MEDICAL.value,
        "severity": EmergencySeverity.CRITICAL.value,
        "station_id": 1,
        "mission_id": 1,
        "latitude": st_lat - 0.05,
        "longitude": st_lon + 0.05,
        "description": "Expedition researcher sustained severe hypothermia during glaciological traverse.",
    }
    emg_res = client.post("/emergency", json=sos_payload, headers=auth_headers)
    assert emg_res.status_code == 201, f"Emergency declaration failed: {emg_res.text}"
    emg_data = emg_res.json()
    emg_id = emg_data["id"]

    # Verify incident code format and initial status
    assert emg_data["incident_code"].startswith("EMG-2026-")
    assert emg_data["status"] == EmergencyStatus.OPEN.value
    assert emg_data["human_decision"] == EmergencyDecision.PENDING.value

    # Verify AI Rescue Plan optimization
    assert "DISPATCH PLAN" in emg_data["recommended_response"]
    assert "Estimated transit" in emg_data["recommended_response"]

    # Verify automatic CRITICAL alert was generated for this emergency
    alerts_res = client.get("/alerts", headers=auth_headers)
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    emg_alerts = [a for a in alerts if emg_data["incident_code"] in a.get("message", "")]
    assert len(emg_alerts) >= 1
    emg_alert = emg_alerts[0]
    assert emg_alert["severity"] == "CRITICAL"
    emg_alert_id = emg_alert["id"]

    # -------------------------------------------------------------------------
    # 6. Human-in-the-Loop Emergency Decision & Dispatch
    # -------------------------------------------------------------------------
    decision_payload = {
        "decision": EmergencyDecision.APPROVED.value,
        "notes": "Rescue team dispatched via Snowcat with medical kit.",
    }
    dec_res = client.post(f"/emergency/{emg_id}/decision", json=decision_payload, headers=auth_headers)
    assert dec_res.status_code == 200
    dec_data = dec_res.json()
    assert dec_data["human_decision"] == EmergencyDecision.APPROVED.value
    assert dec_data["status"] == EmergencyStatus.DISPATCHED.value
    assert dec_data["decision_notes"] == "Rescue team dispatched via Snowcat with medical kit."

    # -------------------------------------------------------------------------
    # 7. Alert Lifecycle Management (Acknowledge -> Resolve)
    # -------------------------------------------------------------------------
    ack_res = client.patch(f"/alerts/{emg_alert_id}/acknowledge", headers=auth_headers)
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "ACKNOWLEDGED"

    res_res = client.patch(f"/alerts/{emg_alert_id}/resolve", headers=auth_headers)
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "RESOLVED"

    # -------------------------------------------------------------------------
    # 8. Member 3 What-If Simulator & Operational Attention Dashboard
    # -------------------------------------------------------------------------
    what_if_payload = {
        "vessel_delay_days": 12,
        "aircraft_cancelled": True,
        "fuel_consumption_spike_pct": 35.0,
        "mission_traverse_extended_hours": 8.0,
        "station_transfer_delayed_days": 4
    }
    what_if_res = client.post("/intelligence/what-if", json=what_if_payload, headers=auth_headers)
    assert what_if_res.status_code == 200
    what_if_data = what_if_res.json()
    assert "operational_risk_score" in what_if_data
    assert what_if_data["operational_risk_score"] >= 0.0
    assert "bharati_fuel_days_remaining" in what_if_data
    assert "recommended_action" in what_if_data

    # Attention queue dashboard
    attention_res = client.get("/intelligence/attention", headers=auth_headers)
    assert attention_res.status_code == 200
    attn_items = attention_res.json()
    assert isinstance(attn_items, list)
    assert len(attn_items) > 0
    first_item = attn_items[0]
    assert "id" in first_item
    assert "title" in first_item
    assert "severity" in first_item
    assert "action_label" in first_item
