from pydantic import BaseModel
from typing import Dict, Optional
from datetime import date, datetime

class ExerciseDataBase(BaseModel):
    exercise_name: str
    rep_count: Optional[int]
    mistake_percentages: Optional[Dict[str, float]]
    score: Optional[float]
    workout_date: Optional[date]

class ExerciseDataCreate(ExerciseDataBase):
    rep_count: int
    score: float

class ExerciseDataUpdate(BaseModel):
    rep_count: Optional[int]
    mistake_percentages: Optional[Dict[str, float]] | None = None
    score: Optional[float]
    workout_date: Optional[date] | None = None

class ExerciseDataResponse(ExerciseDataBase):
    id: int
    total_attempts: int
    created_at: datetime
    last_updated: datetime

    class Config:
        orm_mode = True
