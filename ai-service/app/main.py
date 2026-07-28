from fastapi import FastAPI

from app.api.performance import router as performance_router

app = FastAPI(title="School AI Service", version="0.1.0")

app.include_router(performance_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}