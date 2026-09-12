from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.personnel import Personnel
from app.models.cargo import Cargo
from app.models.mission import Mission, MissionStatus
from app.models.asset import Asset
from app.schemas.expedition import ExpeditionResponse, ExpeditionMilestone
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

STATIC_MILESTONES = [
    ExpeditionMilestone(
        id="M1",
        title="Expedition Mobilization & Goa Port Flag-off",
        location="Goa (NCPOR HQ)",
        date="15 Nov 2026",
        status="COMPLETED",
        description="MoES leadership flag-off; initial cargo verification and quarantine protocol sign-off.",
    ),
    ExpeditionMilestone(
        id="M2",
        title="Cape Town Staging & Vessel Loading",
        location="Cape Town Harbor",
        date="04 Dec 2026",
        status="COMPLETED",
        description="Charter vessel MV Vasiliy Golovnin loaded with polar modules, fuel bladders, and supplies.",
    ),
    ExpeditionMilestone(
        id="M3",
        title="Southern Ocean Transit & Roaring Forties Crossing",
        location="Southern Ocean (55°S 38°E)",
        date="18 Dec 2026",
        status="COMPLETED",
        description="Successfully navigated pack ice belt with satellite radar and reconnaissance assistance.",
    ),
    ExpeditionMilestone(
        id="M4",
        title="Bharati Station Ice Edge Fast-Ice Mooring",
        location="Prydz Bay, Bharati",
        date="08 Jan 2027",
        status="ACTIVE",
        description="Offloading heavy cargo and scientific instruments via Ka-32 helicopters and PistenBully sledges.",
    ),
    ExpeditionMilestone(
        id="M5",
        title="Maitri Resupply Traverse & Personnel Rotation",
        location="India Bay to Maitri",
        date="28 Jan 2027",
        status="PENDING",
        description="180 km inland heavy convoy traverse across blue ice moraine.",
    ),
    ExpeditionMilestone(
        id="M6",
        title="Wintering Team Handover & Final Sail-off",
        location="Antarctic Stations",
        date="15 Mar 2027",
        status="PENDING",
        description="Formal command transfer to 47th winter-over crew and station winterization.",
    ),
]


def _build_expedition_object(db: Session, exp_id: str = "ISEA-46") -> ExpeditionResponse:
    personnel_count = db.query(func.count(Personnel.id)).scalar() or 0
    total_kg = db.query(func.coalesce(func.sum(Cargo.weight), 0.0)).scalar() or 0.0
    cargo_tonnage = round(total_kg / 1000.0, 1)
    active_missions = (
        db.query(func.count(Mission.id))
        .filter(Mission.status == MissionStatus.ACTIVE)
        .scalar()
        or 0
    )
    avg_asset_health = db.query(func.coalesce(func.avg(Asset.health_score), 92.0)).scalar() or 92.0

    return ExpeditionResponse(
        id=exp_id,
        name="46th Indian Scientific Expedition to Antarctica",
        shortName="46th ISEA",
        season="2026-2027",
        status="ACTIVE",
        startDate="2026-11-15",
        endDate="2027-04-10",
        leader="Dr. Arvind Sharan (Scientist 'G', NCPOR)",
        vessel="MV Vasiliy Golovnin (Charter Icebreaker)",
        personnelCount=personnel_count,
        cargoTonnage=cargo_tonnage,
        activeMissionsCount=active_missions,
        overallReadinessPct=round(float(avg_asset_health), 1),
        milestones=STATIC_MILESTONES,
    )


@router.get("/active", response_model=ExpeditionResponse)
def get_active_expedition(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns currently active polar scientific expedition with live database metrics."""
    return _build_expedition_object(db, "ISEA-46")


@router.get("/{id}", response_model=ExpeditionResponse)
def get_expedition_by_id(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve an expedition dossier by ID."""
    if id not in ["ISEA-46", "46th-ISEA", "46"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expedition '{id}' not found",
        )
    return _build_expedition_object(db, "ISEA-46")


@router.get("", response_model=List[ExpeditionResponse])
def list_expeditions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all registered polar expeditions."""
    return [_build_expedition_object(db, "ISEA-46")]
