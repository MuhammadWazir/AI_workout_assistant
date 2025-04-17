from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.user import User
from schemas.user_exercise import ExerciseDataCreate, ExerciseDataUpdate
from models.user_exercise_data import UserExerciseData

    
async def get_user_exercise_data(db: AsyncSession, user_id: int):
    stmt = select(UserExerciseData).filter(UserExerciseData.user_id == user_id)
    result = await db.execute(stmt)
    records = result.scalars().all()

    for rec in records:
        if not isinstance(rec.mistake_percentages, dict):
            print("MISTAKEE ALSO")
            rec.mistake_percentages = {}
    return records
async def get_user_data(
    db: AsyncSession,
    user_id: int
) -> User | None:

    stmt = select(User).filter(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalars().first()
async def get_user_exercise_data_by_name(
    db: AsyncSession, user_id: int, exercise_name: str
) -> UserExerciseData | None:
    stmt = select(UserExerciseData).filter(
        UserExerciseData.user_id == user_id,
        UserExerciseData.exercise_name == exercise_name
    )
    result = await db.execute(stmt)
    record = result.scalars().first()

    if record and not isinstance(record.mistake_percentages, dict):
        print("MISTAKEEEEE: in the mistake_percentages: ", record.mistake_percentages)
        record.mistake_percentages = {}

    return record

async def get_user_exercise_data_by_date(
    db: AsyncSession, user_id: int, workout_date
):
    stmt = select(UserExerciseData).filter(
        UserExerciseData.user_id == user_id,
        UserExerciseData.workout_date == workout_date
    )
    result = await db.execute(stmt)
    return result.scalars().all()

async def delete_user_exercise_data(
    db: AsyncSession,
    user_id: int,
    exercise_name: str
) -> UserExerciseData | None:

    stmt = select(UserExerciseData).filter(
        UserExerciseData.user_id == user_id,
        UserExerciseData.exercise_name == exercise_name
    )
    result = await db.execute(stmt)
    record = result.scalars().first()

    if record:
        await db.delete(record)
        await db.commit()
        return record
    return None

async def create_user_exercise_data(
    db: AsyncSession, user_id: int, payload: ExerciseDataCreate
):
    new_record = UserExerciseData(
        user_id=user_id,
        exercise_name=payload.exercise_name,
        rep_count=payload.rep_count,
        mistake_percentages=payload.mistake_percentages,
        correct_percentage=payload.correct_percentage,
        incorrect_percentage=payload.incorrect_percentage,
        total_attempts=1,
        workout_date=payload.workout_date or datetime.utcnow().date()
    )
    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)
    return new_record

async def update_user_exercise_data(
    db: AsyncSession, user_id: int, exercise_name: str, payload: ExerciseDataUpdate
):
    workout_date = payload.workout_date or datetime.utcnow().date()
    stmt = select(UserExerciseData).filter(
        UserExerciseData.user_id == user_id,
        UserExerciseData.exercise_name == exercise_name,
        UserExerciseData.workout_date == workout_date
    )
    result = await db.execute(stmt)
    record = result.scalars().first()

    if record:
        if payload.rep_count is not None:
            record.rep_count = payload.rep_count
        if payload.mistake_percentages is not None:
            record.mistake_percentages = payload.mistake_percentages
        if payload.correct_percentage is not None:
            record.correct_percentage = payload.correct_percentage
        if payload.incorrect_percentage is not None:
            record.incorrect_percentage = payload.incorrect_percentage
        record.total_attempts += 1
    else:
        record = UserExerciseData(
            user_id=user_id,
            exercise_name=exercise_name,
            rep_count=payload.rep_count or 0,
            mistake_percentages=payload.mistake_percentages,
            correct_percentage=payload.correct_percentage or 0.0,
            incorrect_percentage=payload.incorrect_percentage or 0.0,
            total_attempts=1,
            workout_date=workout_date
        )
        db.add(record)

    await db.commit()
    await db.refresh(record)
    return record