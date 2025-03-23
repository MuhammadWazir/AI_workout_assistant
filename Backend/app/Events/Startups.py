from fastapi import FastAPI
from models.user import Base
from database import engine

app = FastAPI()

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created.")
    