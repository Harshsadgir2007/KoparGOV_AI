"""Deterministic Multi-Criteria Decision Analysis (MCDA) Priority Engine.

Rules:
- MCDA is deterministic decision analysis, NOT machine learning.
- All factors are normalized to a 0–100 scale before applying weights.
- Factor Weights:
    - Severity: 25% (0.25)
    - Urgency: 20% (0.20)
    - Population affected: 20% (0.20)
    - Health/Safety impact: 15% (0.15)
    - Location sensitivity: 10% (0.10)
    - Complaint age: 10% (0.10)
- Normalization Logic:
    - Severity, Urgency, Health/Safety impact, Location sensitivity:
      Direct 0–100 input range; validated strictly within [0, 100].
    - Population affected:
      Raw population count (>= 0).
      In batch evaluation: normalized_population = (population / max_population_in_batch) * 100.
      If max population in batch is <= 0, an explicit ValueError is raised (no invented values).
      In single issue evaluation: requires a positive max_population_ref.
    - Complaint age:
      Complaint age in days (>= 0).
      In batch evaluation: normalized_age = (age_days / max_age_in_batch) * 100.
      If max age in batch is 0 (all genuine zeros), normalized age is 0 for all.
      In single issue evaluation: normalized using max_age_ref or 0 if age is 0.
- Priority Classification:
    - 0–39   -> LOW
    - 40–59  -> MEDIUM
    - 60–79  -> HIGH
    - 80–100 -> CRITICAL
"""

from typing import Dict, List, Optional
from app.config import MCDAWeightsConfig, PriorityThresholdsConfig, settings
from app.models.civic_issue import CivicIssue, PriorityLevel
from app.models.decision import MCDAFactorScores, MCDAScoreResult


