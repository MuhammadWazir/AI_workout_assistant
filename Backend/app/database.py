from sqlalchemy.orm  import Session
from Backend.app.models.user_exercise_data import UserExerciseData
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
from sqlalchemy.ext.declarative import declarative_base

load_dotenv()

DATABASE_URL = "postgresql+asyncpg://postgres:mysequel1!@localhost:5432/Exercise_Correction"
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set or loaded.")
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)
Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)
    
async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session

