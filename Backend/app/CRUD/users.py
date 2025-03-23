from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.user import User

async def get_user(db: AsyncSession, user_id: int):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)  
    return result.scalars().first()

async def get_user_by_email(db: AsyncSession, email: str):
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)  
    return result.scalars().first()

async def get_user_by_username(db: AsyncSession, username: str):
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    return result.scalars().first()

async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100):
    stmt = select(User).offset(skip).limit(limit)
    result = await db.execute(stmt) 
    return result.scalars().all()

# Create a user (async)
async def create_user(db: AsyncSession, username: str, email: str, hashed_password: str):
    user = User(username=username, email=email, hashed_password=hashed_password)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def update_user(db: AsyncSession, user_id: int, username: str, email: str, hashed_password: str):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if user:
        user.username = username
        user.email = email
        user.hashed_password = hashed_password
        await db.commit() 
        await db.refresh(user)  
        return user
    return None

async def delete_user(db: AsyncSession, user_id: int):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if user:
        await db.delete(user)
        await db.commit() 
        return user
    return None