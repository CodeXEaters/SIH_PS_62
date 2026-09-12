from app.api.routes.auth import router as auth_router
from app.api.routes.stations import router as stations_router
from app.api.routes.personnel import router as personnel_router
from app.api.routes.inventory import router as inventory_router
from app.api.routes.assets import router as assets_router

__all__ = [
    "auth_router",
    "stations_router",
    "personnel_router",
    "inventory_router",
    "assets_router",
]
