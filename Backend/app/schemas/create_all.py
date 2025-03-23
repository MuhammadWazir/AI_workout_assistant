from sqlalchemy.ext.asyncio import AsyncEngine
from app.database import engine  # Assuming engine is defined in your database.py
from app.models.user import Base  # Ensure the correct import path for Base

# Define async table creation function
async def create_tables():
    # Ensure 'engine' is the AsyncEngine from asyncpg or another async database engine
    async with engine.begin() as conn:
        # Sync method is needed to handle table creation in async mode
        await conn.run_sync(Base.metadata.create_all)
