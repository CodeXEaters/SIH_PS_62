from app.models.recommendation_feedback import FeedbackDecision, FeedbackOutcome


def test_record_recommendation_feedback(client, auth_headers):
    payload = {
        "recommendation_id": "REC-ROUTE-4401",
        "decision": FeedbackDecision.APPROVED.value,
        "reason": "High wind corridor avoided via Waypoint Echo",
        "outcome": FeedbackOutcome.SUCCESSFUL.value,
    }
    response = client.post("/api/v1/intelligence/feedback", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["recommendation_id"] == "REC-ROUTE-4401"
    assert data["decision"] == FeedbackDecision.APPROVED.value


def test_feedback_summary_statistics(client, auth_headers):
    # Post an alternative decision
    client.post(
        "/api/v1/intelligence/feedback",
        json={
            "recommendation_id": "REC-EMG-902",
            "decision": FeedbackDecision.ALTERNATIVE_SELECTED.value,
            "reason": "Deployed tracked rover instead of air ambulance due to cloud base",
            "outcome": FeedbackOutcome.MITIGATED.value,
        },
        headers=auth_headers,
    )

    response = client.get("/api/v1/intelligence/feedback/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_decisions"] >= 2
    assert "acceptance_rate_percent" in data
    assert len(data["recent_audit_log"]) >= 1
