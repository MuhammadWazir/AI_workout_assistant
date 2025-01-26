from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.schemas.user import UserCreate
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password, create_access_token, verify_password



router = APIRouter()

@router.post("/signup", status_code=201)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    
    try:
        stmt = select(User).where(User.email == user.email)
        print(stmt)
        result = await db.execute(stmt)
        print("I am here 1")
        existing_user = result.scalars().first()
        print("I am here 2")
        if existing_user:
            raise HTTPException(status_code=400, detail="Email is already registered.")

        # Hash the password
        hashed_password = hash_password(user.password)

        # Create and add a new user
        new_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        return {"message": "User created successfully", "user_id": new_user.id}

    except Exception as e:
        print(" YOU IDIOT ", Exception)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.post("/login")
async def login(user: UserCreate, db: AsyncSession = Depends(get_db)):
    
    stmt = select(User).where(User.email == user.email)
    print(stmt)
    result = await db.execute(stmt)
    print("I am here 1")
    existing_user = result.scalars().first()
    print("I am here 2")
    if not existing_user or not verify_password(user.password, existing_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Generate JWT token
    token = create_access_token({"sub": existing_user.email})
    return {"access_token": token, "token_type": "bearer"}
