from fastapi import FastAPI, HTTPException
from routes import auth, user, exercises
from database import engine
from models.user import Base
from CRUD import user_exercise, users
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession, AsyncEngine
from database import get_db

app = FastAPI(
    title="Exercise Correction API",
    description="API for tracking and correcting workouts based on exercise performance.",
    version="1.0.0",
)

# Include routers for authentication and user operations.
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(exercises.router, prefix="/exercises", tags=["Exercises"])

@app.on_event("startup")
async def on_startup():
    """Create database tables on startup."""
    if isinstance(engine, AsyncEngine):  
        async with engine.begin() as conn:
            print("Creating tables...")
            await conn.run_sync(Base.metadata.create_all) 
            print("Tables created.")
    else:
        print("Error: Engine is not async")

@app.get("/", tags=["Root"])
def read_root():
    """Root endpoint returning a welcome message."""
    return {"message": "Welcome to the Exercise Correction API"}

# ----- User Endpoints -----
@app.get("/users/{user_id}")
async def read_user(user_id: int, db: AsyncSession = Depends(get_db)):
    return await users.get_user(db, user_id)

@app.get("/users")
async def read_users(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await users.get_users(db, skip, limit)

@app.post("/users")
async def create_user(username: str, email: str, password: str, db: AsyncSession = Depends(get_db)):
    user = await users.create_user(db, username, email, password)
    if user is None:
        raise HTTPException(status_code=400, detail="Email/Username is already registered.")
    return user

@app.put("/users/{user_id}")
async def update_user(user_id: int, username: str, email: str, password: str, db: AsyncSession = Depends(get_db)):
    user = await users.update_user(user_id, username, email, password)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.delete("/users/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await users.delete_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/users/email/{email}", tags=["Users"])
async def read_user_by_email(email: str, db: AsyncSession = Depends(get_db)):
    user = await users.get_user_by_email(db=db, email=email) 
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/users/username/{username}")
async def read_user_by_username(username: str, db: AsyncSession = Depends(get_db)):
    user = await users.get_user_by_username(db, username)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ----- Exercise Endpoints -----
@app.get("/exercise/{user_id}", tags=["Exercise"])
async def read_user_exercise_data(user_id: int, db: AsyncSession = Depends(get_db)):
    data = await user_exercise.get_user_exercise_data(db, user_id)
    if not data:
        raise HTTPException(status_code=404, detail="No exercise data found for this user")
    return data

@app.put("/exercise/{user_id}", tags=["Exercise"])
async def update_user_exercise_data(user_id: int, exercise_name: str, correct_percentage: float, incorrect_percentage: float, db: AsyncSession = Depends(get_db)):
    data = await user_exercise.update_user_exercise_data(db, user_id, exercise_name, correct_percentage, incorrect_percentage)
    if not data:
        raise HTTPException(status_code=404, detail="No User Found")
    return data

# Endpoints under '/users/{user_id}/exercise'
@app.get("/users/{user_id}/exercise", tags=["Exercise"])
async def read_user_exercise_data_for_user(user_id: int, db: AsyncSession = Depends(get_db)):
    data = await user_exercise.get_user_exercise_data(db, user_id)
    if not data:
        raise HTTPException(status_code=404, detail="No exercise data found for this user")
    return data


@app.put("/users/{user_id}/exercise", tags=["Exercise"])
async def update_user_exercise_data_for_user(user_id: int, exercise_name: str, correct_percentage: float, incorrect_percentage: float, db: AsyncSession = Depends(get_db)):
    smtp = await user_exercise.update_user_exercise_data(db, user_id, exercise_name, correct_percentage, incorrect_percentage)
    if not smtp:
        raise HTTPException(status_code=404, detail="No User Found")
    return smtp

# Endpoint to get exercise data by exercise name for a given user
@app.get("/users/{user_id}/exercise/{exercise_name}", tags=["Exercise"])
async def read_user_exercise_data_by_name(user_id: int, exercise_name: str, db: AsyncSession = Depends(get_db)):
    data = await user_exercise.get_user_exercise_data_by_name(db,user_id, exercise_name)
    if not data:
        raise HTTPException(status_code=404, detail="No exercise data found for this user")
    return data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8080)