from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session

from app.models.permit import Permit, PermitStatus
from app.models.personnel import Personnel, ReadinessStatus
from app.models.asset import Asset
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
        # 5. OVERALL STATUS DETERMINATION
        # -------------------------------------------------------------
        if any(c.status == "BLOCKED" for c in checks):
            overall = "BLOCKED"
        elif any(c.status == "WARNING" for c in checks):
            overall = "WARNING"
        else:
            overall = "PASS"

        if not recommendations:
            recommendations.append("All pre-departure clearance checks passed. Mission authorized for launch.")

        return PlanEvaluationResponse(
            overall_status=overall,
            checks=checks,
            recommendations=recommendations,
            evaluated_at=datetime.now(timezone.utc),
        )
