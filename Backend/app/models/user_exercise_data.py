from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from database import Base

class UserExerciseData(Base):
    __tablename__ = "user_exercise_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    exercise_name = Column(String, nullable=False)
    
    # New fields to capture the session results from your React component
    rep_count = Column(Integer, default=0)  # Total reps counted during the session
    mistake_percentages = Column(JSON, nullable=True)  # Aggregated mistake percentages report

    # You can keep these fields if needed for legacy reasons.
    correct_percentage = Column(Float, default=0.0)
    incorrect_percentage = Column(Float, default=0.0)

    total_attempts = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to the user (see :contentReference[oaicite:1]{index=1} and :contentReference[oaicite:2]{index=2})
    user = relationship("User", back_populates="exercise_data")