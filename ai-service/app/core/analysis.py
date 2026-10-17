from typing import List

from app.models.regression import analyze_subject
from app.schemas.performance import (
    PerformanceAnalysisRequest,
    PerformanceAnalysisResult,
    SubjectPerformanceResult,
)

STRENGTH_CUTOFF = 75.0
FOCUS_CUTOFF = 60.0


def run_analysis(request: PerformanceAnalysisRequest) -> PerformanceAnalysisResult:
    if not request.subjects:
        return PerformanceAnalysisResult(
            student_id=request.student_id,
            risk_level="INSUFFICIENT_DATA",
            overall_average=0.0,
            summary="Not enough mark history yet to generate an analysis.",
            strengths=[],
            focus_areas=[],
            subjects=[],
        )

    subject_results: List[SubjectPerformanceResult] = [
        analyze_subject(subject) for subject in request.subjects
    ]
    subject_results.sort(key=lambda s: s.subject_name)

    overall_average = sum(s.average_score for s in subject_results) / len(subject_results)

    strengths = [
        s.subject_name
        for s in sorted(
            (s for s in subject_results if s.average_score >= STRENGTH_CUTOFF),
            key=lambda s: s.average_score,
            reverse=True,
        )
    ][:2]

    focus_areas = [
        s.subject_name
        for s in sorted(
            (
                s
                for s in subject_results
                if s.trend == "DECLINING" or s.average_score < FOCUS_CUTOFF
            ),
            key=lambda s: s.average_score,
        )
    ][:2]

    declining_count = sum(1 for s in subject_results if s.trend == "DECLINING")
    risk_level = _classify_risk(overall_average, declining_count, len(subject_results))
    summary = _build_summary(strengths, focus_areas, overall_average)

    return PerformanceAnalysisResult(
        student_id=request.student_id,
        risk_level=risk_level,
        overall_average=round(overall_average, 1),
        summary=summary,
        strengths=strengths,
        focus_areas=focus_areas,
        subjects=subject_results,
    )


def _classify_risk(overall_average: float, declining_count: int, subject_count: int) -> str:
    if subject_count == 0:
        return "INSUFFICIENT_DATA"
    many_declining = declining_count >= max(1, subject_count // 2)
    if overall_average < 40 or (many_declining and overall_average < 60):
        return "HIGH"
    if overall_average < 60 or declining_count > 0:
        return "MEDIUM"
    return "LOW"


def _build_summary(strengths: List[str], focus_areas: List[str], overall_average: float) -> str:
    parts = []
    if strengths:
        parts.append(f"Strong in {' and '.join(strengths)}.")
    if focus_areas:
        parts.append(f"Focus area: {' and '.join(focus_areas)}.")
    if not strengths and not focus_areas:
        parts.append(f"Performance is steady across subjects, averaging {round(overall_average, 1)}%.")
    return " ".join(parts)