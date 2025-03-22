from fastapi import FastAPI
from app.routes import auth, user
from app.database import engine
from app.models.user import Base
from app.CRUD import user_exercise, users
from sqlalchemy.orm import Session
from fastapi import Depends
from app.database import get_db

app = FastAPI(
    title="Exercise Correction API",
    description="API for tracking and correcting workouts based on exercise performance.",
    version="1.0.0",
)

# Include routers for authentication and user operations.
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(user.router, prefix="/users", tags=["Users"])

@app.on_event("startup")
async def on_startup():
    """Create database tables on startup."""
    async with engine.begin() as conn:
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created.")

@app.get("/", tags=["Root"])
def read_root():
    """Root endpoint returning a welcome message."""
    return {"message": "Welcome to the Exercise Correction API"}

# ----- User Endpoints -----
@app.get("/users/{user_id}", tags=["Users"])
def read_user(user_id: int, db: Session = Depends(get_db)):
    return users.get_user(user_id)

@app.get("/users", tags=["Users"])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return users.get_users(skip, limit)

@app.post("/users", tags=["Users"])
def create_user(username: str, email: str, password: str, db: Session = Depends(get_db)):
    return users.create_user(username, email, password)

@app.put("/users/{user_id}", tags=["Users"])
def update_user(user_id: int, username: str, email: str, password: str, db: Session = Depends(get_db)):
    return users.update_user(user_id, username, email, password)

@app.delete("/users/{user_id}", tags=["Users"])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    return users.delete_user(user_id)

@app.get("/users/email/{email}", tags=["Users"])
def read_user_by_email(email: str, db: Session = Depends(get_db)):
    return users.get_user_by_email(email)

@app.get("/users/username/{username}", tags=["Users"])
def read_user_by_username(username: str, db: Session = Depends(get_db)):
    return users.get_user_by_username(username)

# ----- Exercise Endpoints -----
# Endpoint to get and update exercise data by user_id directly under '/exercise'
@app.get("/exercise/{user_id}", tags=["Exercise"])
def read_user_exercise_data(user_id: int, db: Session = Depends(get_db)):
    return user_exercise.get_user_exercise_data(user_id)

@app.put("/exercise/{user_id}", tags=["Exercise"])
def update_user_exercise_data(user_id: int, exercise_name: str, correct_percentage: float, incorrect_percentage: float, db: Session = Depends(get_db)):
    return user_exercise.update_user_exercise_data(user_id, exercise_name, correct_percentage, incorrect_percentage)

# Endpoints under '/users/{user_id}/exercise'
@app.get("/users/{user_id}/exercise", tags=["Exercise"])
def read_user_exercise_data_for_user(user_id: int, db: Session = Depends(get_db)):
    return user_exercise.get_user_exercise_data(user_id)

@app.put("/users/{user_id}/exercise", tags=["Exercise"])
def update_user_exercise_data_for_user(user_id: int, exercise_name: str, correct_percentage: float, incorrect_percentage: float, db: Session = Depends(get_db)):
    return user_exercise.update_user_exercise_data(user_id, exercise_name, correct_percentage, incorrect_percentage)

# Endpoint to get exercise data by exercise name for a given user
@app.get("/users/{user_id}/exercise/{exercise_name}", tags=["Exercise"])
def read_user_exercise_data_by_name(user_id: int, exercise_name: str, db: Session = Depends(get_db)):
    return user_exercise.get_user_exercise_data_by_name(user_id, exercise_name)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
