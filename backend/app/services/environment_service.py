from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.environmental_observation import (
    EnvironmentalObservation,
    ObservationSourceType,
    WeatherCondition,
)
from app.models.station import Station
from app.models.alert import Alert, AlertSeverity, AlertType, AlertStatus, AlertEntityType
from app.schemas.environment import (
    EnvironmentalObservationCreate,
    EnvironmentalRiskResponse,
    EnvironmentalForecastItem,
)
from app.ai.environmental_risk_engine import EnvironmentalRiskEngine
from app.services.providers.environmental import SimulatedEnvironmentalProvider


class EnvironmentService:
    provider = SimulatedEnvironmentalProvider()

    @classmethod
    def get_or_generate_latest(cls, db: Session, station_id: int) -> EnvironmentalObservation:
        """
        Retrieves the most recent observation for a station from PostgreSQL.
        If none exists or observation is older than 3 hours, generates and persists
        a realistic simulated observation to guarantee fresh demonstration data.
        """
        obs = (
            db.query(EnvironmentalObservation)
            .filter(EnvironmentalObservation.station_id == station_id)
            .order_by(desc(EnvironmentalObservation.timestamp))
            .first()
        )

        now = datetime.now(timezone.utc)
        if not obs or (now - (obs.timestamp.replace(tzinfo=timezone.utc) if obs.timestamp.tzinfo is None else obs.timestamp)) > timedelta(hours=3):
            sim_data = cls.provider.get_latest_observation(station_id)
            obs = EnvironmentalObservation(
                station_id=station_id,
                timestamp=sim_data["timestamp"],
                latitude=sim_data["latitude"],
                longitude=sim_data["longitude"],
                temperature=sim_data["temperature"],
                wind_speed=sim_data["wind_speed"],
                wind_direction=sim_data["wind_direction"],
                visibility=sim_data["visibility"],
                pressure=sim_data["pressure"],
                weather_condition=sim_data["weather_condition"],
                sea_ice_condition=sim_data["sea_ice_condition"],
                sea_ice_concentration=sim_data["sea_ice_concentration"],
                source_type=sim_data["source_type"],
                confidence=sim_data["confidence"],
                is_simulated=sim_data["is_simulated"],
            )
            db.add(obs)
            db.commit()
            db.refresh(obs)

        return obs

    @classmethod
    def record_observation(
        cls, db: Session, payload: EnvironmentalObservationCreate
    ) -> EnvironmentalObservation:
        """Persists a new environmental observation and triggers alerts if hazardous."""
        obs = EnvironmentalObservation(
            station_id=payload.station_id,
            timestamp=datetime.now(timezone.utc),
            latitude=payload.latitude,
            longitude=payload.longitude,
            temperature=payload.temperature,
            wind_speed=payload.wind_speed,
            wind_direction=payload.wind_direction,
            visibility=payload.visibility,
            pressure=payload.pressure,
            weather_condition=payload.weather_condition.value,
            sea_ice_condition=payload.sea_ice_condition.value,
            sea_ice_concentration=payload.sea_ice_concentration,
            source_type=payload.source_type.value,
            confidence=payload.confidence,
            is_simulated=payload.is_simulated,
        )
        db.add(obs)
        db.commit()
        db.refresh(obs)

        # Automated environmental alert evaluation
        cls._evaluate_and_trigger_alerts(db, obs)
        return obs

    @classmethod
    def get_all_current(cls, db: Session) -> List[EnvironmentalObservation]:
        """Returns the latest observation for every active station."""
        stations = db.query(Station).all()
        results = []
        for st in stations:
            obs = cls.get_or_generate_latest(db, st.id)
            results.append(obs)
        return results

    @classmethod
    def get_history(
        cls, db: Session, station_id: int, limit: int = 50
    ) -> List[EnvironmentalObservation]:
        """Returns chronological historical observations for a station."""
        # Ensure at least one observation exists
        cls.get_or_generate_latest(db, station_id)
        return (
            db.query(EnvironmentalObservation)
            .filter(EnvironmentalObservation.station_id == station_id)
            .order_by(desc(EnvironmentalObservation.timestamp))
            .limit(limit)
            .all()
        )

    @classmethod
    def get_risk(cls, db: Session, station_id: Optional[int] = None) -> EnvironmentalRiskResponse:
        """Evaluates environmental risk using the latest observation."""
        target_station_id = station_id or 1
        obs = cls.get_or_generate_latest(db, target_station_id)
        risk_data = EnvironmentalRiskEngine.evaluate(obs)

        return EnvironmentalRiskResponse(
            station_id=target_station_id,
            score=risk_data["score"],
            level=risk_data["level"],
            factors=risk_data["factors"],
            recommendations=risk_data["recommendations"],
            timestamp=risk_data["timestamp"],
            is_simulated=obs.is_simulated,
        )

    @classmethod
    def get_forecast(cls, db: Session, station_id: int) -> List[EnvironmentalForecastItem]:
        """Returns forecast projections for a station."""
        projections = cls.provider.get_forecast(station_id, hours_ahead=24)
        return [
            EnvironmentalForecastItem(
                timestamp=p["timestamp"],
                temperature=p["temperature"],
                wind_speed=p["wind_speed"],
                visibility=p["visibility"],
                weather_condition=p["weather_condition"],
                sea_ice_concentration=p["sea_ice_concentration"],
                source_type=p["source_type"],
                is_simulated=p["is_simulated"],
            )
            for p in projections
        ]

    @classmethod
    def get_environmental_alerts(cls, db: Session) -> List[Alert]:
        """Fetches active environmental alerts."""
        return (
            db.query(Alert)
            .filter(
                Alert.alert_type.in_([AlertType.WEATHER_BLIZZARD, AlertType.GENERAL]),
                Alert.status == AlertStatus.ACTIVE,
            )
            .order_by(desc(Alert.created_at))
            .limit(20)
            .all()
        )

    @staticmethod
    def _evaluate_and_trigger_alerts(db: Session, obs: EnvironmentalObservation):
        """Rule-based automated alert trigger on hazardous observation intake."""
        if obs.wind_speed >= 40.0:
            alert = Alert(
                title=f"Severe Blizzard Alert at Station #{obs.station_id}",
                message=f"Wind gusts reached {obs.wind_speed} knots with {obs.weather_condition}. Immediate outdoor movement ban.",
                severity=AlertSeverity.CRITICAL if obs.wind_speed >= 50 else AlertSeverity.HIGH,
                alert_type=AlertType.WEATHER_BLIZZARD,
                status=AlertStatus.ACTIVE,
                entity_type=AlertEntityType.STATION,
                entity_id=obs.station_id,
                station_id=obs.station_id,
            )
            db.add(alert)
            db.commit()
        elif obs.visibility < 1.0:
            alert = Alert(
                title=f"Whiteout Hazard Advisory at Station #{obs.station_id}",
                message=f"Horizontal visibility collapsed to {obs.visibility} km under {obs.weather_condition}. Disorientation hazard.",
                severity=AlertSeverity.HIGH,
                alert_type=AlertType.WEATHER_BLIZZARD,
                status=AlertStatus.ACTIVE,
                entity_type=AlertEntityType.STATION,
                entity_id=obs.station_id,
                station_id=obs.station_id,
            )
            db.add(alert)
            db.commit()
