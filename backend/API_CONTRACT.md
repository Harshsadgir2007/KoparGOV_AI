# KoparGov AI — REST API Contract & Integration Guide

This document defines the complete REST API interface for frontend developers integrating with the **KoparGov AI Civic Intelligence Engine (CIE)** backend service.

---

## 1. Global Concepts & Core Architectural Distinctions

### MCDA Priority vs. OR-Tools Resource Allocation

Understanding the difference between **Civic Priority** and **Resource Allocation** is essential for frontend UI/UX presentation:

```
┌─────────────────────────────────────────────────────────┐
│                     CIVIC ISSUES                        │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│               MCDA Priority Engine (0–100)              │
│  - Evaluates intrinsic public urgency & impact          │
│  - Weights: Severity (25%), Urgency (20%),              │
│    Population (20%), Health Risk (15%),                 │
│    Location Sensitivity (10%), Complaint Age (10%)      │
│  - DOES NOT CHANGE when municipal budget/resources shift│
└────────────────────────────┬────────────────────────────┘
                             │ (Fixed Priority Scores)
                             ▼
┌─────────────────────────────────────────────────────────┐
│              OR-Tools Resource Optimizer                │
│  - Constraint MIP Solver (Budget, Workers, Fleet, Time) │
│  - Selects feasible subset maximizing total benefit     │
│  - DOES CHANGE when municipal resource limits shift     │
└────────────────────────────┬────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
       RECOMMENDED / SELECTED        DEFERRED (Constrained)
```

- **MCDA Priority Score (`composite_score`)**: A deterministic value from `0.0` to `100.0` measuring intrinsic civic importance based strictly on the 6 weighted criteria.
- **Priority Level (`priority_level`)**: Categorical tier assigned based on the composite score:
  - `CRITICAL`: 80.0 – 100.0
  - `HIGH`: 60.0 – 79.99
  - `MEDIUM`: 40.0 – 59.99
  - `LOW`: 0.0 – 39.99
- **Selected Issue (`selected_issue_ids` / `RECOMMENDED`)**: An issue recommended for immediate municipal action because it fits within available budget, workforce, vehicle, and time capacities while maximizing aggregate civic benefit.
- **Deferred Issue (`deferred_issue_ids` / `DEFERRED`)**: An issue that cannot be accommodated within the current resource envelope. **Important**: A `CRITICAL` priority issue may be `DEFERRED` if its cost or workforce requirements exceed available capacity.
- **What-If Scenario Invariance**: When running scenario comparisons, **MCDA priority scores remain 100% invariant**. Only the resource constraints change, shifting the subset of selected vs. deferred actions.
- **Benefit Delta (`benefit_delta`)**: Numerical change in aggregate public benefit score between baseline and hypothetical scenario resource envelopes (`scenario_benefit - baseline_benefit`).
- **Newly Selected Issues (`newly_selected_issue_ids`)**: Issues deferred under baseline constraints but enabled under scenario constraints due to expanded capacity.
- **Newly Deferred Issues (`newly_deferred_issue_ids`)**: Issues selected under baseline constraints but dropped under scenario constraints due to reduced capacity.

---

## 2. Base Configuration & CORS

- **Base URL**: `http://localhost:8000` (development) or configured domain
- **Content-Type**: `application/json`
- **CORS Allowed Origins**:
  - `http://localhost:3000` (React / Next.js default)
  - `http://127.0.0.1:3000`
  - `http://localhost:5173` (Vite default)
  - `http://127.0.0.1:5173`
  - `http://localhost:8000`
  - `http://127.0.0.1:8000`
  - `http://localhost:4173` (Vite preview)
  - `http://127.0.0.1:4173`
- **Supported Methods**: `GET`, `POST`, `OPTIONS`
- **Credentials**: `true`

---

## 3. Endpoints Specification

---

### Endpoint 1: Root Metadata

**Method & URL**: `GET /`

**Purpose**: Verifies backend accessibility and returns core component identity.

#### Successful Response (`200 OK`)
```json
{
  "service": "KoparGov AI",
  "component": "Civic Intelligence Engine",
  "status": "running"
}
```

---

### Endpoint 2: Health Check

**Method & URL**: `GET /health`

