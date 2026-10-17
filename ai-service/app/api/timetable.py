import random
from typing import Dict, List
from fastapi import APIRouter

from app.schemas.timetable import TimetableGenerateRequest, TimetableGenerateResponse

router = APIRouter(tags=["timetable"])


@router.post("/generate-timetable", response_model=TimetableGenerateResponse)
@router.post("/timetable/generate", response_model=TimetableGenerateResponse)
def generate_timetable(request: TimetableGenerateRequest) -> TimetableGenerateResponse:
    """Intelligently generates a balanced weekly class timetable based on subject demand

    and weekly frequency constraints.
    """
    days = request.days or ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods_per_day = request.periods_per_day or 6
    total_slots = len(days) * periods_per_day

    # Build subject pool based on hours_per_week
    pool: List[str] = []
    if request.subjects:
        for subj in request.subjects:
            name = subj.subject_name.strip()
            count = max(1, subj.hours_per_week)
            pool.extend([name] * count)
    else:
        pool = ["General Studies"] * total_slots

    # Adjust pool length to exact slot count
    if len(pool) < total_slots:
        extras = ["Self Study", "Library", "Activity", "Physical Education"]
        idx = 0
        while len(pool) < total_slots:
            pool.append(extras[idx % len(extras)])
            idx += 1
    elif len(pool) > total_slots:
        pool = pool[:total_slots]

    # Distribute subjects across days so the same subject doesn't clutter one day
    # Shuffle with fixed seed or deterministic round-robin
    schedule: Dict[str, List[str]] = {day: [] for day in days}

    # Interleave subjects evenly across days
    random_gen = random.Random(hash(request.class_name) % 10000)
    random_gen.shuffle(pool)

    slot_idx = 0
    for period in range(periods_per_day):
        for day in days:
            if slot_idx < len(pool):
                schedule[day].append(pool[slot_idx])
                slot_idx += 1
            else:
                schedule[day].append("Self Study")

    return TimetableGenerateResponse(
        status="success",
        class_name=request.class_name,
        schedule=schedule,
    )
