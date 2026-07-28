from datetime import date as date_type
from typing import List

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base model that speaks camelCase on the wire (to match the Java/Jackson
    side) while staying snake_case in Python."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# ---- Request (Spring backend -> AI service) --------------------------------

class MarkPoint(CamelModel):
    date: date_type
    marks_obtained: float
    max_marks: float


class SubjectSeries(CamelModel):
    subject_id: str
    subject_name: str
    marks: List[MarkPoint]


class PerformanceAnalysisRequest(CamelModel):
    student_id: str
    subjects: List[SubjectSeries]


# ---- Response (AI service -> Spring backend) -------------------------------

class SubjectPerformanceResult(CamelModel):
    subject_id: str
    subject_name: str
    assessment_count: int
    average_score: float
    latest_score: float
    predicted_next_score: float
    trend_slope: float
    trend: str  # IMPROVING | DECLINING | STABLE | INSUFFICIENT_DATA


class PerformanceAnalysisResult(CamelModel):
    student_id: str
    risk_level: str  # LOW | MEDIUM | HIGH | INSUFFICIENT_DATA
    overall_average: float
    summary: str
    strengths: List[str]
    focus_areas: List[str]
    subjects: List[SubjectPerformanceResult]