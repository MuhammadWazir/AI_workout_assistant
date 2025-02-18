from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class UserExerciseData(Base):
    __tablename__ = "user_exercise_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)  # Reference to User table
    exercise_name = Column(String, nullable=False)  # Name of the exercise
    correct_percentage = Column(Float, default=0.0)  # % of correct reps
    incorrect_percentage = Column(Float, default=0.0)  # % of incorrect reps
    total_attempts = Column(Integer, default=0)  # Total reps attempted
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # Last update timestamp

    user = relationship("User", back_populates="exercise_data")  # Establish relation with User table
