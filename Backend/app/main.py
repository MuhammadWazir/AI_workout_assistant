from fastapi import FastAPI, HTTPException, Depends
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

@app.get("/users/{user_id}")
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

@app.get("/users")
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

@app.post("/users")
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

@app.put("/users/{user_id}")
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

@app.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Allow deletion if admin or if deleting own account
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    user_obj = await users.delete_user(db,user_id)
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

@app.get("/users/username/{username}")
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

@app.get("/exercise/{user_id}", tags=["Exercise"])
async def read_user_exercise_data(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Allow access only to admin or to the owner of the exercise data
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    data = await user_exercise.get_user_exercise_data(db, user_id)
    if not data:
        raise HTTPException(status_code=404, detail="No exercise data found for this user")
    return data

@app.put("/exercise/{user_id}", tags=["Exercise"])
async def update_user_exercise_data(
    user_id: int,
    exercise_name: str,
    correct_percentage: float,
    incorrect_percentage: float,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Allow update only if admin or if current user is the owner
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    data = await user_exercise.update_user_exercise_data(db, user_id, exercise_name, correct_percentage, incorrect_percentage)
    if not data:
        raise HTTPException(status_code=404, detail="No User Found")
    return data

# Endpoints under '/users/{user_id}/exercise'
@app.get("/users/{user_id}/exercise", tags=["Exercise"])
async def read_user_exercise_data_for_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Allow access only if admin or if current user is the owner
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    data = await user_exercise.get_user_exercise_data(db, user_id)
    if not data:
        raise HTTPException(status_code=404, detail="No exercise data found for this user")
    return data

@app.put("/users/{user_id}/exercise", tags=["Exercise"])
async def update_user_exercise_data_for_user(
    user_id: int,
    exercise_name: str,
    correct_percentage: float,
    incorrect_percentage: float,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Allow update only if admin or if current user is the owner
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    result = await user_exercise.update_user_exercise_data(db, user_id, exercise_name, correct_percentage, incorrect_percentage)
    if not result:
        raise HTTPException(status_code=404, detail="No User Found")
    return result

# Endpoint to get exercise data by exercise name for a given user
@app.get("/users/{user_id}/exercise/{exercise_name}", tags=["Exercise"])
async def read_user_exercise_data_by_name(
    user_id: int,
    exercise_name: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Allow access only if admin or if current user is the owner
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    data = await user_exercise.get_user_exercise_data_by_name(db, user_id, exercise_name)
    if not data:
        raise HTTPException(status_code=404, detail="No exercise data found for this user")
    return data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8080)
