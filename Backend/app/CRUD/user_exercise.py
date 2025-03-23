from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.user_exercise_data import UserExerciseData

async def get_user_exercise_data(db: AsyncSession, user_id: int):
    stmt = select(UserExerciseData).filter(UserExerciseData.user_id == user_id)
    if not stmt:
        return None
    result = await db.execute(stmt)
    return result.scalars().all() 
 
async def update_user_exercise_data(db: AsyncSession, user_id: int, exercise_name: str, correct_percentage: float, incorrect_percentage: float):
    stmt = select(UserExerciseData).filter(
        UserExerciseData.user_id == user_id,
        UserExerciseData.exercise_name == exercise_name
    )
    if not stmt:
        return None
    result = await db.execute(stmt)
    record = result.scalars().first()

    if record:
        record.correct_percentage = correct_percentage
        record.incorrect_percentage = incorrect_percentage
    else:
        record = UserExerciseData(
            user_id=user_id,
            exercise_name=exercise_name,
            correct_percentage=correct_percentage,
            incorrect_percentage=incorrect_percentage
        )
        db.add(record)

    await db.commit()  
    await db.refresh(record)  
    return record

async def get_user_exercise_data_by_name(db: AsyncSession, user_id: int, exercise_name: str):
    stmt = select(UserExerciseData).filter(
        UserExerciseData.user_id == user_id,
        UserExerciseData.exercise_name == exercise_name
    )
    if not stmt:
        return None
    result = await db.execute(stmt)
    return result.scalars().first() 
