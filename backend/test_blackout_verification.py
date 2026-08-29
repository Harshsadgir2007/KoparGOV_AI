"""Blackout sequence live verification test."""

from fastapi.testclient import TestClient
from app.main import app

def verify_blackout_lifecycle():
    client = TestClient(app)

    print("=================================================================")
    print("        CIVIC DATA RESILIENCE / BLACKOUT VERIFICATION           ")
    print("=================================================================")

    # 1. Reset & Check Initial NORMAL Status
    r_reset = client.post("/api/resilience/reset")
    assert r_reset.status_code == 200, "Reset failed"
    
    r_status1 = client.get("/api/resilience/status")
    status1 = r_status1.json()
    print(f"\n[1] Initial State: Mode={status1['system_mode']}, PrimaryOnline={status1['primary_store_online']}")
    assert status1["system_mode"] == "NORMAL"
    assert status1["primary_store_online"] is True

    # 2. Simulate Backend Blackout
    r_blackout = client.post("/api/resilience/simulate-blackout")
    assert r_blackout.status_code == 200
    blackout_data = r_blackout.json()
    print(f"\n[2] Blackout Triggered: Mode={blackout_data['system_mode']}, PrimaryOnline={blackout_data['primary_store_online']}")
    assert blackout_data["system_mode"] == "DEGRADED"
    assert blackout_data["primary_store_online"] is False

    # 3. Submit Citizen Complaint During Blackout
    issue_payload = {
        "id": "ISS-BLACKOUT-LIVE",
        "title": "Emergency Hospital Power Outage & Drain Flood",
        "category": "Drainage & Sewage",
        "description": "Drain overflowing into hospital emergency ward entry during municipal grid blackout.",
        "location": "Ward 3 - Tilak Nagar & Hospital Zone",
        "ward_number": 3,
        "latitude": 19.8890,
        "longitude": 74.4740,
        "severity": 95.0,
        "urgency": 95.0,
        "population_affected": 3000.0,
        "health_safety_impact": 95.0,
        "location_sensitivity": 100.0,
        "complaint_age": 1.0,
        "estimated_cost": 15000.0,
        "required_workers": 4,
        "required_vehicles": 2,
    }
    r_post = client.post("/api/issues", json=issue_payload)
    assert r_post.status_code == 201, f"Expected 201, got {r_post.status_code}: {r_post.text}"
    post_res = r_post.json()
    print(f"\n[3] Issue Submitted During Blackout:")
    print(f"    - Issue ID: {post_res['issue']['id']}")
    print(f"    - Issue Status: {post_res['issue']['status']}")
    print(f"    - Operation ID in Journal: {post_res.get('operation_id')}")
    print(f"    - Resilience Mode in Response: {post_res.get('resilience_mode')}")
    assert post_res["issue"]["status"] == "PENDING_RECOVERY"

    # Check journal has pending operations
    r_status2 = client.get("/api/resilience/status")
    status2 = r_status2.json()
    print(f"    - Pending Journal Operations: {status2['pending_operations_count']}")
    assert status2["pending_operations_count"] >= 1

    # 4. Recover System
    r_recover = client.post("/api/resilience/recover")
    assert r_recover.status_code == 200
    recover_data = r_recover.json()
    print(f"\n[4] System Recovery Executed:")
    print(f"    - Replayed Operations: {recover_data['operations_replayed']}")
    print(f"    - Recovered Records: {recover_data['records_recovered']}")
    print(f"    - Conflicts: {recover_data['conflicts_detected']}")
    assert recover_data["operations_replayed"] >= 1

    # 5. Check Final Status & Issue
    r_status3 = client.get("/api/resilience/status")
    status3 = r_status3.json()
    print(f"\n[5] Post-Recovery State: Mode={status3['system_mode']}, PrimaryOnline={status3['primary_store_online']}")
    assert status3["system_mode"] == "NORMAL"
    assert status3["primary_store_online"] is True

    # Verify issue is now committed and stored
    r_issue = client.get("/api/issues/ISS-BLACKOUT-LIVE")
    assert r_issue.status_code == 200
    issue_data = r_issue.json()
    print(f"    - Recovered Issue Status: {issue_data['status']}")
    print(f"    - Priority Score: {issue_data.get('priority_score')}")

    print("\n=================================================================")
    print("      BLACKOUT & DATA RESILIENCE LIFECYCLE 100% VERIFIED!        ")
    print("=================================================================")

if __name__ == "__main__":
    verify_blackout_lifecycle()
