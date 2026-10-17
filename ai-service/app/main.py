from fastapi import FastAPI

from app.api.performance import router as performance_router
from app.api.timetable import router as timetable_router
from app.api.recommendations import router as recommendations_router

app = FastAPI(title="School AI Service", version="0.1.0")

app.include_router(performance_router)
app.include_router(timetable_router)
app.include_router(recommendations_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}