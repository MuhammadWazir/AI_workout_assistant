from sqlalchemy.orm import Session
from app.models.user_exercise_data import UserExerciseData

def get_user_exercise_data(db: Session, user_id: int):
    return db.query(UserExerciseData).filter(UserExerciseData.user_id == user_id).all()

def update_user_exercise_data(db: Session, user_id: int, exercise_name: str, correct_percentage: float, incorrect_percentage: float):
    record = db.query(UserExerciseData).filter(
        UserExerciseData.user_id == user_id,
        UserExerciseData.exercise_name == exercise_name
    ).first()

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

    db.commit()
    db.refresh(record)
    return record

def get_user_exercise_data_by_name(db: Session, user_id: int, exercise_name: str):
    return db.query(UserExerciseData).filter(
        UserExerciseData.user_id == user_id,
        UserExerciseData.exercise_name == exercise_name
    ).first()
