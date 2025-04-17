from datetime import date
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Path
from schemas.user_exercise import ExerciseDataCreate, ExerciseDataResponse, ExerciseDataUpdate
from routes import auth, user, exercises
from database import engine
from models.user import Base, User
from CRUD import user_exercise, users
from sqlalchemy.ext.asyncio import AsyncSession, AsyncEngine
from database import get_db
from fastapi.middleware.cors import CORSMiddleware
from core.security import get_current_user 

app = FastAPI(
    title="Exercise Correction API",
    description="API for tracking and correcting workouts based on exercise performance.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.get("/users/{user_id}", tags=["Users"])
async def read_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Allow if the current user is admin or is accessing their own data
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    user_data = await users.get_user(db, user_id)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return user_data

@app.get("/users", tags=["Users"])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Only admin can list all users
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return await users.get_users(db, skip, limit)

@app.post("/users", tags=["Users"])
async def create_user(
    username: str,
    email: str,
    password: str,
    db: AsyncSession = Depends(get_db)
):
    # Allow anyone to create a new user (role defaults to "user")
    user_obj = await users.create_user(db, username, email, password)
    if user_obj is None:
        raise HTTPException(status_code=400, detail="Email/Username is already registered.")
    return user_obj

@app.put("/users/{user_id}", tags=["Users"])
async def update_user(
    user_id: int,
    username: str,
    email: str,
    password: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Allow update if admin or if updating own account
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    user_obj = await users.update_user(db,user_id, username, email, password)
    if user_obj is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user_obj

@app.delete("/users/{user_id}", tags=["Users"])
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Allow deletion if admin or if deleting own account
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    user_obj = await users.delete_user(db,  user_id)
    if user_obj is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user_obj

@app.get("/users/email/{email}", tags=["Users"])
async def read_user_by_email(
    email: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Allow if admin or if current user's email matches
    if current_user.role != "admin" and current_user.email != email:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    user_obj = await users.get_user_by_email(db=db, email=email)
    if user_obj is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user_obj

@app.get("/users/username/{username}", tags=["Users"])
async def read_user_by_username(
    username: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Allow if admin or if current user's username matches
    if current_user.role != "admin" and current_user.username != username:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    user_obj = await users.get_user_by_username(db, username)
    if user_obj is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user_obj

# ----- Exercise Endpoints -----

@app.post(
    "/Exercise/",
    response_model=ExerciseDataResponse,
    status_code=201
)
async def create_exercise(
    user_id: int,
    payload: ExerciseDataCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(403, "Not enough permissions")
    return await user_exercise.create_user_exercise_data(db, user_id, payload)

@app.put(
    "/Exercise/{exercise_name}",
    response_model=ExerciseDataResponse
)
async def update_exercise(
    user_id: int,
    exercise_name: str,
    payload: ExerciseDataUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(403, "Not enough permissions")
    updated = await user_exercise.update_user_exercise_data(
        db, user_id, exercise_name, payload
    )
    if not updated:
        raise HTTPException(404, "Exercise record not found")
    return updated

@app.get(
    "/Exercise/{exercise_name}",
    response_model=ExerciseDataResponse
)
async def read_by_name(
    user_id: int,
    exercise_name: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(403, "Not enough permissions")
    record = await user_exercise.get_user_exercise_data_by_name(
        db, user_id, exercise_name
    )
    if not record:
        raise HTTPException(404, "No exercise data found for this name")
    return record

@app.get(
    "/Exercise/date/{workout_date}",
    response_model=List[ExerciseDataResponse]
)
async def read_by_date(
    user_id: int,
    workout_date: date,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(403, "Not enough permissions")
    records = await user_exercise.get_user_exercise_data_by_date(
        db, user_id, workout_date
    )
    if not records:
        raise HTTPException(404, "No entries found on that date")
    return records

@app.delete(
        "/Exercise/{exercise_name}",
        response_model=ExerciseDataResponse,
)
async def delete_exercise(
    user_id: int,
    exercise_name: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(403, "Not enough permissions")

    user = await user_exercise.get_user_data(db, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    deleted = await user_exercise.delete_user_exercise_data(
        db, user_id, exercise_name
    )
    if not deleted:
        raise HTTPException(404, "Exercise record not found")
    return deleted

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8080)
