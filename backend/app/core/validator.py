"""Civic data validation layer.

Rule: Never invent missing civic data. Missing data must be explicitly flagged.
"""

from typing import List, Tuple
from app.models.civic_issue import CivicIssue, IssueValidationReport, ValidationStatus


class CivicIssueValidator:
    """Validates civic issue data integrity and flags missing or invalid values."""

    def __init__(self, required_mcda_fields: List[str] = None):
        self.required_mcda_fields = required_mcda_fields or [
            "severity",
            "urgency",
            "population_affected",
            "health_safety_impact",
            "location_sensitivity",
            "complaint_age",
        ]

    def validate(self, issue: CivicIssue) -> IssueValidationReport:
        """Validate a single civic issue and flag missing or out-of-range fields."""
        missing_fields = []
        validation_errors = []
        
        # 1. Check required MCDA fields
        for field_name in self.required_mcda_fields:
            val = getattr(issue, field_name, None)
            if val is None:
                missing_fields.append(field_name)
            else:
                try:
                    val_float = float(val)
                    if field_name in [
                        "severity",
                        "urgency",
                        "health_safety_impact",
                        "location_sensitivity",
                    ]:
                        if val_float < 0.0 or val_float > 100.0:
                            validation_errors.append(
                                f"Field '{field_name}' value {val_float} is outside valid [0, 100] range."
                            )
                    elif field_name in ["population_affected", "complaint_age"]:
                        if val_float < 0.0:
                            validation_errors.append(
                                f"Field '{field_name}' value {val_float} cannot be negative."
                            )
                except (ValueError, TypeError):
                    validation_errors.append(f"Field '{field_name}' has non-numeric value: {val}.")

        # 2. Check resource requirement fields (if provided, must be non-negative)
        for res_field in ["estimated_cost", "required_workers", "required_vehicles", "required_time_hours"]:
            val = getattr(issue, res_field, None)
            if val is not None:
                try:
                    val_float = float(val)
                    if val_float < 0.0:
                        validation_errors.append(f"Resource field '{res_field}' cannot be negative: {val_float}.")
                except (ValueError, TypeError):
                    validation_errors.append(f"Resource field '{res_field}' has invalid value: {val}.")

        is_valid = len(missing_fields) == 0 and len(validation_errors) == 0
        if is_valid:
            status = ValidationStatus.VALID
        elif validation_errors:
            status = ValidationStatus.INVALID
        else:
            status = ValidationStatus.MISSING_DATA

        return IssueValidationReport(
            issue_id=issue.id,
            is_valid=is_valid,
            status=status,
            missing_fields=missing_fields,
            validation_errors=validation_errors,
        )

    def validate_batch(
        self, issues: List[CivicIssue]
    ) -> Tuple[List[CivicIssue], List[IssueValidationReport]]:
        """Validate a batch of civic issues, separating valid issues from reports.
        
        Placeholder - algorithm implementation pending approval.
        """
        valid_issues: List[CivicIssue] = []
        reports: List[IssueValidationReport] = []

        for issue in issues:
            report = self.validate(issue)
            reports.append(report)
            if report.is_valid:
                valid_issues.append(issue)

        return valid_issues, reports