**Purpose**: Liveness probe for monitoring and status indicators.

#### Successful Response (`200 OK`)
```json
{
  "status": "ok",
  "service": "KoparGov CIE"
}
```

---

### Endpoint 3: End-to-End CIE Evaluation

**Method & URL**: `POST /api/cie/evaluate`

**Purpose**: Evaluates a batch of civic complaints against municipal resource constraints. Executes Data Validation → Deterministic MCDA Prioritization → OR-Tools Resource Optimization → Rule-Based Explainability → Automatic Persistence.

#### Request Schema & Fields

| Field | Type | Required | Range / Format | Description |
|---|---|---|---|---|
| `issues` | `Array<CivicIssue>` | Yes | Non-empty recommended | List of civic issues to evaluate |
| `issues[].id` | `string` | **Yes** | Unique string (e.g. `"ISSUE-001"`) | Unique identifier for issue |
| `issues[].title` | `string` | No | Text | Short title of the issue |
| `issues[].category` | `string` | No | Text | Department/category (e.g. `"Roads"`, `"Water"`) |
| `issues[].description` | `string` | No | Text | Detailed description |
| `issues[].location` | `string` | No | Text | Ward / Area name |
| `issues[].latitude` | `number` | No | `-90.0` to `90.0` | Geographic latitude |
| `issues[].longitude` | `number` | No | `-180.0` to `180.0` | Geographic longitude |
| `issues[].severity` | `number` | **Yes (MCDA)** | `0.0` to `100.0` | Severity rating |
| `issues[].urgency` | `number` | **Yes (MCDA)** | `0.0` to `100.0` | Urgency rating |
| `issues[].population_affected` | `number` | **Yes (MCDA)** | `≥ 0.0` | Impacted citizen count |
| `issues[].health_safety_impact` | `number` | **Yes (MCDA)** | `0.0` to `100.0` | Public safety / health risk |
| `issues[].location_sensitivity` | `number` | **Yes (MCDA)** | `0.0` to `100.0` | Location sensitivity (schools, hospitals) |
| `issues[].complaint_age` | `number` | **Yes (MCDA)** | `≥ 0.0` | Age of ticket in days or scale |
| `issues[].estimated_cost` | `number` | No (Opt) | `≥ 0.0` | Cost required to resolve in ₹ |
| `issues[].required_workers` | `integer` | No (Opt) | `≥ 0` | Personnel count needed |
| `issues[].required_vehicles` | `integer` | No (Opt) | `≥ 0` | Municipal vehicles/trucks needed |
| `issues[].required_time_hours` | `number` | No (Opt) | `≥ 0.0` | Estimated repair duration in hours |
| `resources` | `MunicipalResources` | **Yes** | Object | Municipal resource limits |
| `resources.budget` | `number` | **Yes** | `≥ 0.0` | Total available municipal budget in ₹ |
| `resources.workers` | `integer` | **Yes** | `≥ 0` | Available municipal personnel count |
| `resources.vehicles` | `integer` | **Yes** | `≥ 0` | Available municipal fleet count |
| `resources.time_capacity_hours` | `number` | No | `≥ 0.0` | Available work-hours capacity window |

#### Example Request
```json
{
  "issues": [
    {
      "id": "ISSUE-101",
      "title": "Main Water Pipe Rupture",
      "category": "Water Supply",
      "severity": 90.0,
      "urgency": 90.0,
      "population_affected": 800.0,
      "health_safety_impact": 85.0,
      "location_sensitivity": 90.0,
      "complaint_age": 20.0,
      "estimated_cost": 25000.0,
      "required_workers": 4,
      "required_vehicles": 1,
      "required_time_hours": 8.0
    },
    {
      "id": "ISSUE-102",
      "title": "Pothole Cluster near Station",
      "category": "Roads",
      "severity": 65.0,
      "urgency": 60.0,
      "population_affected": 300.0,
      "health_safety_impact": 50.0,
      "location_sensitivity": 60.0,
      "complaint_age": 10.0,
      "estimated_cost": 10000.0,
      "required_workers": 2,
      "required_vehicles": 1,
      "required_time_hours": 4.0
    }
  ],
  "resources": {
    "budget": 30000.0,
    "workers": 5,
    "vehicles": 1,
    "time_capacity_hours": 24.0
  }
}
```

