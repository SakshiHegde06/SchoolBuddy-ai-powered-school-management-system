from fastapi import APIRouter

from app.core.analysis import run_analysis
from app.schemas.performance import PerformanceAnalysisRequest, PerformanceAnalysisResult

router = APIRouter(prefix="/predict", tags=["performance"])


@router.post("/performance", response_model=PerformanceAnalysisResult)
def predict_performance(request: PerformanceAnalysisRequest) -> PerformanceAnalysisResult:
    """Called by the Spring backend (AiServiceClient) with a student's mark
    history grouped by subject. Returns per-subject trend/prediction plus an
    overall risk level and human-readable summary."""
    return run_analysis(request)