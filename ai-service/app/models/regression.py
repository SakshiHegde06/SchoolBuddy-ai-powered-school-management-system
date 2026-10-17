import numpy as np
from sklearn.linear_model import LinearRegression

from app.schemas.performance import SubjectSeries, SubjectPerformanceResult

# Percentage-points-per-assessment beyond which we call it a real trend
# rather than noise.
TREND_THRESHOLD = 1.0


def analyze_subject(series: SubjectSeries) -> SubjectPerformanceResult:
    """Fit an ordinary least-squares linear regression of score % against
    assessment order for one subject, and use it to project the next score
    and classify the trend."""

    sorted_marks = sorted(series.marks, key=lambda m: m.date)
    percentages = np.array(
        [(m.marks_obtained / m.max_marks) * 100.0 for m in sorted_marks]
    )
    n = len(percentages)
    average = float(np.mean(percentages))
    latest = float(percentages[-1])

    if n < 2:
        # Not enough points to fit a line - report what we know without
        # pretending to predict a trend.
        return SubjectPerformanceResult(
            subject_id=series.subject_id,
            subject_name=series.subject_name,
            assessment_count=n,
            average_score=round(average, 1),
            latest_score=round(latest, 1),
            predicted_next_score=round(latest, 1),
            trend_slope=0.0,
            trend="INSUFFICIENT_DATA",
        )

    x = np.arange(n).reshape(-1, 1)
    model = LinearRegression()
    model.fit(x, percentages)

    slope = float(model.coef_[0])
    predicted_next = float(model.predict([[n]])[0])
    predicted_next = min(100.0, max(0.0, predicted_next))

    if slope > TREND_THRESHOLD:
        trend = "IMPROVING"
    elif slope < -TREND_THRESHOLD:
        trend = "DECLINING"
    else:
        trend = "STABLE"

    return SubjectPerformanceResult(
        subject_id=series.subject_id,
        subject_name=series.subject_name,
        assessment_count=n,
        average_score=round(average, 1),
        latest_score=round(latest, 1),
        predicted_next_score=round(predicted_next, 1),
        trend_slope=round(slope, 1),
        trend=trend,
    )