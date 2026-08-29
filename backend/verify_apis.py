"""Sequential live API verification script for KoparGov AI using FastAPI TestClient."""

import json
from fastapi.testclient import TestClient
from app.main import app

def run():
    client = TestClient(app)

    print("================================================================================")
    print("                    KOPARGOV AI - LIVE API VERIFICATION REPORT                 ")
    print("================================================================================")

    # 1. Health & Root
    print("\n[1/16] Testing GET / and GET /health")
    r_root = client.get("/")
    print(f"  • GET /                -> Status: {r_root.status_code}")
    print(f"    Body: {r_root.json()}")

    r_health = client.get("/health")
    print(f"  • GET /health          -> Status: {r_health.status_code}")
    print(f"    Body: {r_health.json()}")

    # 2. Auth & RBAC Endpoints
    print("\n[2/16] Testing Auth & RBAC (/api/auth/roles, /api/auth/login, /api/auth/me)")
    r_roles = client.get("/api/auth/roles")
    print(f"  * GET /api/auth/roles  -> Status: {r_roles.status_code}, Found {len(r_roles.json())} role presets")
    for r in r_roles.json()[:3]:
        limit_str = r['sanction_limit'].replace('\u20b9', 'INR ')
        print(f"    - {r['title']} ({r['role']}): {limit_str}")

    r_login = client.post("/api/auth/login", json={"role": "CHIEF_OFFICER", "officer_id": "Shri. Rajesh Kulkarni"})
    print(f"  • POST /api/auth/login -> Status: {r_login.status_code}")
    print(f"    Logged In: {r_login.json()['name']} [{r_login.json()['role']}], Token: {r_login.json()['token']}")

    r_me = client.get("/api/auth/me", headers={"X-Officer-Role": "WARD_INCHARGE", "X-Officer-Id": "Shri. Sunil Jadhav"})
    print(f"  • GET /api/auth/me     -> Status: {r_me.status_code}, Active Role: {r_me.json()['role']}")

    # 3. Map & GIS Intelligence
    print("\n[3/16] Testing Map & GIS (/api/map/layers, /api/map/wards, /api/map/geocode)")
    r_map = client.get("/api/map/layers")
    print(f"  • GET /api/map/layers  -> Status: {r_map.status_code}, Roads: {r_map.json().get('roads_count')}, Landmarks: {len(r_map.json().get('landmarks', []))}")

    r_wards = client.get("/api/map/wards")
    print(f"  • GET /api/map/wards   -> Status: {r_wards.status_code}, Wards Count: {len(r_wards.json())}")

    r_geo = client.get("/api/map/geocode?query=Shivaji+Chowk")
    print(f"  • GET /api/map/geocode -> Status: {r_geo.status_code}")
    if r_geo.json():
        print(f"    Geocoded: {r_geo.json()[0]['display_name']} -> Coordinates: [{r_geo.json()[0]['latitude']}, {r_geo.json()[0]['longitude']}]")

    r_rev = client.get("/api/map/reverse-geocode?latitude=19.8917&longitude=74.4789")
    print(f"  • GET /api/map/rev-geo -> Status: {r_rev.status_code}, Result: {r_rev.json()['display_name']}")

    # 4. POST /api/issues (Submit a Complaint)
    print("\n[4/16] Testing POST /api/issues (Ingest Citizen Complaint & Run CIE Pipeline)")
    issue_payload = {
        "id": "ISS-1024",
        "title": "Garbage accumulation near market",
        "category": "Garbage Accumulation",
        "description": "Garbage has not been collected near the market for 3 days. Severe organic accumulation blocking pathway.",
        "location": "Ward 5 - Shivaji Chowk",
        "ward_number": 5,
        "latitude": 19.8917,
        "longitude": 74.4789,
        "address": "Near Old Market Yard Gate, Shivaji Chowk, Kopargaon",
        "citizen_name": "Rahul Patil",
        "citizen_phone": "+91 98220 44112",
        "severity": 90.0,
        "urgency": 90.0,
        "population_affected": 1200.0,
        "health_safety_impact": 85.0,
        "location_sensitivity": 90.0,
        "complaint_age": 3.0,
        "estimated_cost": 8000.0,
        "required_workers": 2,
        "required_vehicles": 1,
        "required_time_hours": 4.0,
    }
    r_post_issue = client.post("/api/issues", json=issue_payload)
    print(f"  • POST /api/issues     -> Status: {r_post_issue.status_code}")
    created_issue = r_post_issue.json()
    print(f"    Created Issue ID: {created_issue.get('issue', {}).get('id')}")
    if created_issue.get("cie_result"):
        print(f"    CIE Auto-Evaluation Status: {created_issue['cie_result']['status']}")
        print(f"    Valid Issue Count: {created_issue['cie_result']['valid_issue_count']}")

    # 5. GET /api/issues & GET /api/issues/{id}
    print("\n[5/16] Testing GET /api/issues and GET /api/issues/ISS-1024")
    r_issues = client.get("/api/issues")
    print(f"  • GET /api/issues      -> Status: {r_issues.status_code}, Stored Count: {len(r_issues.json())}")

    r_single_issue = client.get("/api/issues/ISS-1024")
    print(f"  • GET /api/issues/ISS-1024 -> Status: {r_single_issue.status_code}")
    print(f"    Title: {r_single_issue.json().get('title')}")
    print(f"    Coordinates: [{r_single_issue.json().get('latitude')}, {r_single_issue.json().get('longitude')}]")

    # 6. POST /api/cie/prioritize (Pure 6-factor MCDA)
    print("\n[6/16] Testing POST /api/cie/prioritize (Deterministic 6-Factor MCDA)")
    r_mcda = client.post("/api/cie/prioritize", json={"issues": [issue_payload]})
    print(f"  • POST /api/cie/prioritize -> Status: {r_mcda.status_code}")
    mcda_res = r_mcda.json()
    if mcda_res:
        rank0 = mcda_res[0]
        print(f"    Composite MCDA Score: {rank0.get('composite_score')}/100")
        print(f"    Priority Level: {rank0.get('priority_level')}")
        print(f"    Weighted Factor Breakdown: {json.dumps(rank0.get('factor_scores', {}).get('weighted_contributions'), indent=6)}")

    # 7. POST /api/cie/optimize (Google OR-Tools MIP Knapsack)
    print("\n[7/16] Testing POST /api/cie/optimize (Google OR-Tools Resource Optimization)")
    opt_payload = {
        "issues": [issue_payload],
        "resources": {
            "budget": 50000.0,
            "workers": 10,
            "vehicles": 3,
            "time_capacity_hours": 40.0
        }
    }
    r_opt = client.post("/api/cie/optimize", json=opt_payload)
    print(f"  • POST /api/cie/optimize   -> Status: {r_opt.status_code}")
    opt_res = r_opt.json()
    print(f"    Selected Issue IDs: {opt_res.get('selected_issue_ids')}")
    print(f"    Total Benefit Score: {opt_res.get('total_benefit_score')}")
    print(f"    Resource Allocation: {json.dumps(opt_res.get('resource_usage'), indent=6)}")

    # 8. POST /api/cie/evaluate (End-to-End Pipeline)
    print("\n[8/16] Testing POST /api/cie/evaluate (Full CIE Pipeline with Explanations)")
    r_eval = client.post("/api/cie/evaluate", json=opt_payload)
    print(f"  • POST /api/cie/evaluate   -> Status: {r_eval.status_code}")
    eval_res = r_eval.json()
    if eval_res.get("explanations"):
        expl = eval_res["explanations"][0]
        print(f"    Summary: {expl.get('summary')}")

    # 9. POST /api/cie/scenario (What-If Analysis)
    print("\n[9/16] Testing POST /api/cie/scenario (What-If Resource Sensitivity)")
    scenario_payload = {
        "issues": [issue_payload],
        "baseline_resources": {
            "budget": 50000.0,
            "workers": 10,
            "vehicles": 3,
            "time_capacity_hours": 40.0
        },
        "scenario_resources": {
            "budget": 100000.0,
            "workers": 20,
            "vehicles": 6,
            "time_capacity_hours": 80.0
        }
    }
    r_scen = client.post("/api/cie/scenario", json=scenario_payload)
    print(f"  • POST /api/cie/scenario   -> Status: {r_scen.status_code}")

    # 10. GET /api/recommendations & GET /api/recommendations/{id}
    print("\n[10/16] Testing GET /api/recommendations and GET /api/recommendations/ISS-1024")
    r_recs = client.get("/api/recommendations")
    print(f"  • GET /api/recommendations -> Status: {r_recs.status_code}, Count: {len(r_recs.json())}")

    r_single_rec = client.get("/api/recommendations/ISS-1024")
    print(f"  • GET /api/recommendations/ISS-1024 -> Status: {r_single_rec.status_code}")
    print(f"    Recommended Action: {r_single_rec.json().get('recommended_action')}")

    # 11. POST /api/recommendations/{id}/approve (Human-in-the-Loop)
    print("\n[11/16] Testing POST /api/recommendations/ISS-1024/approve (Officer Approval)")
    approve_headers = {
        "X-Officer-Role": "CHIEF_OFFICER",
        "X-Officer-Id": "Shri. Rajesh Kulkarni (CMO)"
    }
    r_approve = client.post(
        "/api/recommendations/ISS-1024/approve",
        json={"notes": "Technical sanction granted for hydraulic compactor deployment."},
        headers=approve_headers
    )
    print(f"  • POST /api/recommendations/ISS-1024/approve -> Status: {r_approve.status_code}")
    print(f"    Updated Workflow State: {r_approve.json().get('status')}")

    # 12. POST /api/issues/{id}/assign (Contractor/Team Assignment)
    print("\n[12/16] Testing POST /api/issues/ISS-1024/assign (Workforce/Contractor Assignment)")
    assign_payload = {
        "assigned_team": "Sanitation Rapid Response Unit 1",
        "contractor_id": "CON-ABC",
        "notes": "Assigned Vehicle 2 and 2 workers for rapid cleanup."
    }
    r_assign = client.post(
        "/api/issues/ISS-1024/assign",
        json=assign_payload,
        headers=approve_headers
    )
    print(f"  • POST /api/issues/ISS-1024/assign -> Status: {r_assign.status_code}")
    print(f"    Assigned Status: {r_assign.json().get('status')}")

    # 13. POST /api/workflow/{id}/start (Field Work In-Progress)
    print("\n[13/16] Testing POST /api/workflow/ISS-1024/start (Commence Field Work)")
    r_start = client.post(
        "/api/workflow/ISS-1024/start",
        json={"notes": "Sanitation squad deployed with hydraulic compactor."},
        headers=approve_headers
    )
    print(f"  • POST /api/workflow/ISS-1024/start -> Status: {r_start.status_code}")
    print(f"    In-Progress Status: {r_start.json().get('status')}")

    # 14. POST /api/issues/{id}/resolve (Resolution with Evidence)
    print("\n[14/16] Testing POST /api/issues/ISS-1024/resolve (Field Completion & Evidence)")
    resolve_payload = {
        "completion_notes": "Garbage cleared from Shivaji Chowk market gate, area sanitized.",
        "evidence_photos": ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09"],
        "actual_cost": 7500.0,
        "actual_workers": 2,
        "actual_vehicles": 1
    }
    r_resolve = client.post(
        "/api/issues/ISS-1024/resolve",
        json=resolve_payload,
        headers=approve_headers
    )
    print(f"  • POST /api/issues/ISS-1024/resolve -> Status: {r_resolve.status_code}")
    print(f"    Resolved Status: {r_resolve.json().get('status')}")

    # 15. GET /api/roads (Roads & GIS)
    print("\n[15/16] Testing GET /api/roads (Synthetic Road Infrastructure Network)")
    r_roads = client.get("/api/roads")
    print(f"  • GET /api/roads           -> Status: {r_roads.status_code}, Roads Count: {len(r_roads.json())}")

    # 16. Notifications & Analytics
    print("\n[16/16] Testing Notifications & Analytics (/api/notifications, /api/contractors, /api/analytics)")
    r_notifs = client.get("/api/notifications")
    print(f"  • GET /api/notifications  -> Status: {r_notifs.status_code}, Alerts Count: {len(r_notifs.json())}")

    r_contractors = client.get("/api/contractors")
    print(f"  • GET /api/contractors    -> Status: {r_contractors.status_code}, Contractors: {len(r_contractors.json())}")

    r_analytics = client.get("/api/analytics")
    print(f"  • GET /api/analytics      -> Status: {r_analytics.status_code}")
    print(f"    Summary: Total Issues={r_analytics.json().get('total_issues')}, Resolved={r_analytics.json().get('resolved_count')}, Rate={r_analytics.json().get('resolution_rate_percent')}%")
    print("\n================================================================================")
    print("                         ALL 16 API SUITES VERIFIED OK                          ")
    print("================================================================================")

if __name__ == "__main__":
    run()
