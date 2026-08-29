"""Civic Intelligence Engine evaluation router."""

import logging
from typing import List, Union
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.models.civic_issue import CivicIssue
from app.models.decision import (
    CIEEvaluationRequest,
    CIEPipelineResponse,
    MCDARanking,
    OptimizationResult,
)
from app.models.resources import MunicipalResources
from app.models.scenario import CIEScenarioRequest, CIEScenarioResponse
from app.services.db_service import DatabaseService
from app.core.mcda import MCDAService
from app.core.optimizer import ResourceOptimizerService
from app.services.pipeline import CIEPipelineService
from app.services.scenario_service import ScenarioService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cie", tags=["CIE"])

# Initialize default services
pipeline_service = CIEPipelineService()
mcda_service = MCDAService()
optimizer_service = ResourceOptimizerService()
scenario_service = ScenarioService()
db_service = DatabaseService()


class PrioritizeRequest(BaseModel):
    """Payload for pure MCDA prioritization."""
    issues: List[CivicIssue]


class OptimizeRequest(BaseModel):
    """Payload for pure resource optimization."""
    issues: List[CivicIssue]
    resources: MunicipalResources


@router.post(
    "/evaluate",
    response_model=CIEPipelineResponse,
    summary="Evaluate and optimize civic issues",
    description="Runs validation, MCDA prioritization, resource optimization, and rule-based explanations.",
    status_code=status.HTTP_200_OK,
)
async def evaluate_issues(request: CIEEvaluationRequest) -> CIEPipelineResponse:
    """Evaluate a batch of civic issues against municipal resource constraints."""
    try:
        result = pipeline_service.run_pipeline(
            issues=request.issues,
            resources=request.resources,
        )

        # Best-effort persistence: save issues and CIE evaluation result
        try:
            for issue in request.issues:
                db_service.save_issue(issue)
            db_service.save_cie_result(result)
        except Exception as db_err:
            logger.warning("Failed to persist CIE evaluation to database: %s", db_err)

        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"CIE Pipeline execution failed: {str(e)}",
        )


@router.post(
    "/prioritize",
    response_model=List[MCDARanking],
    summary="Pure MCDA Prioritization",
    description="Runs deterministic 6-factor MCDA scoring and ranks civic complaints.",
    status_code=status.HTTP_200_OK,
)
async def prioritize_issues(payload: Union[PrioritizeRequest, List[CivicIssue]]) -> List[MCDARanking]:
    """Calculate deterministic MCDA priority scores and rankings for given issues."""
    try:
        issues_list = payload.issues if isinstance(payload, PrioritizeRequest) else payload
        return mcda_service.rank_issues(issues_list)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"MCDA Prioritization failed: {str(e)}",
        )


@router.post(
    "/optimize",
    response_model=OptimizationResult,
    summary="Pure OR-Tools Resource Optimization",
    description="Calculates optimal knapsack allocation given issues and resource constraints.",
    status_code=status.HTTP_200_OK,
)
async def optimize_resources(request: OptimizeRequest) -> OptimizationResult:
    """Run Google OR-Tools optimizer subject to municipal resource bounds."""
    try:
        # First compute MCDA rankings for the issues
        rankings = mcda_service.rank_issues(request.issues)
        opt_result = optimizer_service.optimize(
            issues=request.issues,
            mcda_rankings=rankings,
            resources=request.resources,
        )
        return opt_result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OR-Tools optimization failed: {str(e)}",
        )


@router.post(
    "/scenario",
    response_model=CIEScenarioResponse,
    summary="What-If municipal resource scenario analysis",
    description="Compares optimal allocations between baseline and hypothetical municipal resource constraints while preserving invariant MCDA scores.",
    status_code=status.HTTP_200_OK,
)
async def evaluate_scenario(request: CIEScenarioRequest) -> CIEScenarioResponse:
    """Evaluate a What-If scenario comparing baseline and hypothetical resource constraints."""
    try:
        response = scenario_service.run_scenario(
            issues=request.issues,
            baseline_resources=request.baseline_resources,
            scenario_resources=request.scenario_resources,
        )
        return response
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"What-If Scenario execution failed: {str(e)}",
        )
