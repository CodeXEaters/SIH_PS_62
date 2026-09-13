"""
Deterministic Development / Demo Database Reset & Reseed Utility for DHRUV / POLARIS.

Safety Requirements:
1. Must be local only (localhost or 127.0.0.1 in DATABASE_URL).
2. Must be the designated dhruv_db database.
3. Requires explicit environment variable DEMO_RESET=true.
4. Exits with non-zero code if safety checks fail.
"""

import os
import sys
import logging
from urllib.parse import urlparse

# Ensure app package is importable
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.config import settings
from app.database.session import SessionLocal, engine
from app.database.base import Base
from app.database.seed import seed_database
from app.models.user import User
from app.models.station import Station
from app.models.personnel import Personnel
from app.models.inventory import Inventory
from app.models.asset import Asset
from app.models.cargo import Cargo
from app.models.cargo_event import CargoEvent
from app.models.transport import Transport
from app.models.mission import Mission
from app.models.tracking_event import TrackingEvent
from app.models.alert import Alert
from app.models.emergency import Emergency
from app.models.inventory_transfer import InventoryTransfer
from app.models.fuel_log import FuelLog

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("dhruv.reset_demo_db")


def verify_safety_guards():
    """Validates that this is strictly a local dev/demo environment with explicit consent."""
    if os.getenv("DEMO_RESET", "").strip().lower() != "true":
        logger.error("SAFETY ERROR: DEMO_RESET=true environment variable is required to execute database reset.")
        sys.exit(1)

    db_url = settings.DATABASE_URL.lower()
    parsed = urlparse(db_url)
    hostname = parsed.hostname or ""

    if hostname not in ("localhost", "127.0.0.1"):
        logger.error(f"SAFETY ERROR: Database host '{hostname}' is not a permitted local development host (localhost/127.0.0.1).")
        sys.exit(1)

    if "dhruv" not in parsed.path.lower():
        logger.error(f"SAFETY ERROR: Database name '{parsed.path}' does not contain 'dhruv'. Aborting for safety.")
        sys.exit(1)

    logger.info("Safety checks passed: Confirmed local DHRUV demo database.")


def reset_and_reseed():
    """Drops application tables, recreates schema, and seeds canonical demo records."""
    verify_safety_guards()

    logger.info("Dropping existing DHRUV application tables...")
    # Drop all tables managed by Base metadata in dependency order
    Base.metadata.drop_all(bind=engine)

    logger.info("Recreating DHRUV application tables...")
    Base.metadata.create_all(bind=engine)

    logger.info("Running canonical demo seed...")
    db = SessionLocal()
    try:
        seed_database(db=db)
        
        # Verify and print exact deterministic row counts
        row_counts = {
            "users": db.query(User).count(),
            "stations": db.query(Station).count(),
            "personnel": db.query(Personnel).count(),
            "inventory": db.query(Inventory).count(),
            "assets": db.query(Asset).count(),
            "cargo": db.query(Cargo).count(),
            "cargo_events": db.query(CargoEvent).count(),
            "transports": db.query(Transport).count(),
            "missions": db.query(Mission).count(),
            "tracking_events": db.query(TrackingEvent).count(),
            "alerts": db.query(Alert).count(),
            "emergencies": db.query(Emergency).count(),
            "inventory_transfers": db.query(InventoryTransfer).count(),
            "fuel_logs": db.query(FuelLog).count(),
        }

        print("\n==================================================")
        print("  DHRUV DEMO DATABASE RESET & RESEED COMPLETE")
        print("==================================================")
        for table, count in row_counts.items():
            print(f"  * {table:22s}: {count}")
        print("==================================================\n")

        logger.info("Demo database successfully initialized to canonical state.")
    except Exception as e:
        logger.exception(f"FATAL: Database reset/reseed failed: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    reset_and_reseed()
