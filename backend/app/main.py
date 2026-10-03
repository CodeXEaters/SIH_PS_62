from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.database import Base, engine, check_db_connection, run_schema_migrations
import app.models  # Ensure all models are registered with Base metadata
from app.api.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("dhruv.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting DHRUV Core Platform Backend...")
    try:
        check_db_connection()
        logger.info("Connected to PostgreSQL database successfully.")
        Base.metadata.create_all(bind=engine)
        run_schema_migrations()
        logger.info("Database tables and schema migrations verified / created.")

        # Ensure database is seeded if completely empty (initial cloud deployment)
        from app.models.user import User
        from app.database.session import SessionLocal
        with SessionLocal() as db:
            user_count = db.query(User).count()
            if user_count == 0:
                logger.info("PostgreSQL database has 0 users. Executing initial deterministic seed...")
                from app.database.seed import seed_database
                seed_database(db=db)
                logger.info("Initial deterministic seed completed successfully.")
            else:
                logger.info("PostgreSQL database verified seeded (%d existing users). Skipping seed.", user_count)
    except Exception as exc:
        logger.error("Database initialization check failed: %s", exc)
    yield
    logger.info("Shutting down DHRUV Core Platform Backend...")


app = FastAPI(
    title="DHRUV API",
    description="Integrated Polar Expedition Logistics and Asset Management System",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.routes.websocket import router as ws_router

# Mount canonical API v1 routes
app.include_router(api_router, prefix="/api/v1")

# Mount WebSocket endpoint at /ws for telemetry and alerts
app.include_router(ws_router, prefix="/ws", tags=["WebSocket"])


@app.get("/", tags=["Health"])
@app.get("/health", tags=["Health"])
def health():
    """Root health check endpoint."""
    return {"status": "ok", "message": "DHRUV backend is running"}
