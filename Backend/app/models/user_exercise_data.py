from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from database import Base

class UserExerciseData(Base):
    __tablename__ = "user_exercise_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)   
    exercise_name = Column(String, nullable=False)
    correct_percentage = Column(Float, default=0.0)  
    incorrect_percentage = Column(Float, default=0.0) 
    total_attempts = Column(Integer, default=0)  
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  
    user = relationship("User", back_populates="exercise_data")