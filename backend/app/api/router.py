from fastapi import APIRouter
from app.api.routes.auth import router as auth_router
from app.api.routes.stations import router as stations_router
from app.api.routes.personnel import router as personnel_router
from app.api.routes.inventory import router as inventory_router
from app.api.routes.assets import router as assets_router
from app.api.routes.cargo import router as cargo_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(stations_router, prefix="/stations", tags=["Stations"])
api_router.include_router(personnel_router, prefix="/personnel", tags=["Personnel"])
api_router.include_router(inventory_router, prefix="/inventory", tags=["Inventory"])
api_router.include_router(assets_router, prefix="/assets", tags=["Assets"])
api_router.include_router(cargo_router, prefix="/cargo", tags=["Cargo"])

__all__ = ["api_router"]
