import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.permit import Permit, PermitStatus
from app.models.alert import Alert, AlertSeverity, AlertType, AlertStatus, AlertEntityType
from app.schemas.permit import PermitCreate, PermitUpdate, PermitStatusUpdate


class PermitService:
    @staticmethod
    def _generate_permit_number(permit_type: str) -> str:
        prefix = permit_type[:3].upper() if permit_type else "PRM"
        unique_suffix = uuid.uuid4().hex[:6].upper()
        year = datetime.now(timezone.utc).year
        return f"PRM-{prefix}-{year}-{unique_suffix}"

    @staticmethod
    def check_and_update_expiry_status(permit: Permit, db: Optional[Session] = None) -> str:
        now = datetime.now(timezone.utc)
        expiry = permit.expiry_date
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)

        if permit.status == PermitStatus.SUSPENDED.value:
            return permit.status

        if now > expiry:
            new_status = PermitStatus.EXPIRED.value
        elif expiry <= now + timedelta(days=30):
            new_status = PermitStatus.EXPIRING.value
        else:
            new_status = permit.status

        if new_status != permit.status and db is not None:
            permit.status = new_status
            db.commit()
            db.refresh(permit)

        return new_status

    @classmethod
    def list_permits(
        cls,
        db: Session,
        status: Optional[str] = None,
        station_id: Optional[int] = None,
        permit_type: Optional[str] = None,
        expedition_id: Optional[str] = None,
    ) -> List[Permit]:
        query = db.query(Permit)
        if status:
            query = query.filter(Permit.status == status.upper())
        if station_id:
            query = query.filter(Permit.station_id == station_id)
        if permit_type:
            query = query.filter(Permit.permit_type == permit_type)
        if expedition_id:
            query = query.filter(Permit.expedition_id == expedition_id)

        permits = query.order_by(Permit.expiry_date.asc()).all()
        # Refresh dynamic expiry statuses
        for p in permits:
            cls.check_and_update_expiry_status(p, db)
        return permits

    @classmethod
    def create_permit(cls, db: Session, payload: PermitCreate) -> Permit:
        permit_number = payload.permit_number or cls._generate_permit_number(payload.permit_type.value)

        # Determine initial status considering dates
        now = datetime.now(timezone.utc)
        expiry = payload.expiry_date
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)

        status_val = payload.status.value
        if now > expiry:
            status_val = PermitStatus.EXPIRED.value
        elif expiry <= now + timedelta(days=30) and status_val == PermitStatus.APPROVED.value:
            status_val = PermitStatus.EXPIRING.value

        permit = Permit(
            permit_number=permit_number,
            permit_type=payload.permit_type.value,
            issuing_authority=payload.issuing_authority,
            expedition_id=payload.expedition_id,
            station_id=payload.station_id,
            issue_date=payload.issue_date,
            expiry_date=payload.expiry_date,
            status=status_val,
            conditions=payload.conditions,
            responsible_officer=payload.responsible_officer,
            notes=payload.notes,
        )
        db.add(permit)
        db.commit()
        db.refresh(permit)

        # Trigger compliance alert if expired or expiring
        if status_val == PermitStatus.EXPIRED.value:
            cls._create_compliance_alert(
                db,
                title=f"Compliance Alert: Permit {permit.permit_number} Expired",
                message=f"Mandatory {permit.permit_type} permit expired on {permit.expiry_date.strftime('%Y-%m-%d')}. Field activities unauthorized.",
                severity=AlertSeverity.HIGH,
                permit=permit,
            )
        elif status_val == PermitStatus.EXPIRING.value:
            cls._create_compliance_alert(
                db,
                title=f"Compliance Warning: Permit {permit.permit_number} Expiring",
                message=f"Permit {permit.permit_number} ({permit.permit_type}) will expire on {permit.expiry_date.strftime('%Y-%m-%d')}. Initiate renewal immediately.",
                severity=AlertSeverity.MEDIUM,
                permit=permit,
            )

        return permit

    @classmethod
    def get_permit(cls, db: Session, permit_id: int) -> Optional[Permit]:
        permit = db.query(Permit).filter(Permit.id == permit_id).first()
        if permit:
            cls.check_and_update_expiry_status(permit, db)
        return permit

    @classmethod
    def update_permit(cls, db: Session, permit_id: int, payload: PermitUpdate) -> Optional[Permit]:
        permit = db.query(Permit).filter(Permit.id == permit_id).first()
        if not permit:
            return None

        update_dict = payload.model_dump(exclude_unset=True)
        if "permit_type" in update_dict and update_dict["permit_type"] is not None:
            update_dict["permit_type"] = update_dict["permit_type"].value
        if "status" in update_dict and update_dict["status"] is not None:
            update_dict["status"] = update_dict["status"].value

        for key, value in update_dict.items():
            setattr(permit, key, value)

        cls.check_and_update_expiry_status(permit)
        db.commit()
        db.refresh(permit)
        return permit

    @classmethod
    def update_permit_status(cls, db: Session, permit_id: int, payload: PermitStatusUpdate) -> Optional[Permit]:
        permit = db.query(Permit).filter(Permit.id == permit_id).first()
        if not permit:
            return None

        permit.status = payload.status.value
        if payload.notes:
            existing = permit.notes or ""
            permit.notes = f"{existing}\n[Status Change to {payload.status.value}]: {payload.notes}".strip()

        db.commit()
        db.refresh(permit)
        return permit

    @classmethod
    def get_expiring_permits(cls, db: Session, days_ahead: int = 30) -> List[Permit]:
        now = datetime.now(timezone.utc)
        target = now + timedelta(days=days_ahead)
        permits = db.query(Permit).filter(
            or_(
                Permit.status == PermitStatus.EXPIRED.value,
                Permit.status == PermitStatus.EXPIRING.value,
                Permit.expiry_date <= target,
            )
        ).order_by(Permit.expiry_date.asc()).all()

        for p in permits:
            cls.check_and_update_expiry_status(p, db)
        return permits

    @classmethod
    def get_permit_summary(cls, db: Session) -> dict:
        all_permits = db.query(Permit).all()
        for p in all_permits:
            cls.check_and_update_expiry_status(p, db)

        summary = {
            "total": len(all_permits),
            "approved": sum(1 for p in all_permits if p.status == PermitStatus.APPROVED.value),
            "expiring_soon": sum(1 for p in all_permits if p.status == PermitStatus.EXPIRING.value),
            "expired": sum(1 for p in all_permits if p.status == PermitStatus.EXPIRED.value),
            "pending": sum(1 for p in all_permits if p.status == PermitStatus.PENDING.value),
            "suspended": sum(1 for p in all_permits if p.status == PermitStatus.SUSPENDED.value),
        }
        return summary

    @staticmethod
    def _create_compliance_alert(db: Session, title: str, message: str, severity: AlertSeverity, permit: Permit):
        alert = Alert(
            title=title,
            message=message,
            severity=severity,
            alert_type=AlertType.GENERAL,
            status=AlertStatus.ACTIVE,
            entity_type=AlertEntityType.STATION if permit.station_id else AlertEntityType.SYSTEM,
            entity_id=permit.station_id or 1,
            station_id=permit.station_id,
        )
        db.add(alert)
        db.commit()
