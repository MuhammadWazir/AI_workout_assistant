from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from schemas.user import UserCreate
from database import get_db
from models.user import User
from schemas.user import UserCreate, UserLogin
from core.security import hash_password, create_access_token, verify_password

router = APIRouter()

@router.post("/signup", status_code=201)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        stmt = select(User).where(User.email == user.email)
        result = await db.execute(stmt)
        existing_user = result.scalars().first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email is already registered.")

        # Hash the password
        hashed_password = hash_password(user.password)

        # Create and add a new user
        new_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        token = create_access_token({"sub": user.email})
        return {"message": "User created successfully", "user_id": new_user.id, "token": token, "token_type": "bearer"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# @router.post("/login")
# async def login(user: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    
#     stmt = select(User).where(User.username == user.username)
#     print(stmt)
#     result = await db.execute(stmt)
#     print("I am here 1")
#     existing_user = result.scalars().first()
#     print("I am here 2")
#     if not existing_user or not verify_password(user.password, existing_user.hashed_password):
#         raise HTTPException(status_code=400, detail="Invalid credentials")

#     # Generate JWT token
#     token = create_access_token({"sub": str(user.)})
#     return {"access_token": token, "token_type": "bearer"}

@router.post("/login")
async def login_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.username == form_data.username) 
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Update here: Use user.id rather than user.email
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}
