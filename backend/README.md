# KoparGov AI - Civic Intelligence Engine (CIE)

Decision-support intelligence engine for municipal authorities to prioritize civic issues, optimize resource allocation, and provide transparent explanations for recommendations.

## Deterministic MCDA Priority Engine

MCDA is deterministic multi-criteria decision analysis, **not machine learning**.

### Formula
$$\text{Priority Score} = 0.25 \times \text{Severity} + 0.20 \times \text{Urgency} + 0.20 \times \text{Population Affected} + 0.15 \times \text{Health/Safety Impact} + 0.10 \times \text{Location Sensitivity} + 0.10 \times \text{Complaint Age}$$

Every factor is strictly normalized to a `0–100` scale before weighting.

### Normalization Methodology
1. **Direct Factors (`0–100`)**:
   - `severity`, `urgency`, `health_safety_impact`, `location_sensitivity`
   - Inputs are validated strictly within the `[0.0, 100.0]` range.
   - Normalized score = raw input value.

2. **Population Affected (Raw Count)**:
   - Raw number of people affected ($\ge 0$). Never treated directly as a 0–100 score.
   - **Batch Normalization**: $\text{Normalized Population} = \left(\frac{\text{population}}{\text{maximum population in batch}}\right) \times 100$
   - If the maximum population in a batch is $\le 0$, an explicit validation error is raised rather than inventing data.
   - **Single Issue Evaluation**: Requires an explicit positive reference maximum (`max_population_ref`).

3. **Complaint Age (Days)**:
   - Number of days since complaint was filed ($\ge 0$).
   - **Batch Normalization**: $\text{Normalized Age} = \left(\frac{\text{age in days}}{\text{maximum age in batch}}\right) \times 100$
   - If the maximum complaint age in a batch is 0 (all genuine zero-day complaints), normalized age is 0 for all issues.
   - **Single Issue Evaluation**: Normalized against a positive reference maximum (`max_age_ref`) or 0 if age is 0.

### Priority Classification Tiers
- `0–39`: **LOW**
- `40–59`: **MEDIUM**
- `60–79`: **HIGH**
- `80–100`: **CRITICAL**

### Auditability
Every evaluation exposes:
1. `normalized_*` score for each factor.
2. `factor_weights` assigned to each factor.
3. `weighted_contributions` ($w_i \times x_i$).
4. `composite_score` satisfying $\sum \text{weighted\_contributions} = \text{composite\_score}$.
5. `priority_level` classification.

## Directory Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── civic_issue.py
│   │   ├── resources.py
│   │   └── decision.py
│   └── core/
│       ├── __init__.py
│       ├── validator.py
│       ├── mcda.py
│       ├── optimizer.py
│       └── explainer.py
├── tests/
│   ├── __init__.py
│   └── test_mcda.py
├── requirements.txt
└── README.md
```
