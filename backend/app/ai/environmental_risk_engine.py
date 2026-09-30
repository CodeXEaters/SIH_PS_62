from datetime import datetime, timezone
from typing import Dict, Any, List
from app.models.environmental_observation import (
    EnvironmentalObservation,
    WeatherCondition,
    SeaIceCondition,
)


class EnvironmentalRiskEngine:
    """
    Explainable, rule-based environmental risk engine evaluating meteorological
    and cryospheric hazards across Antarctic and Arctic operational sectors.
    """

    @classmethod
    def evaluate(cls, obs: Any) -> Dict[str, Any]:
        """
        Calculates a deterministic composite environmental risk score (0-100)
        and outputs hazard drivers and operational mitigation recommendations.
        """
        temp = getattr(obs, "temperature", None) if not isinstance(obs, dict) else obs.get("temperature")
        wind = getattr(obs, "wind_speed", None) if not isinstance(obs, dict) else obs.get("wind_speed")
        vis = getattr(obs, "visibility", None) if not isinstance(obs, dict) else obs.get("visibility")
        weather = getattr(obs, "weather_condition", None) if not isinstance(obs, dict) else obs.get("weather_condition")
        ice_conc = getattr(obs, "sea_ice_concentration", None) if not isinstance(obs, dict) else obs.get("sea_ice_concentration")
        ice_cond = getattr(obs, "sea_ice_condition", None) if not isinstance(obs, dict) else obs.get("sea_ice_condition")

        score = 10.0  # Base polar ambient factor
        factors: List[str] = []
        recommendations: List[str] = []

        # 1. Wind Speed Analysis
        if wind is not None:
            if wind >= 50.0:
                score += 35.0
                factors.append(f"Severe gale/blizzard force winds ({wind} kts) exceeding safe traverse threshold")
                recommendations.append("Suspend all outdoor field traverses and aircraft sorties immediately")
            elif wind >= 35.0:
                score += 20.0
                factors.append(f"High katabatic winds ({wind} kts) with drifting snow")
                recommendations.append("Restrict vehicle operations to tracked rovers; establish buddy-line protocols")
            elif wind >= 25.0:
                score += 10.0
                factors.append(f"Moderate wind hazard ({wind} kts)")
                recommendations.append("Monitor barometric trend for storm development")

        # 2. Visibility & Whiteout Analysis
        if vis is not None:
            if vis < 0.5:
                score += 30.0
                factors.append(f"Extreme whiteout condition with visibility under 500m ({vis} km)")
                recommendations.append("Enact station lockdown; ground navigation beacons required for emergency sorties")
            elif vis < 1.5:
                score += 18.0
                factors.append(f"Restricted visibility ({vis} km) due to blowing snow / fog")
                recommendations.append("GPS waypoints mandatory; maintain satellite radar contact")
            elif vis < 3.0:
                score += 8.0
                factors.append(f"Reduced visibility ({vis} km)")

        # 3. Extreme Low Temperature (Cold Soak)
        if temp is not None:
            if temp <= -40.0:
                score += 25.0
                factors.append(f"Extreme cold soak ({temp}°C) risking hydraulic and battery failure")
                recommendations.append("Pre-heat generator manifolds; limit personnel outdoor exposure to 20 minutes")
            elif temp <= -30.0:
                score += 12.0
                factors.append(f"Sub-zero exposure ({temp}°C)")
                recommendations.append("Ensure thermal insulation and emergency survival bags aboard all transports")
            elif temp <= -20.0:
                score += 5.0
                factors.append(f"Polar chill ({temp}°C)")

        # 4. Sea Ice Hazard (for Marine / Coastal Operations)
        if ice_conc is not None and ice_conc >= 80.0:
            score += 15.0
            factors.append(f"Dense pack ice / consolidated ice cover ({ice_conc}%)")
            recommendations.append("Icebreaker escort required for marine approaches; check hull pressure ratings")

        # 5. Compound Hazard Multiplier
        if wind is not None and vis is not None:
            if wind >= 35.0 and vis < 1.0:
                score += 15.0
                factors.append("Compound hazard: Simultaneous high winds and whiteout create zero-reference navigation")
                recommendations.append("CRITICAL: Halt traverse convoys and anchor survival pods until front passes")

        # Clamp score 0 - 100
        score = round(min(100.0, max(0.0, score)), 1)

        # Classification mapping (0-30 LOW, 31-60 MEDIUM, 61-80 HIGH, 81-100 CRITICAL)
        if score >= 81.0:
            level = "CRITICAL"
        elif score >= 61.0:
            level = "HIGH"
        elif score >= 31.0:
            level = "MEDIUM"
        else:
            level = "LOW"

        if not recommendations:
            recommendations.append("Standard polar operations permitted under routine vigilance")

        return {
            "score": score,
            "level": level,
            "factors": factors,
            "recommendations": recommendations,
            "timestamp": datetime.now(timezone.utc),
        }