#### Successful Response (`200 OK`)
```json
{
  "validation_reports": [
    {
      "issue_id": "ISSUE-101",
      "is_valid": true,
      "status": "VALID",
      "missing_fields": [],
      "validation_errors": []
    },
    {
      "issue_id": "ISSUE-102",
      "is_valid": true,
      "status": "VALID",
      "missing_fields": [],
      "validation_errors": []
    }
  ],
  "valid_issue_count": 2,
  "flagged_issue_count": 0,
  "mcda_rankings": [
    {
      "issue_id": "ISSUE-101",
      "composite_score": 88.25,
      "priority_level": "CRITICAL",
      "factor_scores": {
        "normalized_severity": 90.0,
        "normalized_urgency": 90.0,
        "normalized_population_affected": 100.0,
        "normalized_health_safety_impact": 85.0,
        "normalized_location_sensitivity": 90.0,
        "normalized_complaint_age": 100.0,
        "factor_weights": {
          "severity": 0.25,
          "urgency": 0.20,
          "population_affected": 0.20,
          "health_safety_impact": 0.15,
          "location_sensitivity": 0.10,
          "complaint_age": 0.10
        },
        "weighted_contributions": {
          "severity": 22.5,
          "urgency": 18.0,
          "population_affected": 20.0,
          "health_safety_impact": 12.75,
          "location_sensitivity": 9.0,
          "complaint_age": 10.0
        }
      },
      "rank": 1
    },
    {
      "issue_id": "ISSUE-102",
      "composite_score": 58.75,
      "priority_level": "MEDIUM",
      "factor_scores": {
        "normalized_severity": 65.0,
        "normalized_urgency": 60.0,
        "normalized_population_affected": 37.5,
        "normalized_health_safety_impact": 50.0,
        "normalized_location_sensitivity": 60.0,
        "normalized_complaint_age": 50.0,
        "factor_weights": { ... },
        "weighted_contributions": { ... }
      },
      "rank": 2
    }
  ],
  "allocation_plan": {
    "selected_issue_ids": [
      "ISSUE-101"
    ],
    "deferred_issue_ids": [
      "ISSUE-102"
    ],
    "total_benefit_score": 88.25,
    "resource_usage": {
      "allocated_budget": 25000.0,
      "allocated_workers": 4,
      "allocated_vehicles": 1,
      "allocated_time_hours": 8.0,
      "remaining_budget": 5000.0,
      "remaining_workers": 1,
      "remaining_vehicles": 0,
      "remaining_time_hours": 16.0
    }
  },
  "explanations": [
    {
      "issue_id": "ISSUE-101",
      "priority_level": "CRITICAL",
      "composite_score": 88.25,
      "top_contributing_factors": [
        {
          "factor": "severity",
          "normalized_score": 90.0,
          "weight": 0.25,
          "weighted_contribution": 22.5
        },
        {
          "factor": "population_affected",
          "normalized_score": 100.0,
          "weight": 0.20,
          "weighted_contribution": 20.0
        }
      ],
      "resource_requirements": {
        "estimated_cost": 25000.0,
        "required_workers": 4.0,
        "required_vehicles": 1.0,
        "required_time_hours": 8.0
      },
      "recommendation_status": "RECOMMENDED",
      "reasons": [
        "Severity contributed 22.50 points to the priority score.",
        "Population affected contributed 20.00 points to the priority score.",
        "Urgency contributed 18.00 points to the priority score.",
        "Health and safety impact contributed 12.75 points to the priority score.",
        "Complaint age contributed 10.00 points to the priority score.",
        "Location sensitivity contributed 9.00 points to the priority score."
      ],
      "is_recommended_for_allocation": true,
      "allocation_rationale": "Selected for immediate action by resource-constrained optimization: part of the feasible allocation that maximizes total MCDA priority benefit within available municipal budget, workforce, fleet, and time capacity.",
      "summary": "Issue ISSUE-101 evaluated as CRITICAL priority (composite score: 88.25). Top driver: Severity (22.50 pts). Status: RECOMMENDED for immediate action."
    },
    {
      "issue_id": "ISSUE-102",
      "priority_level": "MEDIUM",
      "composite_score": 58.75,
      "top_contributing_factors": [ ... ],
      "resource_requirements": {
        "estimated_cost": 10000.0,
        "required_workers": 2.0,
        "required_vehicles": 1.0,
        "required_time_hours": 4.0
      },
      "recommendation_status": "DEFERRED",
      "reasons": [
        "Severity contributed 16.25 points to the priority score.",
        "Urgency contributed 12.00 points to the priority score.",
        "Deferred by optimization allocation due to municipal resource constraints (budget, workforce, fleet, or time limits)."
      ],
      "is_recommended_for_allocation": false,
      "allocation_rationale": "Deferred by resource-constrained optimization due to municipal resource constraints...",
      "summary": "Issue ISSUE-102 evaluated as MEDIUM priority (composite score: 58.75). Top driver: Severity (16.25 pts). Status: DEFERRED (resource constraints)."
    }
  ],
  "status": "SUCCESS"
}
```

