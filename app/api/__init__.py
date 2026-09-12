from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.stations import router as stations_router
from app.api.personnel import router as personnel_router
from app.api.inventory import router as inventory_router
from app.api.assets import router as assets_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(stations_router, prefix="/stations", tags=["Stations"])
api_router.include_router(personnel_router, prefix="/personnel", tags=["Personnel"])
api_router.include_router(inventory_router, prefix="/inventory", tags=["Inventory"])
api_router.include_router(assets_router, prefix="/assets", tags=["Assets"])

__all__ = ["api_router"]
