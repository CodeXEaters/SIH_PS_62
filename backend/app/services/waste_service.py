from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict
from sqlalchemy.orm import Session

from app.models.waste_record import WasteRecord, WasteCategory, WasteStatus, DisposalMethod
from app.models.alert import Alert, AlertSeverity, AlertType, AlertStatus, AlertEntityType
from app.schemas.waste import WasteRecordCreate, WasteRecordUpdate, WasteSummaryResponse


class WasteService:
    @classmethod
    def list_records(
        cls,
        db: Session,
        station_id: Optional[int] = None,
        category: Optional[str] = None,
        hazardous: Optional[bool] = None,
        status: Optional[str] = None,
    ) -> List[WasteRecord]:
        query = db.query(WasteRecord)
        if station_id:
            query = query.filter(WasteRecord.station_id == station_id)
        if category:
            query = query.filter(WasteRecord.waste_category == category.upper())
        if hazardous is not None:
            query = query.filter(WasteRecord.hazardous == hazardous)
        if status:
            query = query.filter(WasteRecord.status == status.upper())

        return query.order_by(WasteRecord.generated_at.desc()).all()

    @classmethod
    def create_record(cls, db: Session, payload: WasteRecordCreate) -> WasteRecord:
        record = WasteRecord(
            station_id=payload.station_id,
            waste_category=payload.waste_category.value,
            quantity=payload.quantity,
            unit=payload.unit,
            disposal_method=payload.disposal_method.value,
            storage_location=payload.storage_location,
            hazardous=payload.hazardous,
            status=payload.status.value,
            generated_at=payload.generated_at or datetime.now(timezone.utc),
            responsible_personnel_id=payload.responsible_personnel_id,
            notes=payload.notes,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        # Check compliance rules
        cls._evaluate_compliance_triggers(db, record)
        return record

    @classmethod
    def get_record(cls, db: Session, record_id: int) -> Optional[WasteRecord]:
        return db.query(WasteRecord).filter(WasteRecord.id == record_id).first()

    @classmethod
    def update_record(cls, db: Session, record_id: int, payload: WasteRecordUpdate) -> Optional[WasteRecord]:
        record = db.query(WasteRecord).filter(WasteRecord.id == record_id).first()
        if not record:
            return None

        update_dict = payload.model_dump(exclude_unset=True)
        if "waste_category" in update_dict and update_dict["waste_category"] is not None:
            update_dict["waste_category"] = update_dict["waste_category"].value
        if "disposal_method" in update_dict and update_dict["disposal_method"] is not None:
            update_dict["disposal_method"] = update_dict["disposal_method"].value
        if "status" in update_dict and update_dict["status"] is not None:
            update_dict["status"] = update_dict["status"].value
            if update_dict["status"] in [WasteStatus.PROCESSED.value, WasteStatus.DISPOSED.value]:
                if not record.processed_at:
                    record.processed_at = datetime.now(timezone.utc)

        for k, v in update_dict.items():
            setattr(record, k, v)

        db.commit()
        db.refresh(record)
        return record

    @classmethod
    def get_summary(cls, db: Session) -> WasteSummaryResponse:
        records = db.query(WasteRecord).all()
        total_qty = sum(r.quantity for r in records)
        haz_stored = sum(r.quantity for r in records if r.hazardous and r.status == WasteStatus.STORED.value)
        retro_pending = sum(
            r.quantity for r in records
            if r.disposal_method == DisposalMethod.RETROGRADE_SHIPMENT.value and r.status != WasteStatus.DISPOSED.value
        )

        categories: Dict[str, float] = {}
        statuses: Dict[str, int] = {}
        for r in records:
            categories[r.waste_category] = categories.get(r.waste_category, 0.0) + r.quantity
            statuses[r.status] = statuses.get(r.status, 0) + 1

        compliance = "COMPLIANT"
        if haz_stored > 1000.0:
            compliance = "WARNING_HIGH_HAZARDOUS_ACCUMULATION"
        elif any(
            r.hazardous and r.status == WasteStatus.STORED.value and
            (datetime.now(timezone.utc) - (r.generated_at.replace(tzinfo=timezone.utc) if r.generated_at.tzinfo is None else r.generated_at)) > timedelta(days=90)
            for r in records
        ):
            compliance = "ACTION_REQUIRED_OVERDUE_RETROGRADE"

        return WasteSummaryResponse(
            total_records=len(records),
            total_quantity_kg=round(total_qty, 1),
            hazardous_stored_kg=round(haz_stored, 1),
            retrograde_pending_kg=round(retro_pending, 1),
            category_breakdown=categories,
            status_breakdown=statuses,
            compliance_status=compliance,
        )

    @staticmethod
    def _evaluate_compliance_triggers(db: Session, record: WasteRecord):
        if record.hazardous and record.quantity >= 250.0:
            alert = Alert(
                title=f"Environmental Compliance: Hazardous Waste Logged ({record.quantity} {record.unit})",
                message=f"Station #{record.station_id} logged high-volume hazardous waste ({record.waste_category}). Ensure strict containment in {record.storage_location}.",
                severity=AlertSeverity.HIGH,
                alert_type=AlertType.GENERAL,
                status=AlertStatus.ACTIVE,
                entity_type=AlertEntityType.STATION,
                entity_id=record.station_id,
                station_id=record.station_id,
            )
            db.add(alert)
            db.commit()
