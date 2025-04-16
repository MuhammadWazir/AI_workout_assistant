from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.user_exercise_data import UserExerciseData
    
async def get_user_exercise_data(db: AsyncSession, user_id: int):
    stmt = select(UserExerciseData).filter(UserExerciseData.user_id == user_id)
    if not stmt:
        return None
    result = await db.execute(stmt)
    return result.scalars().all() 

async def update_user_exercise_data(
    db: AsyncSession,
    user_id: int,
    exercise_name: str,
    rep_count: int,
    mistake_percentages: dict = None,
    workout_date = None
):
    if workout_date is None:
        workout_date = datetime.utcnow().date()

    stmt = select(UserExerciseData).filter(
        UserExerciseData.user_id == user_id,
        UserExerciseData.exercise_name == exercise_name,
        UserExerciseData.workout_date == workout_date
    )
    result = await db.execute(stmt)
    record = result.scalars().first()

    if record:
        record.rep_count = rep_count
        record.mistake_percentages = mistake_percentages
        record.total_attempts += 1
    else:
        record = UserExerciseData(
            user_id=user_id,
            exercise_name=exercise_name,
            rep_count=rep_count,
            mistake_percentages=mistake_percentages,
            total_attempts=1,
            workout_date = workout_date
        )
        db.add(record)

    await db.commit()
    await db.refresh(record)
    return record

async def get_user_exercise_data_by_name(db: AsyncSession, user_id: int, exercise_name: str, workout_date = None):
    
    if(workout_date):
        stmp = select(UserExerciseData).filter(
            UserExerciseData.user_id == user_id,
            UserExerciseData.exercise_name == exercise_name,
            UserExerciseData.workout_date == workout_date
        )
    else:
        stmt = select(UserExerciseData).filter(
            UserExerciseData.user_id == user_id,
            UserExerciseData.exercise_name == exercise_name,
        )
    if not stmt:
        return None
    result = await db.execute(stmt)
    return result.scalars().first() 

async def get_user_exercise_data_by_date(
        db: AsyncSession,
        user_id: int,
        workout_date
):
    stmt = select(UserExerciseData).filter(
        UserExerciseData.user_id == user_id,
        UserExerciseData.workout_date == workout_date
    )

    result = await db.execute(stmt)
    return result.scalars().all()