#### Error Responses
- **`400 Bad Request`**: Duplicate issue IDs detected in request payload.
  ```json
  { "detail": "Duplicate issue ID found in input: 'ISSUE-101'." }
  ```
- **`422 Unprocessable Entity`**: Malformed JSON or negative resource/factor values.
  ```json
  { "detail": [ { "loc": ["body", "resources", "workers"], "msg": "Input should be greater than or equal to 0" } ] }
  ```
- **`500 Internal Server Error`**: Unexpected solver or server failure.

---

### Endpoint 4: What-If Scenario Simulation

**Method & URL**: `POST /api/cie/scenario`

**Purpose**: Compares optimal allocations between a **Baseline** and a **Hypothetical Scenario** resource envelope while strictly preserving MCDA score invariance.

#### Request Schema & Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `issues` | `Array<CivicIssue>` | Yes | Batch of civic issues |
| `baseline_resources` | `MunicipalResources` | Yes | Existing baseline constraints |
| `scenario_resources` | `MunicipalResources` | Yes | Modified scenario constraints |

#### Example Request
```json
{
  "issues": [
    {
      "id": "ISSUE-101",
      "severity": 90.0,
      "urgency": 90.0,
      "population_affected": 800.0,
      "health_safety_impact": 85.0,
      "location_sensitivity": 90.0,
      "complaint_age": 20.0,
      "estimated_cost": 25000.0,
      "required_workers": 4,
      "required_vehicles": 1,
      "required_time_hours": 8.0
    },
    {
      "id": "ISSUE-102",
      "severity": 75.0,
      "urgency": 70.0,
      "population_affected": 500.0,
      "health_safety_impact": 60.0,
      "location_sensitivity": 75.0,
      "complaint_age": 15.0,
      "estimated_cost": 15000.0,
      "required_workers": 3,
      "required_vehicles": 1,
      "required_time_hours": 6.0
    },
    {
      "id": "ISSUE-103",
      "severity": 65.0,
      "urgency": 60.0,
      "population_affected": 300.0,
      "health_safety_impact": 50.0,
      "location_sensitivity": 60.0,
      "complaint_age": 10.0,
      "estimated_cost": 10000.0,
      "required_workers": 2,
      "required_vehicles": 1,
      "required_time_hours": 4.0
    }
  ],
  "baseline_resources": {
    "budget": 50000.0,
    "workers": 10,
    "vehicles": 3,
    "time_capacity_hours": 24.0
  },
  "scenario_resources": {
    "budget": 30000.0,
    "workers": 6,
    "vehicles": 1,
    "time_capacity_hours": 24.0
  }
}
```

