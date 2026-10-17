from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class RecommendationRequest(BaseModel):
    student_id: str
    weak_subjects: List[str] = []
    strong_subjects: List[str] = []
    overall_average: float = 0.0


class ActionItem(BaseModel):
    subject: str
    tip: str
    priority: str  # HIGH | MEDIUM | LOW


class RecommendationResponse(BaseModel):
    student_id: str
    overall_guidance: str
    action_items: List[ActionItem]


@router.post("", response_model=RecommendationResponse)
def get_recommendations(req: RecommendationRequest) -> RecommendationResponse:
    items: List[ActionItem] = []

    for subj in req.weak_subjects:
        items.append(
            ActionItem(
                subject=subj,
                tip=f"Allocate 45 minutes daily for targeted practice in {subj}. Focus on core concepts and sample worksheets.",
                priority="HIGH",
            )
        )

    for subj in req.strong_subjects:
        items.append(
            ActionItem(
                subject=subj,
                tip=f"Great work in {subj}! Try advanced problem sets or mentoring classmates to deepen mastery.",
                priority="LOW",
            )
        )

    if req.overall_average < 50:
        guidance = "Immediate academic intervention advised. Schedule weekly review meetings with subject mentors."
    elif req.overall_average < 75:
        guidance = "Consistent daily study routine and weekly self-assessments will boost performance into top tier."
    else:
        guidance = "Excellent academic momentum. Maintain consistency and participate in inter-school competitions."

    return RecommendationResponse(
        student_id=req.student_id,
        overall_guidance=guidance,
        action_items=items,
    )