class MCDAEngine:
    """Deterministic MCDA scoring, factor weighting, and priority classification engine."""

    def __init__(
        self,
        weights: Optional[MCDAWeightsConfig] = None,
        thresholds: Optional[PriorityThresholdsConfig] = None,
    ):
        self.weights = weights or settings.mcda_weights
        self.thresholds = thresholds or settings.priority_thresholds

    def get_factor_weights_dict(self) -> Dict[str, float]:
        """Return the dictionary of configured MCDA weights."""
        return {
            "severity": self.weights.severity,
            "urgency": self.weights.urgency,
            "population_affected": self.weights.population_affected,
            "health_safety_impact": self.weights.health_safety_impact,
            "location_sensitivity": self.weights.location_sensitivity,
            "complaint_age": self.weights.complaint_age,
        }

    def _validate_direct_factor(self, value: Optional[float], field_name: str) -> float:
        """Validate that direct factor inputs are within the [0, 100] range."""
        if value is None:
            raise ValueError(f"Missing required MCDA factor: '{field_name}'. Value cannot be None.")
        val_float = float(value)
        if val_float < 0.0 or val_float > 100.0:
            raise ValueError(
                f"Invalid value for '{field_name}': {val_float}. Must be between 0.0 and 100.0."
            )
        return val_float

    def normalize_single_issue_factors(
        self,
        issue: CivicIssue,
        max_population_ref: Optional[float] = None,
        max_age_ref: Optional[float] = None,
    ) -> MCDAFactorScores:
        """Normalize factors for an individual issue given reference maximums.
        
        Args:
            issue: CivicIssue with factor values.
            max_population_ref: Reference maximum population for normalization.
            max_age_ref: Reference maximum complaint age in days.
        """
        # Validate direct 0-100 factors
        norm_severity = self._validate_direct_factor(issue.severity, "severity")
        norm_urgency = self._validate_direct_factor(issue.urgency, "urgency")
        norm_health_safety = self._validate_direct_factor(
            issue.health_safety_impact, "health_safety_impact"
        )
        norm_location = self._validate_direct_factor(
            issue.location_sensitivity, "location_sensitivity"
        )

        # Validate and normalize population_affected
        if issue.population_affected is None:
            raise ValueError("Missing required MCDA factor: 'population_affected'. Value cannot be None.")
        raw_pop = float(issue.population_affected)
        if raw_pop < 0.0:
            raise ValueError(f"Invalid 'population_affected': {raw_pop}. Cannot be negative.")

        if max_population_ref is not None:
            if max_population_ref <= 0.0:
                raise ValueError(
                    f"Invalid 'max_population_ref': {max_population_ref}. Reference maximum must be > 0."
                )
            norm_pop = min(100.0, (raw_pop / max_population_ref) * 100.0)
        else:
            raise ValueError(
                "A positive 'max_population_ref' is required to normalize population for a single issue."
            )

        # Validate and normalize complaint_age
        if issue.complaint_age is None:
            raise ValueError("Missing required MCDA factor: 'complaint_age'. Value cannot be None.")
        raw_age = float(issue.complaint_age)
        if raw_age < 0.0:
            raise ValueError(f"Invalid 'complaint_age': {raw_age}. Cannot be negative.")

        if raw_age == 0.0:
            norm_age = 0.0
        elif max_age_ref is not None and max_age_ref > 0.0:
            norm_age = min(100.0, (raw_age / max_age_ref) * 100.0)
        else:
            raise ValueError(
                "A positive 'max_age_ref' is required to normalize non-zero complaint age for a single issue."
            )

        # Calculate weighted contributions
        weights_dict = self.get_factor_weights_dict()
        weighted_contributions = {
            "severity": round(norm_severity * self.weights.severity, 4),
            "urgency": round(norm_urgency * self.weights.urgency, 4),
            "population_affected": round(norm_pop * self.weights.population_affected, 4),
            "health_safety_impact": round(norm_health_safety * self.weights.health_safety_impact, 4),
            "location_sensitivity": round(norm_location * self.weights.location_sensitivity, 4),
            "complaint_age": round(norm_age * self.weights.complaint_age, 4),
        }

        return MCDAFactorScores(
            normalized_severity=norm_severity,
            normalized_urgency=norm_urgency,
            normalized_population_affected=norm_pop,
            normalized_health_safety_impact=norm_health_safety,
            normalized_location_sensitivity=norm_location,
            normalized_complaint_age=norm_age,
            factor_weights=weights_dict,
            weighted_contributions=weighted_contributions,
        )

    def classify_priority(self, score: float) -> PriorityLevel:
        """Deterministically classify a composite MCDA score into priority levels.
        
        Tiers:
            0–39   -> LOW
            40–59  -> MEDIUM
            60–79  -> HIGH
            80–100 -> CRITICAL
        """
        if score < 0.0 or score > 100.0:
            raise ValueError(f"Composite score {score} out of valid [0, 100] bounds.")

        if score >= self.thresholds.critical_min:
            return PriorityLevel.CRITICAL
        elif score >= self.thresholds.high_min:
            return PriorityLevel.HIGH
        elif score >= self.thresholds.medium_min:
            return PriorityLevel.MEDIUM
        else:
            return PriorityLevel.LOW

    def evaluate_issue(
        self,
        issue: CivicIssue,
        max_population_ref: Optional[float] = None,
        max_age_ref: Optional[float] = None,
    ) -> MCDAScoreResult:
        """Evaluate and score a single civic issue deterministically."""
        factor_scores = self.normalize_single_issue_factors(
            issue=issue,
            max_population_ref=max_population_ref,
            max_age_ref=max_age_ref,
        )
        
        # Auditable relationship: composite_score = sum(weighted_contributions)
        composite_score = round(sum(factor_scores.weighted_contributions.values()), 2)
        priority_level = self.classify_priority(composite_score)

        return MCDAScoreResult(
            issue_id=issue.id,
            composite_score=composite_score,
            priority_level=priority_level,
            factor_scores=factor_scores,
        )

    def evaluate_and_rank_batch(self, issues: List[CivicIssue]) -> List[MCDAScoreResult]:
        """Evaluate a batch of issues using batch-maximum normalization and rank descending.
        
        Normalization Rules:
        - Population: normalized = (pop / max_population_in_batch) * 100.
          Raises ValueError if max_pop <= 0 (never invent values).
        - Complaint Age: normalized = (age / max_age_in_batch) * 100.
          If all ages in batch are genuinely 0, normalized age = 0 for all.
        """
        if not issues:
            return []

        # Validate direct factors and non-negativity across batch
        for issue in issues:
            self._validate_direct_factor(issue.severity, f"issue {issue.id} severity")
            self._validate_direct_factor(issue.urgency, f"issue {issue.id} urgency")
            self._validate_direct_factor(
                issue.health_safety_impact, f"issue {issue.id} health_safety_impact"
            )
            self._validate_direct_factor(
                issue.location_sensitivity, f"issue {issue.id} location_sensitivity"
            )
            
            if issue.population_affected is None:
                raise ValueError(f"Issue {issue.id} has missing 'population_affected'.")
            if float(issue.population_affected) < 0.0:
                raise ValueError(f"Issue {issue.id} has negative 'population_affected'.")

            if issue.complaint_age is None:
                raise ValueError(f"Issue {issue.id} has missing 'complaint_age'.")
            if float(issue.complaint_age) < 0.0:
                raise ValueError(f"Issue {issue.id} has negative 'complaint_age'.")

        # Determine batch maximums
        max_pop = max(float(issue.population_affected) for issue in issues)
        if max_pop <= 0.0:
            raise ValueError(
                "Maximum population affected in batch is zero or invalid. Cannot normalize population."
            )

        max_age = max(float(issue.complaint_age) for issue in issues)

        weights_dict = self.get_factor_weights_dict()
        results: List[MCDAScoreResult] = []

        for issue in issues:
            norm_severity = float(issue.severity)
            norm_urgency = float(issue.urgency)
            norm_health_safety = float(issue.health_safety_impact)
            norm_location = float(issue.location_sensitivity)

            # Batch population normalization
            norm_pop = (float(issue.population_affected) / max_pop) * 100.0

            # Batch complaint age normalization
            if max_age == 0.0:
                norm_age = 0.0
            else:
                norm_age = (float(issue.complaint_age) / max_age) * 100.0

            weighted_contributions = {
                "severity": round(norm_severity * self.weights.severity, 4),
                "urgency": round(norm_urgency * self.weights.urgency, 4),
                "population_affected": round(norm_pop * self.weights.population_affected, 4),
                "health_safety_impact": round(norm_health_safety * self.weights.health_safety_impact, 4),
                "location_sensitivity": round(norm_location * self.weights.location_sensitivity, 4),
                "complaint_age": round(norm_age * self.weights.complaint_age, 4),
            }

            factor_scores = MCDAFactorScores(
                normalized_severity=norm_severity,
                normalized_urgency=norm_urgency,
                normalized_population_affected=norm_pop,
                normalized_health_safety_impact=norm_health_safety,
                normalized_location_sensitivity=norm_location,
                normalized_complaint_age=norm_age,
                factor_weights=weights_dict,
                weighted_contributions=weighted_contributions,
            )

            composite_score = round(sum(weighted_contributions.values()), 2)
            priority_level = self.classify_priority(composite_score)

            results.append(
                MCDAScoreResult(
                    issue_id=issue.id,
                    composite_score=composite_score,
                    priority_level=priority_level,
                    factor_scores=factor_scores,
                )
            )

        # Sort by composite score descending and assign rank
        results.sort(key=lambda x: x.composite_score, reverse=True)
        for rank_idx, result in enumerate(results, start=1):
            result.rank = rank_idx

        return results

    rank_issues = evaluate_and_rank_batch


MCDAService = MCDAEngine
