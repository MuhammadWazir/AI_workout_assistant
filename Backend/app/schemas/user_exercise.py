from pydantic import BaseModel
from typing import Dict, Optional
from datetime import date, datetime

class ExerciseDataBase(BaseModel):
    exercise_name: str
    rep_count: Optional[int]
    mistake_percentages: Optional[Dict[str, float]]
    correct_percentage: Optional[float]
    incorrect_percentage: Optional[float]
    workout_date: Optional[date]

class ExerciseDataCreate(ExerciseDataBase):
    rep_count: int
    correct_percentage: float
    incorrect_percentage: float

class ExerciseDataUpdate(BaseModel):
    rep_count: Optional[int]
    mistake_percentages: Optional[Dict[str, float]]
    correct_percentage: Optional[float]
    incorrect_percentage: Optional[float]
    workout_date: Optional[date]

class ExerciseDataResponse(ExerciseDataBase):
    id: int
    total_attempts: int
    created_at: datetime
    last_updated: datetime

    class Config:
        orm_mode = True
