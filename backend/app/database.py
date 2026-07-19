"""
Motor async MongoDB connection manager (singleton).
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import env

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db() -> AsyncIOMotorDatabase:
    """Connect to MongoDB and return the database handle."""
    global _client, _db
    try:
        if _db is not None:
            return _db
        _client = AsyncIOMotorClient(env.MONGO_URL)
        _db = _client[env.DB_NAME]
        # Force a connection to verify it works
        await _client.admin.command("ping")
        print(f'[INFO] MongoDB connected -> db="{env.DB_NAME}"')
        return _db
    except Exception as exc:
        print(f"[ERROR] MongoDB connection failed: {exc}")
        raise


async def close_db() -> None:
    """Close the MongoDB connection."""
    global _client, _db
    try:
        if _client:
            _client.close()
            _client = None
            _db = None
    except Exception:
        pass


def get_db() -> AsyncIOMotorDatabase:
    """Return the current database handle (must call connect_db first)."""
    try:
        if _db is None:
            raise RuntimeError("Database not connected. Call connect_db() first.")
        return _db
    except Exception:
        raise
