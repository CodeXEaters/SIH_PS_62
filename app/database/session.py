import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import OperationalError
from app.config import settings

logger = logging.getLogger("dhruv.database")

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def check_db_connection() -> bool:
    """
    Verifies connection to the PostgreSQL database.
    Fails clearly with an actionable message if PostgreSQL is unreachable.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except OperationalError as exc:
        error_msg = (
            f"\n"
            f"================================================================================\n"
            f"❌ DHRUV DATABASE CONNECTION FAILURE\n"
            f"================================================================================\n"
            f"Could not connect to PostgreSQL database at:\n"
            f"  {settings.DATABASE_URL}\n\n"
            f"Please ensure PostgreSQL 16 is running via Docker Compose:\n"
            f"  docker compose up -d\n\n"
            f"Or check the status of your PostgreSQL service:\n"
            f"  docker compose ps\n"
            f"  docker compose logs db\n\n"
            f"Underlying error:\n"
            f"  {exc}\n"
            f"================================================================================\n"
        )
        logger.critical(error_msg)
        raise RuntimeError(error_msg) from exc


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a database session.
    Fails with an actionable message if the database connection drops.
    """
    db = SessionLocal()
    try:
        yield db
    except OperationalError as exc:
        logger.error("Database connection lost during request: %s", exc)
        raise RuntimeError(
            f"PostgreSQL connection lost. Ensure the database is running: 'docker compose up -d'. Error: {exc}"
        ) from exc
    finally:
        db.close()
