from app.database import engine  # Your database engine
from app.models.user import Base  # Your Base where all models are declared

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Call this function somewhere at app startup
