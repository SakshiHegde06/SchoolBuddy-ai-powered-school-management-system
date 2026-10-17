from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class SubjectConfig(BaseModel):
    subject_name: str
    hours_per_week: int = Field(default=4, ge=1)
    teacher_id: Optional[str] = None


class TimetableGenerateRequest(BaseModel):
    class_name: str
    subjects: List[SubjectConfig]
    days: Optional[List[str]] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods_per_day: Optional[int] = 6


class TimetableGenerateResponse(BaseModel):
    status: str = "success"
    class_name: Optional[str] = None
    schedule: Dict[str, List[str]]
