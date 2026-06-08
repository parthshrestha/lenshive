import os

from dotenv import load_dotenv
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

load_dotenv()

# mysql+aiomysql://user:pass@host:3306/lenshive
DATABASE_URL = os.getenv("DATABASE_URL", "")

# pool_pre_ping survives RDS idle-disconnects; pool_recycle keeps connections under MySQL's wait_timeout.
engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_size=5,
    max_overflow=5,
) if DATABASE_URL else None

SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession) if engine else None


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncSession:
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="DATABASE_URL not configured")
    async with SessionLocal() as session:
        yield session
