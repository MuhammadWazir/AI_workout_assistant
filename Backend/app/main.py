from fastapi import FastAPI
from app.routes import auth, user
from app.database import engine
from app.models.user import Base

app = FastAPI()

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(user.router, prefix="/users", tags=["Users"])

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created.")
        
@app.get("/")
def read_root():
    return {"message": "Welcome to the Exercise Correction API"}