from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session

from app.models.permit import Permit, PermitStatus
from app.models.personnel import Personnel, ReadinessStatus
from app.models.asset import Asset
from app.models.cargo import Cargo, CargoStatus
from app.models.inventory import Inventory
from app.schemas.expedition_evaluation import (
    PlanEvaluationRequest,
    PlanEvaluationResponse,
    PlanEvaluationCheckItem,
)
from app.services.environment_service import EnvironmentService
from app.services.permit_service import PermitService
from app.services.personnel_service import PersonnelService


class ExpeditionPlannerService:
    @classmethod
    def evaluate_plan(cls, db: Session, payload: PlanEvaluationRequest) -> PlanEvaluationResponse:
        checks: List[PlanEvaluationCheckItem] = []
        recommendations: List[str] = []

        now = datetime.now(timezone.utc)
        return_time = payload.expected_return
        if return_time.tzinfo is None:
            return_time = return_time.replace(tzinfo=timezone.utc)

        # -------------------------------------------------------------
        # 1. PERMIT VALIDITY CHECK
        # -------------------------------------------------------------
        if payload.requires_permit:
            if not payload.permit_id:
                checks.append(PlanEvaluationCheckItem(
                    category="PERMIT",
                    status="BLOCKED",
                    details="Scientific traverse requires an authorized Antarctic Treaty permit, but none is attached."
                ))
                recommendations.append("Obtain and link an approved NCPOR / ATS permit before dispatch.")
            else:
                permit = PermitService.get_permit(db, payload.permit_id)
                if not permit:
                    checks.append(PlanEvaluationCheckItem(
                        category="PERMIT",
                        status="BLOCKED",
                        details=f"Attached permit ID {payload.permit_id} does not exist in registry."
                    ))
                elif permit.status == PermitStatus.EXPIRED.value:
                    checks.append(PlanEvaluationCheckItem(
                        category="PERMIT",
                        status="BLOCKED",
                        details=f"Required permit {permit.permit_number} expired on {permit.expiry_date.strftime('%Y-%m-%d')}."
                    ))
                    recommendations.append("Renew expired permit with NCPOR Directorate before launching mission.")
                else:
                    p_exp = permit.expiry_date
                    if p_exp.tzinfo is None:
                        p_exp = p_exp.replace(tzinfo=timezone.utc)
                    else:
                        p_exp = p_exp.astimezone(timezone.utc)

                    if p_exp < return_time:
                        checks.append(PlanEvaluationCheckItem(
                            category="PERMIT",
                            status="WARNING",
                            details=f"Permit {permit.permit_number} will expire on {permit.expiry_date.strftime('%Y-%m-%d')} prior to planned return {return_time.strftime('%Y-%m-%d')}."
                        ))
                        recommendations.append("Apply for expedition permit extension to cover entire traverse duration.")
                    else:
                        checks.append(PlanEvaluationCheckItem(
                            category="PERMIT",
                            status="PASS",
                            details=f"Permit {permit.permit_number} is valid, approved, and active."
                        ))
        else:
            checks.append(PlanEvaluationCheckItem(
                category="PERMIT",
                status="PASS",
                details="Routine local station operations; no special Antarctic Treaty permit required."
            ))

        # -------------------------------------------------------------
        # 2. PERSONNEL READINESS CHECK
        # -------------------------------------------------------------
        personnel_ids = list(set([payload.team_lead_id] + (payload.assigned_personnel_ids or [])))
        personnel_members = db.query(Personnel).filter(Personnel.id.in_(personnel_ids)).all()

        p_status = "PASS"
        p_details = []

        for p in personnel_members:
            readiness = PersonnelService.evaluate_readiness(p, db)
            if readiness == ReadinessStatus.CLEARANCE_EXPIRED.value:
                p_status = "BLOCKED"
                p_details.append(f"{p.name}: Medical clearance expired on {p.clearance_expiry.strftime('%Y-%m-%d') if p.clearance_expiry else 'N/A'}")
                recommendations.append(f"Conduct expedited medical examination for {p.name} prior to departure.")
            elif readiness == ReadinessStatus.NOT_READY.value:
                p_status = "BLOCKED"
                p_details.append(f"{p.name}: Marked NOT_READY for field deployment")
                recommendations.append(f"Replace crew member {p.name} with certified backup personnel.")
            elif readiness == ReadinessStatus.LIMITED.value:
                if p_status != "BLOCKED":
                    p_status = "WARNING"
                p_details.append(f"{p.name}: Operational limitations noted ({p.restrictions_notes or 'Restricted duties'})")

        if not p_details:
            p_details.append(f"All {len(personnel_members)} assigned crew members (including Team Lead) are medically cleared and READY.")

        checks.append(PlanEvaluationCheckItem(
            category="PERSONNEL",
            status=p_status,
            details="; ".join(p_details)
        ))

        # -------------------------------------------------------------
        # 3. ASSET AVAILABILITY CHECK
        # -------------------------------------------------------------
        if payload.assigned_asset_ids:
            assets = db.query(Asset).filter(Asset.id.in_(payload.assigned_asset_ids)).all()
            a_status = "PASS"
            a_details = []
            for ast in assets:
                if ast.status != "OPERATIONAL":
                    a_status = "WARNING"
                    a_details.append(f"{ast.asset_name} is currently in {ast.status} status")
                    recommendations.append(f"Confirm pre-departure maintenance signoff for {ast.asset_name}.")
                elif ast.health_score and ast.health_score < 60.0:
                    a_status = "WARNING"
                    a_details.append(f"{ast.asset_name} has degraded health score ({ast.health_score}%)")
            if not a_details:
                a_details.append(f"All {len(assets)} assigned vehicles and equipment are OPERATIONAL.")
            checks.append(PlanEvaluationCheckItem(
                category="ASSET",
                status=a_status,
                details="; ".join(a_details)
            ))
        else:
            checks.append(PlanEvaluationCheckItem(
                category="ASSET",
                status="PASS",
                details="Pedestrian / local traverse; no tracked assets assigned."
            ))

        # -------------------------------------------------------------
        # 4. ENVIRONMENTAL HAZARD CHECK
        # -------------------------------------------------------------
        env_risk = EnvironmentService.get_risk(db, payload.origin_station_id)
        origin_obs = EnvironmentService.get_or_generate_latest(db, payload.origin_station_id)

        if env_risk.level == "CRITICAL" or origin_obs.wind_speed >= 45.0 or origin_obs.visibility < 0.5:
            e_status = "BLOCKED"
            e_details = f"CRITICAL weather hazard at station sector: {origin_obs.wind_speed} kts winds, visibility {origin_obs.visibility} km ({origin_obs.weather_condition})."
            recommendations.append("Postpone departure until gale-force winds subside below 35 kts.")
        elif env_risk.level == "HIGH" or origin_obs.wind_speed >= 30.0 or origin_obs.visibility < 2.0:
            e_status = "WARNING"
            e_details = f"HIGH environmental risk: {origin_obs.wind_speed} kts winds with {origin_obs.weather_condition}. Blowing snow caution."
            recommendations.append("Ensure redundant GPS navigators and survival shelters aboard.")
        else:
            e_status = "PASS"
            e_details = f"Environment favorable: {origin_obs.temperature}°C, {origin_obs.wind_speed} kts, visibility {origin_obs.visibility} km ({origin_obs.weather_condition})."

        checks.append(PlanEvaluationCheckItem(
            category="ENVIRONMENT",
            status=e_status,
            details=e_details
        ))

        # -------------------------------------------------------------
        # 5. CARGO & LOGISTICS READINESS CHECK
        # -------------------------------------------------------------
        c_status = "PASS"
        c_details = []
        if payload.assigned_cargo_ids:
            cargo_items = db.query(Cargo).filter(Cargo.id.in_(payload.assigned_cargo_ids)).all()
            for c in cargo_items:
                if c.status == CargoStatus.DELAYED:
                    c_status = "WARNING" if c_status != "BLOCKED" else "BLOCKED"
                    c_details.append(f"{c.cargo_code} ({c.name}) is DELAYED at {c.current_location}")
                    recommendations.append(f"Verify alternative cargo allocation or wait for {c.cargo_code} arrival.")
                elif c.status in [CargoStatus.PACKED, CargoStatus.DISPATCHED, CargoStatus.ARRIVED, CargoStatus.DELIVERED, CargoStatus.IN_TRANSIT]:
                    pass
                else:
                    c_details.append(f"{c.cargo_code} status is {c.status.value}")
            if not c_details:
                c_details.append(f"All {len(cargo_items)} assigned cargo packages are staged and ready for transit.")
        else:
            c_details.append("No specialized cargo manifests designated for this sortie.")

        checks.append(PlanEvaluationCheckItem(
            category="CARGO",
            status=c_status,
            details="; ".join(c_details)
        ))

        # -------------------------------------------------------------
        # 6. INVENTORY & LIFE-SUPPORT RESERVE CHECK
        # -------------------------------------------------------------
        inv_status = "PASS"
        inv_details = []
        fuel_items = (
            db.query(Inventory)
            .filter(Inventory.station_id == payload.origin_station_id, Inventory.category == "FUEL")
            .all()
        )
        for fuel in fuel_items:
            daily = fuel.daily_consumption if fuel.daily_consumption > 0 else 1.0
            fuel_days = fuel.quantity / daily
            if fuel_days < 7.0:
                inv_status = "BLOCKED"
                inv_details.append(f"Station {fuel.item_name} at critical reserve: {round(fuel_days, 1)} days remaining")
                recommendations.append("Suspend non-essential sorties until station fuel replenishment is confirmed.")
            elif fuel_days < 14.0 and inv_status != "BLOCKED":
                inv_status = "WARNING"
                inv_details.append(f"Station {fuel.item_name} approaching reserve threshold: {round(fuel_days, 1)} days remaining")

        if not inv_details:
            inv_details.append("Origin station life-support reserves and fuel buffers are nominal (>14 days).")

        checks.append(PlanEvaluationCheckItem(
            category="INVENTORY",
            status=inv_status,
            details="; ".join(inv_details)
        ))

        # -------------------------------------------------------------
        # 7. MULTI-FACTOR RISK LEVEL & READINESS SCORE
        # -------------------------------------------------------------
        readiness_score = 100.0
        for c in checks:
            if c.status == "BLOCKED":
                readiness_score -= 35.0
            elif c.status == "WARNING":
                readiness_score -= 12.0
        readiness_score = max(0.0, min(100.0, round(readiness_score, 1)))

        if any(c.status == "BLOCKED" for c in checks):
            overall = "BLOCKED"
            risk_level = "CRITICAL"
        elif any(c.status == "WARNING" for c in checks):
            overall = "WARNING"
            risk_level = "HIGH"
        else:
            overall = "PASS"
            risk_level = "LOW"

        checks.append(PlanEvaluationCheckItem(
            category="RISK",
            status=overall,
            details=f"Composite Operational Readiness: {readiness_score}% (Risk Level: {risk_level})"
        ))

        if not recommendations:
            recommendations.append("All pre-departure clearance checks passed. Mission authorized for launch.")

        return PlanEvaluationResponse(
            overall_status=overall,
            readiness_score=readiness_score,
            risk_level=risk_level,
            checks=checks,
            recommendations=recommendations,
            evaluated_at=datetime.now(timezone.utc),
        )
