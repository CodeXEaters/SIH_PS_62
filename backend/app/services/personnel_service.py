from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.personnel import Personnel, ReadinessStatus, HealthClearanceStatus
from app.models.alert import Alert, AlertSeverity, AlertType, AlertStatus, AlertEntityType
from app.schemas.personnel import PersonnelReadinessUpdate, PersonnelReadinessSummary


class PersonnelService:
    @staticmethod
    def evaluate_readiness(personnel: Personnel, db: Optional[Session] = None) -> str:
        """
        Determines personnel operational readiness based on medical clearance,
        clearance expiration, and health restrictions.
        """
        now = datetime.now(timezone.utc)
        current_readiness = personnel.readiness_status or ReadinessStatus.READY.value

        if personnel.clearance_expiry:
            expiry = personnel.clearance_expiry
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)
            if now > expiry:
                new_readiness = ReadinessStatus.CLEARANCE_EXPIRED.value
                if new_readiness != current_readiness:
                    personnel.readiness_status = new_readiness
                    if db:
                        db.commit()
                        db.refresh(personnel)
                return new_readiness

        if not personnel.medical_clearance or personnel.health_clearance_status in [
            HealthClearanceStatus.RESTRICTED.value,
            HealthClearanceStatus.REVOKED.value,
        ]:
            if personnel.health_clearance_status == HealthClearanceStatus.RESTRICTED.value:
                new_readiness = ReadinessStatus.LIMITED.value
            else:
                new_readiness = ReadinessStatus.NOT_READY.value

            if new_readiness != current_readiness:
                personnel.readiness_status = new_readiness
                if db:
                    db.commit()
                    db.refresh(personnel)
            return new_readiness

        return personnel.readiness_status or ReadinessStatus.READY.value

    @classmethod
    def update_readiness(
        cls, db: Session, personnel_id: int, payload: PersonnelReadinessUpdate
    ) -> Optional[Personnel]:
        personnel = db.query(Personnel).filter(Personnel.id == personnel_id).first()
        if not personnel:
            return None

        update_dict = payload.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(personnel, key, val)

        # Re-evaluate readiness
        cls.evaluate_readiness(personnel, db)
        db.commit()
        db.refresh(personnel)

        # Trigger readiness alert if not ready or clearance expired
        if personnel.readiness_status in [
            ReadinessStatus.NOT_READY.value,
            ReadinessStatus.CLEARANCE_EXPIRED.value,
        ]:
            alert = Alert(
                title=f"Readiness Alert: {personnel.name} {personnel.readiness_status}",
                message=f"Personnel {personnel.name} ({personnel.designation}, Station #{personnel.station_id}) is marked {personnel.readiness_status}. Field deployment restricted.",
                severity=AlertSeverity.HIGH,
                alert_type=AlertType.GENERAL,
                status=AlertStatus.ACTIVE,
                entity_type=AlertEntityType.PERSONNEL if hasattr(AlertEntityType, "PERSONNEL") else AlertEntityType.STATION,
                entity_id=personnel.station_id,
                station_id=personnel.station_id,
            )
            db.add(alert)
            db.commit()

        return personnel

    @classmethod
    def get_readiness_summary(cls, db: Session) -> PersonnelReadinessSummary:
        personnel_list = db.query(Personnel).all()
        for p in personnel_list:
            cls.evaluate_readiness(p, db)

        tot = len(personnel_list)
        ready_cnt = sum(1 for p in personnel_list if (p.readiness_status or "READY") == ReadinessStatus.READY.value)
        limited_cnt = sum(1 for p in personnel_list if p.readiness_status == ReadinessStatus.LIMITED.value)
        not_ready_cnt = sum(1 for p in personnel_list if p.readiness_status == ReadinessStatus.NOT_READY.value)
        expired_cnt = sum(1 for p in personnel_list if p.readiness_status == ReadinessStatus.CLEARANCE_EXPIRED.value)
        pct = round((ready_cnt / tot * 100.0), 1) if tot > 0 else 0.0

        return PersonnelReadinessSummary(
            total=tot,
            ready=ready_cnt,
            limited=limited_cnt,
            not_ready=not_ready_cnt,
            clearance_expired=expired_cnt,
            total_personnel=tot,
            ready_count=ready_cnt,
            limited_count=limited_cnt,
            expired_count=expired_cnt,
            unfit_count=not_ready_cnt,
            readiness_percentage=pct,
        )