#### Successful Response (`200 OK`)
```json
{
  "mcda_rankings": [
    { "issue_id": "ISSUE-101", "composite_score": 88.25, "priority_level": "CRITICAL", "rank": 1 },
    { "issue_id": "ISSUE-102", "composite_score": 71.00, "priority_level": "HIGH", "rank": 2 },
    { "issue_id": "ISSUE-103", "composite_score": 61.50, "priority_level": "HIGH", "rank": 3 }
  ],
  "baseline_plan": {
    "selected_issue_ids": ["ISSUE-101", "ISSUE-102", "ISSUE-103"],
    "deferred_issue_ids": [],
    "total_benefit_score": 220.75,
    "resource_usage": {
      "allocated_budget": 50000.0,
      "allocated_workers": 9,
      "allocated_vehicles": 3,
      "allocated_time_hours": 18.0,
      "remaining_budget": 0.0,
      "remaining_workers": 1,
      "remaining_vehicles": 0,
      "remaining_time_hours": 6.0
    }
  },
  "scenario_plan": {
    "selected_issue_ids": ["ISSUE-101"],
    "deferred_issue_ids": ["ISSUE-102", "ISSUE-103"],
    "total_benefit_score": 88.25,
    "resource_usage": {
      "allocated_budget": 25000.0,
      "allocated_workers": 4,
      "allocated_vehicles": 1,
      "allocated_time_hours": 8.0,
      "remaining_budget": 5000.0,
      "remaining_workers": 2,
      "remaining_vehicles": 0,
      "remaining_time_hours": 16.0
    }
  },
  "allocation_diff": {
    "newly_selected_issue_ids": [],
    "newly_deferred_issue_ids": ["ISSUE-102", "ISSUE-103"],
    "unchanged_selected_issue_ids": ["ISSUE-101"],
    "unchanged_deferred_issue_ids": [],
    "unchanged_issue_ids": ["ISSUE-101"]
  },
  "impact_comparison": {
    "baseline_total_benefit": 220.75,
    "scenario_total_benefit": 88.25,
    "benefit_delta": -132.50,
    "baseline_selected_count": 3,
    "scenario_selected_count": 1,
    "selected_count_delta": -2
  },
  "resource_delta": {
    "budget_delta": -20000.0,
    "workers_delta": -4,
    "vehicles_delta": -2,
    "time_capacity_hours_delta": 0.0
  },
  "explanations": [
    "Resource constraints changed: Budget: ₹50,000.00 → ₹30,000.00 (Δ -20,000.00); Workers: 10 → 6 (Δ -4); Vehicles: 3 → 1 (Δ -2); Time Capacity: 24.0h → 24.0h (Δ +0.0h).",
    "Total public benefit score changed from 220.75 to 88.25 (Δ -132.50). Selected issues changed from 3 to 1 (Δ -2).",
    "Issue 'ISSUE-102' (HIGH priority, score: 71.00) was selected under baseline but deferred under scenario constraints because available capacity could no longer support all actions.",
    "Issue 'ISSUE-103' (HIGH priority, score: 61.50) was selected under baseline but deferred under scenario constraints because available capacity could no longer support all actions.",
    "Underlying MCDA priority scores and rankings remained strictly unchanged; only resource-constrained optimal selection was recomputed."
  ],
  "status": "SUCCESS"
}
```

---

### Endpoint 5: Get Issue Workflow State

**Method & URL**: `GET /api/workflow/{issue_id}`

**Purpose**: Retrieves current lifecycle state, officer assignment, and timestamps for an issue.

#### Successful Response (`200 OK`)
```json
{
  "issue_id": "ISSUE-101",
  "status": "PENDING",
  "officer_id": null,
  "assigned_team": null,
  "rejection_reason": null,
  "resolution_notes": null,
  "notes": null,
  "approved_at": null,
  "resolved_at": null,
  "updated_at": "2026-08-29T12:00:00.000000+00:00"
}
```

#### Error Responses
- **`404 Not Found`**: Issue ID does not exist in database.

---

### Endpoint 6: Approve Issue

**Method & URL**: `POST /api/workflow/{issue_id}/approve`

**Rule**: Allowed only when current state is `PENDING` or `RECOMMENDED`. (`DEFERRED → APPROVED` is rejected).

#### Request Body
```json
{
  "officer_id": "OFFICER-42",
  "notes": "Approved for emergency mobilization."
}
```

#### Successful Response (`200 OK`)
```json
{
  "issue_id": "ISSUE-101",
  "status": "APPROVED",
  "officer_id": "OFFICER-42",
  "notes": "Approved for emergency mobilization.",
  "approved_at": "2026-08-29T12:05:00.000000+00:00",
  "updated_at": "2026-08-29T12:05:00.000000+00:00"
}
```

#### Error Responses
- **`400 Bad Request`**: Attempting to approve an issue in `DEFERRED`, `ASSIGNED`, `RESOLVED`, or `REJECTED` status.

---

### Endpoint 7: Reject Issue

**Method & URL**: `POST /api/workflow/{issue_id}/reject`

**Rule**: Allowed only when current state is `PENDING` or `RECOMMENDED`.

#### Request Body
```json
{
  "officer_id": "OFFICER-42",
  "reason": "Duplicate ticket of existing maintenance ticket #4401."
}
```

#### Successful Response (`200 OK`)
```json
{
  "issue_id": "ISSUE-102",
  "status": "REJECTED",
  "officer_id": "OFFICER-42",
  "rejection_reason": "Duplicate ticket of existing maintenance ticket #4401.",
  "updated_at": "2026-08-29T12:06:00.000000+00:00"
}
```

---

### Endpoint 8: Assign Approved Issue to Response Team

**Method & URL**: `POST /api/workflow/{issue_id}/assign`

**Rule**: Allowed only when current state is `APPROVED` or `ASSIGNED` (reassignment).

#### Request Body
```json
{
  "assigned_team": "Water Pipeline Response Unit 3",
  "officer_id": "OFFICER-42",
  "notes": "Urgent: bring replacement coupling 150mm."
}
```

#### Successful Response (`200 OK`)
```json
{
  "issue_id": "ISSUE-101",
  "status": "ASSIGNED",
  "assigned_team": "Water Pipeline Response Unit 3",
  "officer_id": "OFFICER-42",
  "notes": "Urgent: bring replacement coupling 150mm.",
  "updated_at": "2026-08-29T12:10:00.000000+00:00"
}
```

---

### Endpoint 9: Start Field Work

**Method & URL**: `POST /api/workflow/{issue_id}/start`

**Rule**: Allowed only when current state is `ASSIGNED`.

#### Request Body (Optional)
```json
{
  "officer_id": "TEAM-LEAD-07",
  "notes": "Excavation begun on site."
}
```

#### Successful Response (`200 OK`)
```json
{
  "issue_id": "ISSUE-101",
  "status": "IN_PROGRESS",
  "officer_id": "TEAM-LEAD-07",
  "notes": "Excavation begun on site.",
  "updated_at": "2026-08-29T12:30:00.000000+00:00"
}
```

---

### Endpoint 10: Resolve Issue

**Method & URL**: `POST /api/workflow/{issue_id}/resolve`

**Rule**: Allowed only when current state is `IN_PROGRESS`.

#### Request Body (Optional)
```json
{
  "officer_id": "INSPECTOR-14",
  "resolution_notes": "Pipe replaced, pressure tested at 6 bar, asphalt restored."
}
```

#### Successful Response (`200 OK`)
```json
{
  "issue_id": "ISSUE-101",
  "status": "RESOLVED",
  "officer_id": "INSPECTOR-14",
  "resolution_notes": "Pipe replaced, pressure tested at 6 bar, asphalt restored.",
  "resolved_at": "2026-08-29T14:15:00.000000+00:00",
  "updated_at": "2026-08-29T14:15:00.000000+00:00"
}
```

---

## 4. Frontend Integration Checklist

- [x] **Display MCDA breakdown**: Use `mcda_rankings[].factor_scores.weighted_contributions` to render radar charts or factor contribution breakdown bars.
- [x] **Show Recommendation Badges**: Use `explanations[].recommendation_status` (`RECOMMENDED` in green, `DEFERRED` in amber/neutral).
- [x] **Render Transparent Reasons**: Use `explanations[].reasons` and `explanations[].allocation_rationale` in detailed issue drawers.
- [x] **Resource Utilization Meters**: Use `allocation_plan.resource_usage` (`allocated_budget` vs `remaining_budget`, `allocated_workers` vs `remaining_workers`, `allocated_vehicles` vs `remaining_vehicles`).
- [x] **What-If Scenario Sliders**: Connect budget/worker/vehicle range sliders to `POST /api/cie/scenario` to show dynamic changes in selected issues and total public benefit score.
