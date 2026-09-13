import logging
from datetime import datetime, date, timedelta, timezone
from sqlalchemy.orm import Session

from app.database.session import SessionLocal, engine
from app.database.base import Base
from app.models.user import User, UserRole
from app.models.station import Station
from app.models.personnel import Personnel
from app.models.inventory import Inventory
from app.models.asset import Asset
from app.models.cargo import Cargo, CargoCategory, CargoPriority, CargoStatus
from app.models.cargo_event import CargoEvent, CargoEventType
from app.models.transport import Transport, TransportType, TransportStatus
from app.models.mission import Mission, MissionType, MissionStatus, MissionRiskLevel
from app.models.tracking_event import TrackingEvent, TrackingEntityType
from app.models.alert import Alert, AlertSeverity, AlertType, AlertStatus, AlertEntityType
from app.models.emergency import Emergency, EmergencySeverity, EmergencyType, EmergencyStatus, EmergencyDecision
from app.models.inventory_transfer import InventoryTransfer
from app.models.fuel_log import FuelLog
from app.core.security import get_password_hash

logger = logging.getLogger("dhruv.seed")


def seed_database(db: Session = None) -> None:
    """Populates the database with realistic Polar Expedition seed data."""
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # 1. Verify / Create Tables
        Base.metadata.create_all(bind=engine)

        logger.info("Seeding DHRUV Polar Expedition Platform...")

        # 2. Seed Users
        users_data = [
            {
                "email": "admin@dhruv.gov.in",
                "password": "Admin@123456",
                "full_name": "Dr. Rajeshwar Sharma (Admin)",
                "role": UserRole.ADMIN,
            },
            {
                "email": "ops@dhruv.gov.in",
                "password": "Ops@123456",
                "full_name": "Col. Vikram Malhotra (Operations Lead)",
                "role": UserRole.OPERATIONS,
            },
            {
                "email": "logistics@dhruv.gov.in",
                "password": "Logistics@123456",
                "full_name": "Sanjay Deshmukh (Logistics Director)",
                "role": UserRole.LOGISTICS,
            },
            {
                "email": "station_mgr@dhruv.gov.in",
                "password": "Station@123456",
                "full_name": "Commander Sunita Rao (Base Commander)",
                "role": UserRole.STATION_MANAGER,
            },
            {
                "email": "doctor@dhruv.gov.in",
                "password": "Doctor@123456",
                "full_name": "Dr. Amitav Ghosh (Chief Medical Officer)",
                "role": UserRole.MEDICAL,
            },
            {
                "email": "scientist@dhruv.gov.in",
                "password": "Scientist@123456",
                "full_name": "Dr. Priya Nair (Senior Glaciologist)",
                "role": UserRole.SCIENTIST,
            },
        ]

        created_users = {}
        for u in users_data:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                user = User(
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    is_active=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                created_users[u["email"]] = user
            else:
                created_users[u["email"]] = existing

        # 3. Seed 5 Stations (Exact Stations from Playbook)
        stations_data = [
            {
                "name": "NCPOR Goa",
                "location": "Headquarters, Vasco da Gama, Goa, India",
                "latitude": 15.4026,
                "longitude": 73.8055,
                "type": "HQ",
                "status": "OPERATIONAL",
            },
            {
                "name": "Cape Town Transit Hub",
                "location": "Port of Cape Town Logistics Base, South Africa",
                "latitude": -33.9249,
                "longitude": 18.4241,
                "type": "TRANSIT_HUB",
                "status": "OPERATIONAL",
            },
            {
                "name": "Maitri Station",
                "location": "Schirmacher Oasis, Queen Maud Land, Antarctica",
                "latitude": -70.7667,
                "longitude": 11.7333,
                "type": "PERMANENT_STATION",
                "status": "OPERATIONAL",
            },
            {
                "name": "Bharati Station",
                "location": "Larsemann Hills, East Antarctica",
                "latitude": -69.4067,
                "longitude": 76.1906,
                "type": "PERMANENT_STATION",
                "status": "OPERATIONAL",
            },
            {
                "name": "Field Camp Alpha",
                "location": "Queen Maud Land Deep Core Site, Antarctica",
                "latitude": -71.2000,
                "longitude": 12.5000,
                "type": "FIELD_CAMP",
                "status": "OPERATIONAL",
            },
            {
                "name": "Field Camp Echo",
                "location": "Amery Ice Shelf, East Antarctica",
                "latitude": -69.7500,
                "longitude": 73.5000,
                "type": "FIELD_CAMP",
                "status": "OPERATIONAL",
            },
        ]

        created_stations = {}
        for s in stations_data:
            existing = db.query(Station).filter(Station.name == s["name"]).first()
            if not existing:
                st = Station(**s)
                db.add(st)
                db.commit()
                db.refresh(st)
                created_stations[s["name"]] = st
            else:
                created_stations[s["name"]] = existing

        # 4. Seed 12 Personnel
        now = datetime.now(timezone.utc)
        personnel_data = [
            {
                "name": "Dr. Priya Nair",
                "designation": "Lead Glaciologist",
                "team": "Atmospheric Science",
                "station_id": created_stations["Bharati Station"].id,
                "current_location": "Bharati Main Laboratory",
                "status": "ACTIVE",
                "medical_clearance": True,
                "emergency_contact": "+91-9876543210",
                "user_id": created_users["scientist@dhruv.gov.in"].id,
                "last_check_in": now,
            },
            {
                "name": "Commander Sunita Rao",
                "designation": "Station Commander",
                "team": "Station Command",
                "station_id": created_stations["Maitri Station"].id,
                "current_location": "Maitri Operations Bridge",
                "status": "ACTIVE",
                "medical_clearance": True,
                "emergency_contact": "+91-9876543211",
                "user_id": created_users["station_mgr@dhruv.gov.in"].id,
                "last_check_in": now,
            },
            {
                "name": "Dr. Amitav Ghosh",
                "designation": "Expedition Medical Officer",
                "team": "Medical",
                "station_id": created_stations["Maitri Station"].id,
                "current_location": "Maitri Medical Bay",
                "status": "ACTIVE",
                "medical_clearance": True,
                "emergency_contact": "+91-9876543212",
                "user_id": created_users["doctor@dhruv.gov.in"].id,
                "last_check_in": now,
            },
            {
                "name": "Arun Mehra",
                "designation": "Heavy Equipment Engineer",
                "team": "Engineering & Fleet",
                "station_id": created_stations["Maitri Station"].id,
                "current_location": "Maitri Mechanical Hangar",
                "status": "ACTIVE",
                "medical_clearance": True,
                "emergency_contact": "+91-9876543213",
                "user_id": None,
                "last_check_in": now - timedelta(hours=2),
            },
            {
                "name": "Capt. Harpreet Singh",
                "designation": "Polar Aviation Coordinator",
                "team": "Aviation Logistics",
                "station_id": created_stations["Cape Town Transit Hub"].id,
                "current_location": "Cape Town Air Cargo Bay 3",
                "status": "ACTIVE",
                "medical_clearance": True,
                "emergency_contact": "+91-9876543214",
                "user_id": None,
                "last_check_in": now - timedelta(minutes=45),
            },
            {
                "name": "Dr. Deepa Krishnan",
                "designation": "Ice Core Specialist",
                "team": "Atmospheric Science",
                "station_id": created_stations["Field Camp Alpha"].id,
                "current_location": "Field Camp Alpha Shelter 1",
                "status": "ON_MISSION",
                "medical_clearance": True,
                "emergency_contact": "+91-9876543215",
                "user_id": None,
                "last_check_in": now - timedelta(minutes=15),
            },
            {
                "name": "Sanjay Patwardhan",
                "designation": "Radar & Comms Specialist",
                "team": "Communications",
                "station_id": created_stations["Bharati Station"].id,
                "current_location": "Bharati Comms Tower",
                "status": "ACTIVE",
                "medical_clearance": True,
                "emergency_contact": "+91-9876543216",
                "user_id": None,
                "last_check_in": now - timedelta(minutes=30),
            },
            {
                "name": "Anita Sen",
                "designation": "Cold-Chain Inventory Manager",
                "team": "Logistics",
                "station_id": created_stations["Cape Town Transit Hub"].id,
                "current_location": "Cape Town Central Store",
                "status": "ACTIVE",
                "medical_clearance": True,
                "emergency_contact": "+91-9876543217",
                "user_id": None,
                "last_check_in": now - timedelta(hours=1),
            },
            {
                "name": "Kavita Deshmukh",
                "designation": "Emergency Paramedic",
                "team": "Medical",
                "station_id": created_stations["Bharati Station"].id,
                "current_location": "Bharati Emergency Clinic",
                "status": "ACTIVE",
                "medical_clearance": True,
                "emergency_contact": "+91-9876543218",
                "user_id": None,
                "last_check_in": now,
            },
            {
                "name": "Tenzing Norbu",
                "designation": "Polar Guide & Survival Lead",
                "team": "Field Safety",
                "station_id": created_stations["Field Camp Alpha"].id,
                "current_location": "Plateau Route Bravo",
                "status": "ON_MISSION",
                "medical_clearance": True,
                "emergency_contact": "+91-9876543219",
                "user_id": None,
                "last_check_in": now - timedelta(minutes=10),
            },
            {
                "name": "Suresh Rane",
                "designation": "Expedition Mission Director",
                "team": "HQ Directorate",
                "station_id": created_stations["NCPOR Goa"].id,
                "current_location": "Goa Mission Control Room",
                "status": "ACTIVE",
                "medical_clearance": True,
                "emergency_contact": "+91-9876543220",
                "user_id": created_users["ops@dhruv.gov.in"].id,
                "last_check_in": now,
            },
            {
                "name": "Manoj Tiwari",
                "designation": "Power Plant Technician",
                "team": "Engineering & Fleet",
                "station_id": created_stations["Bharati Station"].id,
                "current_location": "Bharati Energy Complex",
                "status": "REST",
                "medical_clearance": True,
                "emergency_contact": "+91-9876543221",
                "user_id": None,
                "last_check_in": now - timedelta(hours=4),
            },
        ]

        for p in personnel_data:
            existing = db.query(Personnel).filter(Personnel.name == p["name"]).first()
            if not existing:
                pers = Personnel(**p)
                db.add(pers)
        db.commit()

        # 5. Seed 20 Inventory Items (Including deliberate low-stock items for forecasting demo)
        today = date.today()
        inventory_data = [
            # Fuel
            {
                "item_name": "Arctic Grade Diesel A-1",
                "category": "FUEL",
                "station_id": created_stations["Maitri Station"].id,
                "quantity": 18500.0,
                "minimum_threshold": 5000.0,
                "daily_consumption": 250.0,
                "unit": "L",
                "expiry_date": None,
            },
            {
                "item_name": "Arctic Grade Diesel A-1",
                "category": "FUEL",
                "station_id": created_stations["Bharati Station"].id,
                "quantity": 24000.0,
                "minimum_threshold": 6000.0,
                "daily_consumption": 280.0,
                "unit": "L",
                "expiry_date": None,
            },
            {
                "item_name": "Arctic Grade Diesel A-1 (Emergency Reserve)",
                "category": "FUEL",
                "station_id": created_stations["Field Camp Alpha"].id,
                "quantity": 450.0,  # LOW STOCK: < minimum_threshold 800.0
                "minimum_threshold": 800.0,
                "daily_consumption": 90.0,
                "unit": "L",
                "expiry_date": None,
            },
            {
                "item_name": "Aviation Turbine Fuel Jet-A1",
                "category": "FUEL",
                "station_id": created_stations["Maitri Station"].id,
                "quantity": 12000.0,
                "minimum_threshold": 3000.0,
                "daily_consumption": 150.0,
                "unit": "L",
                "expiry_date": None,
            },
            {
                "item_name": "Aviation Turbine Fuel Jet-A1",
                "category": "FUEL",
                "station_id": created_stations["Cape Town Transit Hub"].id,
                "quantity": 45000.0,
                "minimum_threshold": 10000.0,
                "daily_consumption": 500.0,
                "unit": "L",
                "expiry_date": None,
            },

            # Rations / Food
            {
                "item_name": "Polar High-Calorie Ration Packs",
                "category": "RATIONS",
                "station_id": created_stations["Bharati Station"].id,
                "quantity": 1400.0,
                "minimum_threshold": 300.0,
                "daily_consumption": 25.0,
                "unit": "PACKS",
                "expiry_date": today + timedelta(days=365),
            },
            {
                "item_name": "Polar High-Calorie Ration Packs",
                "category": "RATIONS",
                "station_id": created_stations["Maitri Station"].id,
                "quantity": 980.0,
                "minimum_threshold": 250.0,
                "daily_consumption": 22.0,
                "unit": "PACKS",
                "expiry_date": today + timedelta(days=365),
            },
            {
                "item_name": "Freeze-Dried Emergency Rations",
                "category": "RATIONS",
                "station_id": created_stations["Field Camp Alpha"].id,
                "quantity": 35.0,  # LOW STOCK: <= 60.0
                "minimum_threshold": 60.0,
                "daily_consumption": 8.0,
                "unit": "PACKS",
                "expiry_date": today + timedelta(days=180),
            },
            {
                "item_name": "Dehydrated Vegetables & Pulses",
                "category": "RATIONS",
                "station_id": created_stations["Maitri Station"].id,
                "quantity": 650.0,
                "minimum_threshold": 150.0,
                "daily_consumption": 12.0,
                "unit": "KG",
                "expiry_date": today + timedelta(days=240),
            },

            # Medical Supplies
            {
                "item_name": "Medical Oxygen Cylinders 40L",
                "category": "MEDICAL",
                "station_id": created_stations["Maitri Station"].id,
                "quantity": 18.0,
                "minimum_threshold": 10.0,
                "daily_consumption": 0.5,
                "unit": "CYLINDERS",
                "expiry_date": today + timedelta(days=700),
            },
            {
                "item_name": "Medical Oxygen Cylinders 40L",
                "category": "MEDICAL",
                "station_id": created_stations["Bharati Station"].id,
                "quantity": 25.0,
                "minimum_threshold": 12.0,
                "daily_consumption": 0.5,
                "unit": "CYLINDERS",
                "expiry_date": today + timedelta(days=700),
            },
            {
                "item_name": "Trauma Surgical & Suture Kits",
                "category": "MEDICAL",
                "station_id": created_stations["Bharati Station"].id,
                "quantity": 15.0,
                "minimum_threshold": 5.0,
                "daily_consumption": 0.1,
                "unit": "KITS",
                "expiry_date": today + timedelta(days=500),
            },
            {
                "item_name": "Broad-Spectrum Antibiotics Packs",
                "category": "MEDICAL",
                "station_id": created_stations["Field Camp Alpha"].id,
                "quantity": 4.0,  # LOW STOCK: <= 10.0
                "minimum_threshold": 10.0,
                "daily_consumption": 0.8,
                "unit": "PACKS",
                "expiry_date": today + timedelta(days=120),
            },
            {
                "item_name": "Hypothermia Thermal Wrap Blankets",
                "category": "MEDICAL",
                "station_id": created_stations["Maitri Station"].id,
                "quantity": 45.0,
                "minimum_threshold": 15.0,
                "daily_consumption": 0.2,
                "unit": "UNITS",
                "expiry_date": None,
            },

            # Safety Gear
            {
                "item_name": "Extreme Cold Thermal Suits -60C",
                "category": "SAFETY_GEAR",
                "station_id": created_stations["Maitri Station"].id,
                "quantity": 30.0,
                "minimum_threshold": 10.0,
                "daily_consumption": 0.05,
                "unit": "SETS",
                "expiry_date": None,
            },
            {
                "item_name": "Extreme Cold Thermal Suits -60C",
                "category": "SAFETY_GEAR",
                "station_id": created_stations["Bharati Station"].id,
                "quantity": 35.0,
                "minimum_threshold": 12.0,
                "daily_consumption": 0.05,
                "unit": "SETS",
                "expiry_date": None,
            },
            {
                "item_name": "High-Altitude Glacial Climbing Harnesses",
                "category": "SAFETY_GEAR",
                "station_id": created_stations["Field Camp Alpha"].id,
                "quantity": 8.0,
                "minimum_threshold": 6.0,
                "daily_consumption": 0.0,
                "unit": "UNITS",
                "expiry_date": None,
            },

            # Spare Parts & Consumables
            {
                "item_name": "Arctic Synthetic Engine Oil 0W-30",
                "category": "SPARE_PARTS",
                "station_id": created_stations["Maitri Station"].id,
                "quantity": 18.0,  # LOW STOCK: <= 40.0
                "minimum_threshold": 40.0,
                "daily_consumption": 3.5,
                "unit": "L",
                "expiry_date": None,
            },
            {
                "item_name": "Reverse-Osmosis Desalination Filter Membranes",
                "category": "SPARE_PARTS",
                "station_id": created_stations["Bharati Station"].id,
                "quantity": 12.0,
                "minimum_threshold": 4.0,
                "daily_consumption": 0.1,
                "unit": "UNITS",
                "expiry_date": today + timedelta(days=400),
            },
            {
                "item_name": "LiFePO4 Polar Battery Backup Modules",
                "category": "SPARE_PARTS",
                "station_id": created_stations["Field Camp Alpha"].id,
                "quantity": 2.0,  # LOW STOCK: <= 6.0
                "minimum_threshold": 6.0,
                "daily_consumption": 0.4,
                "unit": "UNITS",
                "expiry_date": None,
            },
        ]

        for inv in inventory_data:
            existing = db.query(Inventory).filter(
                Inventory.item_name == inv["item_name"],
                Inventory.station_id == inv["station_id"]
            ).first()
            if not existing:
                item = Inventory(**inv)
                db.add(item)
        db.commit()

        # 6. Seed 10 Realistic Assets (Vehicles, Generators, Comms, Medical, Scientific)
        assets_data = [
            {
                "asset_name": "PistenBully 300 Polar Snow Groomer",
                "asset_type": "VEHICLE",
                "qr_code": "DHRUV:ASSET:VEH-PB300-01",
                "status": "OPERATIONAL",
                "station_id": created_stations["Maitri Station"].id,
                "location": "Maitri Hangar Bay 1",
                "last_maintenance": today - timedelta(days=45),
                "next_maintenance": today + timedelta(days=45),
                "health_score": 88.5,
            },
            {
                "asset_name": "Hagglunds BV206 All-Terrain Tracked Vehicle",
                "asset_type": "VEHICLE",
                "qr_code": "DHRUV:ASSET:VEH-BV206-02",
                "status": "OPERATIONAL",
                "station_id": created_stations["Bharati Station"].id,
                "location": "Bharati Vehicle Depot",
                "last_maintenance": today - timedelta(days=20),
                "next_maintenance": today + timedelta(days=70),
                "health_score": 94.0,
            },
            {
                "asset_name": "Ski-Doo Expedition Snowmobile Unit 03",
                "asset_type": "VEHICLE",
                "qr_code": "DHRUV:ASSET:VEH-SKIDOO-03",
                "status": "MAINTENANCE_REQUIRED",  # ALERT ITEM: Low Health & Maintenance Required
                "station_id": created_stations["Field Camp Alpha"].id,
                "location": "Camp Alpha Perimeter Shed",
                "last_maintenance": today - timedelta(days=120),
                "next_maintenance": today - timedelta(days=5),
                "health_score": 42.0,
            },
            {
                "asset_name": "Cummins 250kVA Prime Arctic Diesel Generator",
                "asset_type": "GENERATOR",
                "qr_code": "DHRUV:ASSET:GEN-CUMMINS-01",
                "status": "OPERATIONAL",
                "station_id": created_stations["Maitri Station"].id,
                "location": "Maitri Power Plant Room A",
                "last_maintenance": today - timedelta(days=15),
                "next_maintenance": today + timedelta(days=60),
                "health_score": 91.0,
            },
            {
                "asset_name": "Caterpillar 150kVA Auxiliary Generator",
                "asset_type": "GENERATOR",
                "qr_code": "DHRUV:ASSET:GEN-CAT-02",
                "status": "MAINTENANCE_REQUIRED",  # ALERT ITEM: Low Health
                "station_id": created_stations["Bharati Station"].id,
                "location": "Bharati Auxiliary Utility Building",
                "last_maintenance": today - timedelta(days=95),
                "next_maintenance": today - timedelta(days=2),
                "health_score": 48.0,
            },
            {
                "asset_name": "Iridium Certus 700 Maritime/Land Satellite Terminal",
                "asset_type": "COMMS",
                "qr_code": "DHRUV:ASSET:COMMS-IRID-01",
                "status": "OPERATIONAL",
                "station_id": created_stations["Bharati Station"].id,
                "location": "Bharati Satellite Deck",
                "last_maintenance": today - timedelta(days=30),
                "next_maintenance": today + timedelta(days=90),
                "health_score": 96.0,
            },
            {
                "asset_name": "Starlink High-Performance Polar Dish Terminal",
                "asset_type": "COMMS",
                "qr_code": "DHRUV:ASSET:COMMS-STAR-02",
                "status": "OPERATIONAL",
                "station_id": created_stations["Field Camp Alpha"].id,
                "location": "Alpha Comms Mast",
                "last_maintenance": today - timedelta(days=10),
                "next_maintenance": today + timedelta(days=80),
                "health_score": 89.0,
            },
            {
                "asset_name": "Mindray DP-50 Diagnostic Ultrasound System",
                "asset_type": "MEDICAL",
                "qr_code": "DHRUV:ASSET:MED-USOUND-01",
                "status": "OPERATIONAL",
                "station_id": created_stations["Maitri Station"].id,
                "location": "Maitri Medical Bay Exam Room",
                "last_maintenance": today - timedelta(days=25),
                "next_maintenance": today + timedelta(days=120),
                "health_score": 98.0,
            },
            {
                "asset_name": "Zoll AED Pro Defibrillator & Patient Monitor",
                "asset_type": "MEDICAL",
                "qr_code": "DHRUV:ASSET:MED-ZOLL-02",
                "status": "OPERATIONAL",
                "station_id": created_stations["Bharati Station"].id,
                "location": "Bharati Medical Bay Resuscitation Unit",
                "last_maintenance": today - timedelta(days=15),
                "next_maintenance": today + timedelta(days=100),
                "health_score": 95.0,
            },
            {
                "asset_name": "Bruker FTIR Trace Gas Spectrometer",
                "asset_type": "SCIENTIFIC_INSTRUMENT",
                "qr_code": "DHRUV:ASSET:SCI-BRUKER-01",
                "status": "OPERATIONAL",
                "station_id": created_stations["Bharati Station"].id,
                "location": "Bharati Atmospheric Observation Dome",
                "last_maintenance": today - timedelta(days=12),
                "next_maintenance": today + timedelta(days=110),
                "health_score": 92.5,
            },
        ]

        for ast in assets_data:
            existing = db.query(Asset).filter(Asset.qr_code == ast["qr_code"]).first()
            if not existing:
                asset_obj = Asset(**ast)
                db.add(asset_obj)
        db.commit()

        # ==========================================
        # 7. Seed Member 2 Cargo Packages (5 packages)
        # ==========================================
        cargo_data = [
            {
                "cargo_code": "CRG-2026-001",
                "name": "Atmospheric Aerosol Sampling Filters",
                "category": CargoCategory.SCIENTIFIC,
                "weight": 24.5,
                "priority": CargoPriority.HIGH,
                "origin_station_id": created_stations["NCPOR Goa"].id,
                "destination_station_id": created_stations["Bharati Station"].id,
                "status": CargoStatus.DELAYED,
                "current_location": "Prydz Bay Fast-Ice Mooring (Katabatic Delay +18h)",
                "qr_code": "DHRUV:CARGO:CRG-2026-001",
            },
            {
                "cargo_code": "CRG-2026-002",
                "name": "Emergency Medical Plasma & Antibiotics",
                "category": CargoCategory.MEDICAL,
                "weight": 18.0,
                "priority": CargoPriority.CRITICAL,
                "origin_station_id": created_stations["Cape Town Transit Hub"].id,
                "destination_station_id": created_stations["Maitri Station"].id,
                "status": CargoStatus.DISPATCHED,
                "current_location": "Cape Town Port Berth 2",
                "qr_code": "DHRUV:CARGO:CRG-2026-002",
            },
            {
                "cargo_code": "CRG-2026-003",
                "name": "Polar Winter Grade Diesel Fuel Drums",
                "category": CargoCategory.FUEL,
                "weight": 1200.0,
                "priority": CargoPriority.HIGH,
                "origin_station_id": created_stations["NCPOR Goa"].id,
                "destination_station_id": created_stations["Maitri Station"].id,
                "status": CargoStatus.PACKED,
                "current_location": "Goa Supply Wharf",
                "qr_code": "DHRUV:CARGO:CRG-2026-003",
            },
            {
                "cargo_code": "CRG-2026-004",
                "name": "High-Calorie Freeze-Dried Expedition Rations",
                "category": CargoCategory.FOOD,
                "weight": 150.0,
                "priority": CargoPriority.MEDIUM,
                "origin_station_id": created_stations["Maitri Station"].id,
                "destination_station_id": created_stations["Field Camp Alpha"].id,
                "status": CargoStatus.ARRIVED,
                "current_location": "Field Camp Alpha Shelter",
                "qr_code": "DHRUV:CARGO:CRG-2026-004",
            },
            {
                "cargo_code": "CRG-2026-005",
                "name": "Deep Ice Core Thermal Drilling Head Kit",
                "category": CargoCategory.EQUIPMENT,
                "weight": 85.0,
                "priority": CargoPriority.CRITICAL,
                "origin_station_id": created_stations["Cape Town Transit Hub"].id,
                "destination_station_id": created_stations["Bharati Station"].id,
                "status": CargoStatus.PLANNED,
                "current_location": "Cape Town Logistics Hub",
                "qr_code": "DHRUV:CARGO:CRG-2026-005",
            },
        ]

        created_cargo = {}
        for c in cargo_data:
            existing = db.query(Cargo).filter(Cargo.cargo_code == c["cargo_code"]).first()
            if not existing:
                cg = Cargo(**c)
                db.add(cg)
                db.commit()
                db.refresh(cg)
                created_cargo[c["cargo_code"]] = cg
            else:
                existing.status = c["status"]
                existing.current_location = c["current_location"]
                db.commit()
                created_cargo[c["cargo_code"]] = existing

        # ==========================================
        # 8. Seed Cargo Events (Chain of Custody)
        # ==========================================
        ops_user = db.query(User).filter(User.email == "ops@dhruv.gov.in").first()
        ops_user_id = ops_user.id if ops_user else None

        cargo_events_data = [
            {
                "cargo_id": created_cargo["CRG-2026-001"].id,
                "event_type": CargoEventType.PACKED,
                "location": "NCPOR Central Logistics Depot, Goa",
                "station_id": created_stations["NCPOR Goa"].id,
                "remarks": "Hermetic climate-controlled crate sealed and inspected",
                "updated_by": ops_user_id,
            },
            {
                "cargo_id": created_cargo["CRG-2026-001"].id,
                "event_type": CargoEventType.LOADED,
                "location": "Goa Supply Wharf Convoy",
                "station_id": created_stations["NCPOR Goa"].id,
                "remarks": "Staged onto feeder convoy for Cape Town transit hub",
                "updated_by": ops_user_id,
            },
            {
                "cargo_id": created_cargo["CRG-2026-001"].id,
                "event_type": CargoEventType.SCANNED,
                "location": "Port of Cape Town Berth 4",
                "station_id": created_stations["Cape Town Transit Hub"].id,
                "remarks": "Cold store staging transfer & QR barcode verification passed",
                "updated_by": ops_user_id,
            },
            {
                "cargo_id": created_cargo["CRG-2026-001"].id,
                "event_type": CargoEventType.ARRIVED_AT_HUB,
                "location": "Prydz Bay Fast-Ice Offshore Mooring",
                "station_id": created_stations["Bharati Station"].id,
                "remarks": "MV Vasundhara moored at offshore fast-ice edge",
                "updated_by": ops_user_id,
            },
            {
                "cargo_id": created_cargo["CRG-2026-001"].id,
                "event_type": CargoEventType.DELAY_REPORTED,
                "location": "Prydz Bay Fast-Ice Mooring",
                "station_id": created_stations["Bharati Station"].id,
                "remarks": "Katabatic wind gusts exceeding 42 kts; helicopter sling-load operations on weather hold +18h",
                "updated_by": ops_user_id,
            },
            {
                "cargo_id": created_cargo["CRG-2026-002"].id,
                "event_type": CargoEventType.PACKED,
                "location": "Cape Town Cold-Chain Facility",
                "station_id": created_stations["Cape Town Transit Hub"].id,
                "remarks": "Cryo-package sealed at -20C",
                "updated_by": ops_user_id,
            },
            {
                "cargo_id": created_cargo["CRG-2026-004"].id,
                "event_type": CargoEventType.ARRIVED_AT_HUB,
                "location": "Field Camp Alpha Depot",
                "station_id": created_stations["Field Camp Alpha"].id,
                "remarks": "Delivered via Snow Traverse 01",
                "updated_by": ops_user_id,
            },
        ]

        for ce in cargo_events_data:
            existing = (
                db.query(CargoEvent)
                .filter(
                    CargoEvent.cargo_id == ce["cargo_id"],
                    CargoEvent.event_type == ce["event_type"],
                    CargoEvent.location == ce["location"],
                )
                .first()
            )
            if not existing:
                db.add(CargoEvent(**ce))
        db.commit()

        # ==========================================
        # 9. Seed Transport Fleet (3 Transports)
        # ==========================================
        transport_data = [
            {
                "transport_name": "MV Vasundhara Polar Resupply Vessel",
                "type": TransportType.RESEARCH_VESSEL,
                "capacity": 250000.0,
                "status": TransportStatus.IN_TRANSIT,
                "current_location": "-55.4000, 42.1000",
                "destination": "Bharati Station",
                "eta": now + timedelta(days=8),
                "current_station_id": created_stations["Cape Town Transit Hub"].id,
                "destination_station_id": created_stations["Bharati Station"].id,
            },
            {
                "transport_name": "Ilyushin Il-76TD Antarctic Transport",
                "type": TransportType.CARGO_AIRCRAFT,
                "capacity": 48000.0,
                "status": TransportStatus.STANDBY,
                "current_location": "Cape Town International Airport",
                "destination": "Maitri Blue Ice Runway",
                "eta": now + timedelta(days=2),
                "current_station_id": created_stations["Cape Town Transit Hub"].id,
                "destination_station_id": created_stations["Maitri Station"].id,
            },
            {
                "transport_name": "PistenBully Polar Traverse 01",
                "type": TransportType.SNOW_VEHICLE,
                "capacity": 3500.0,
                "status": TransportStatus.IN_TRANSIT,
                "current_location": "-70.9500, 12.1000",
                "destination": "Field Camp Alpha",
                "eta": now + timedelta(hours=14),
                "current_station_id": created_stations["Maitri Station"].id,
                "destination_station_id": created_stations["Field Camp Alpha"].id,
            },
        ]

        created_transports = {}
        for t in transport_data:
            existing = db.query(Transport).filter(Transport.transport_name == t["transport_name"]).first()
            if not existing:
                tr = Transport(**t)
                db.add(tr)
                db.commit()
                db.refresh(tr)
                created_transports[t["transport_name"]] = tr
            else:
                created_transports[t["transport_name"]] = existing

        # ==========================================
        # 10. Seed Missions (2 active missions)
        # ==========================================
        lead1 = db.query(Personnel).filter(Personnel.name == "Dr. Priya Nair").first()
        lead2 = db.query(Personnel).filter(Personnel.name == "Col. Vikram Malhotra").first()
        first_personnel = db.query(Personnel).first()
        lead1_id = lead1.id if lead1 else first_personnel.id
        lead2_id = lead2.id if lead2 else first_personnel.id

        mission_data = [
            {
                "mission_name": "Larsemann Hills Glaciological Traverse",
                "mission_type": MissionType.SCIENTIFIC_SURVEY,
                "origin": "Bharati Station",
                "destination": "Field Camp Alpha",
                "team_lead_id": lead1_id,
                "origin_station_id": created_stations["Bharati Station"].id,
                "destination_station_id": created_stations["Field Camp Alpha"].id,
                "start_time": now - timedelta(days=1),
                "expected_return": now + timedelta(days=5),
                "status": MissionStatus.ACTIVE,
                "risk_level": MissionRiskLevel.MEDIUM,
            },
            {
                "mission_name": "Maitri-Dome C Resupply Convoy",
                "mission_type": MissionType.LOGISTICS_RESUPPLY,
                "origin": "Maitri Station",
                "destination": "Field Camp Alpha Depot",
                "team_lead_id": lead2_id,
                "origin_station_id": created_stations["Maitri Station"].id,
                "destination_station_id": created_stations["Field Camp Alpha"].id,
                "start_time": now - timedelta(hours=18),
                "expected_return": now + timedelta(days=3),
                "status": MissionStatus.ACTIVE,
                "risk_level": MissionRiskLevel.HIGH,
            },
            {
                "mission_name": "Prydz Bay Sea-Ice Thickness Core Survey",
                "mission_type": MissionType.SCIENTIFIC_SURVEY,
                "origin": "Bharati Station",
                "destination": "Prydz Bay Fast-Ice Zone",
                "team_lead_id": lead1_id,
                "origin_station_id": created_stations["Bharati Station"].id,
                "destination_station_id": created_stations["Bharati Station"].id,
                "start_time": now - timedelta(days=12),
                "expected_return": now - timedelta(days=2),
                "status": MissionStatus.COMPLETED,
                "risk_level": MissionRiskLevel.LOW,
            },
            {
                "mission_name": "Schirmacher Oasis Environmental Baseline Traverse",
                "mission_type": MissionType.RECONNAISSANCE,
                "origin": "Maitri Station",
                "destination": "Field Camp Alpha",
                "team_lead_id": lead2_id,
                "origin_station_id": created_stations["Maitri Station"].id,
                "destination_station_id": created_stations["Field Camp Alpha"].id,
                "start_time": now + timedelta(days=5),
                "expected_return": now + timedelta(days=14),
                "status": MissionStatus.PLANNED,
                "risk_level": MissionRiskLevel.LOW,
            },
        ]

        created_missions = {}
        for m in mission_data:
            existing = db.query(Mission).filter(Mission.mission_name == m["mission_name"]).first()
            if not existing:
                ms = Mission(**m)
                db.add(ms)
                db.commit()
                db.refresh(ms)
                created_missions[m["mission_name"]] = ms
            else:
                created_missions[m["mission_name"]] = existing

        # ==========================================
        # 11. Seed Initial Tracking Events
        # ==========================================
        m1 = created_missions.get("Larsemann Hills Glaciological Traverse")
        tr1 = created_transports.get("PistenBully Polar Traverse 01")

        tracking_data = []
        if m1:
            tracking_data.extend([
                {
                    "entity_type": TrackingEntityType.MISSION,
                    "entity_id": m1.id,
                    "latitude": -69.4500,
                    "longitude": 76.1200,
                    "speed": 12.5,
                    "battery": 92.0,
                    "timestamp": now - timedelta(hours=2),
                },
                {
                    "entity_type": TrackingEntityType.MISSION,
                    "entity_id": m1.id,
                    "latitude": -69.6000,
                    "longitude": 75.8000,
                    "speed": 14.0,
                    "battery": 87.5,
                    "timestamp": now,
                },
            ])

        if tr1:
            tracking_data.extend([
                {
                    "entity_type": TrackingEntityType.TRANSPORT,
                    "entity_id": tr1.id,
                    "latitude": -70.8500,
                    "longitude": 11.9500,
                    "speed": 18.0,
                    "battery": 95.0,
                    "timestamp": now - timedelta(hours=3),
                },
                {
                    "entity_type": TrackingEntityType.TRANSPORT,
                    "entity_id": tr1.id,
                    "latitude": -70.9500,
                    "longitude": 12.1000,
                    "speed": 16.5,
                    "battery": 89.0,
                    "timestamp": now,
                },
            ])

        for tk in tracking_data:
            existing = (
                db.query(TrackingEvent)
                .filter(
                    TrackingEvent.entity_type == tk["entity_type"],
                    TrackingEvent.entity_id == tk["entity_id"],
                    TrackingEvent.latitude == tk["latitude"],
                    TrackingEvent.longitude == tk["longitude"],
                )
                .first()
            )
            if not existing:
                db.add(TrackingEvent(**tk))
        db.commit()

        # ==========================================
        # 12. Seed Inventory Transfers
        # ==========================================
        transfer_data = [
            {
                "transfer_code": "TRF-2026-001",
                "item_name": "Aviation Turbine Fuel (Jet A-1)",
                "quantity": 3200.0,
                "unit": "Liters",
                "from_location": "MV Vasundhara Fuel Bay",
                "to_location": "Bharati Station Helipad Tanks",
                "status": "COMPLETED",
                "timestamp": now - timedelta(days=2, hours=4),
                "authorizing_officer": "Lt. Col. Vikramaditya Rathore",
                "notes": "Bulk aviation turbine fuel transfer completed via offshore bunkering line.",
            },
            {
                "transfer_code": "TRF-2026-002",
                "item_name": "Freeze-Dried MRE Rations",
                "quantity": 600.0,
                "unit": "Packs",
                "from_location": "Bharati Station Central Larder",
                "to_location": "Team Alpha Field Sledge (AST-BHR-018)",
                "status": "COMPLETED",
                "timestamp": now - timedelta(days=1, hours=2),
                "authorizing_officer": "Omkar Joshi",
                "notes": "High-altitude survival packs issued for Larsemann ridge glaciological traverse.",
            },
            {
                "transfer_code": "TRF-2026-003",
                "item_name": "Polar Grade Low-Sulfur Diesel",
                "quantity": 50000.0,
                "unit": "Liters",
                "from_location": "MV Vasundhara Bulk Tank #2",
                "to_location": "Bharati Station Fuel Farm",
                "status": "PENDING_PUMPING",
                "timestamp": now + timedelta(hours=18),
                "authorizing_officer": "Chief Engr. Suresh Nair",
                "notes": "Scheduled bulk line pumping contingent on wind speeds dropping below 25 kts.",
            },
        ]
        for trf in transfer_data:
            existing = db.query(InventoryTransfer).filter(InventoryTransfer.transfer_code == trf["transfer_code"]).first()
            if not existing:
                db.add(InventoryTransfer(**trf))
        db.commit()

        # ==========================================
        # 13. Seed Fuel Consumption Logs (Historical Weekly)
        # ==========================================
        maitri_st = created_stations["Maitri Station"]
        bharati_st = created_stations["Bharati Station"]
        fuel_logs_data = [
            {"station_id": maitri_st.id, "week_label": "Wk 48", "liters_consumed": 2450.0, "recorded_date": date(2026, 11, 29), "notes": "Nominal heating cycle"},
            {"station_id": bharati_st.id, "week_label": "Wk 48", "liters_consumed": 1260.0, "recorded_date": date(2026, 11, 29), "notes": "Nominal operations"},
            {"station_id": maitri_st.id, "week_label": "Wk 49", "liters_consumed": 2520.0, "recorded_date": date(2026, 12, 6), "notes": "Standard load"},
            {"station_id": bharati_st.id, "week_label": "Wk 49", "liters_consumed": 1310.0, "recorded_date": date(2026, 12, 6), "notes": "Cold front surge"},
            {"station_id": maitri_st.id, "week_label": "Wk 50", "liters_consumed": 2600.0, "recorded_date": date(2026, 12, 13), "notes": "Secondary generator test"},
            {"station_id": bharati_st.id, "week_label": "Wk 50", "liters_consumed": 1420.0, "recorded_date": date(2026, 12, 13), "notes": "Continuous laboratory heating"},
            {"station_id": maitri_st.id, "week_label": "Wk 51", "liters_consumed": 2480.0, "recorded_date": date(2026, 12, 20), "notes": "Nominal heating"},
            {"station_id": bharati_st.id, "week_label": "Wk 51", "liters_consumed": 1560.0, "recorded_date": date(2026, 12, 20), "notes": "Blizzard heating demand peak"},
            {"station_id": maitri_st.id, "week_label": "Wk 52", "liters_consumed": 2510.0, "recorded_date": date(2026, 12, 27), "notes": "Stable operations"},
            {"station_id": bharati_st.id, "week_label": "Wk 52", "liters_consumed": 1260.0, "recorded_date": date(2026, 12, 27), "notes": "Stabilized consumption"},
        ]
        for fl in fuel_logs_data:
            existing = (
                db.query(FuelLog)
                .filter(FuelLog.station_id == fl["station_id"], FuelLog.week_label == fl["week_label"])
                .first()
            )
            if not existing:
                db.add(FuelLog(**fl))
        db.commit()

        # ==========================================
        # 14. Seed Operational Alerts
        # ==========================================
        bharati_fuel_item = (
            db.query(Inventory)
            .filter(Inventory.category == "FUEL", Inventory.station_id == created_stations["Bharati Station"].id)
            .first()
        )
        crg1 = created_cargo.get("CRG-2026-001")
        m_active = created_missions.get("Larsemann Hills Glaciological Traverse")

        alerts_data = [
            {
                "alert_type": AlertType.EMERGENCY,
                "severity": AlertSeverity.CRITICAL,
                "title": "Crevasse Breach & Frostbite Alert - Team Alpha Traverse",
                "message": "Field emergency SOS triggered at Sector 4 Ridge. 87 km from Bharati Base. Immediate SAR dispatch required.",
                "entity_type": AlertEntityType.MISSION,
                "entity_id": m_active.id if m_active else None,
                "station_id": created_stations["Bharati Station"].id,
                "status": AlertStatus.ACTIVE,
            },
            {
                "alert_type": AlertType.INVENTORY_SHORTAGE,
                "severity": AlertSeverity.HIGH,
                "title": "Bharati Polar Diesel Stock Below Safety Reserve",
                "message": "Daily consumption 180 L/day. Reserve buffer below standard 14-day safety threshold (6 days remaining).",
                "entity_type": AlertEntityType.INVENTORY,
                "entity_id": bharati_fuel_item.id if bharati_fuel_item else None,
                "station_id": created_stations["Bharati Station"].id,
                "status": AlertStatus.ACTIVE,
            },
            {
                "alert_type": AlertType.CARGO_DELAY,
                "severity": AlertSeverity.MEDIUM,
                "title": "Cargo Delay Predicted: Katabatic Winds at Prydz Bay",
                "message": "CRG-2026-001 delivery to Bharati Station delayed by +18h due to 42 kt wind gusts at offshore mooring.",
                "entity_type": AlertEntityType.CARGO,
                "entity_id": crg1.id if crg1 else None,
                "station_id": created_stations["Bharati Station"].id,
                "status": AlertStatus.ACTIVE,
            },
            {
                "alert_type": AlertType.GENERAL,
                "severity": AlertSeverity.LOW,
                "title": "High-Latitude Satellite Uplink Nominal",
                "message": "INSAT-4CR polar transponder synchronized. All station communication links operating at 99.8% availability.",
                "entity_type": AlertEntityType.SYSTEM,
                "entity_id": None,
                "station_id": created_stations["NCPOR Goa"].id,
                "status": AlertStatus.ACTIVE,
            },
        ]

        for alt in alerts_data:
            existing = db.query(Alert).filter(Alert.title == alt["title"]).first()
            if not existing:
                db.add(Alert(**alt))
        db.commit()

        # ==========================================
        # 15. Seed Emergency Incident (EMG-2026-001)
        # ==========================================
        casualty = db.query(Personnel).filter(Personnel.name.ilike("%Tenzing Norbu%")).first()
        if not casualty:
            casualty = db.query(Personnel).first()
        rescue_asset = db.query(Asset).filter(Asset.asset_name.ilike("%PistenBully%")).first()
        if not rescue_asset:
            rescue_asset = db.query(Asset).first()

        emergency_incident = {
            "incident_code": "EMG-2026-001",
            "title": "Crevasse Breach & Frostbite Hazard during Plateau Traverse",
            "emergency_type": EmergencyType.MEDICAL,
            "severity": EmergencySeverity.CRITICAL,
            "status": EmergencyStatus.OPEN,
            "station_id": created_stations["Bharati Station"].id,
            "mission_id": m_active.id if m_active else None,
            "personnel_id": casualty.id if casualty else None,
            "asset_id": rescue_asset.id if rescue_asset else None,
            "latitude": -69.4500,
            "longitude": 76.1200,
            "location_description": "Sector 4 Ridge • Crevasse Zone",
            "description": "Traverse team reports crevasse edge collapse beneath sledge runner. Sledge stabilized but 1 researcher exhibits Stage-2 frostbite symptoms. Ambient temperature -28°C with 38 kt winds.",
            "recommended_response": "Deploy PistenBully Polar Rescue Unit with trauma medical kit via Route 2 (Distance: 87 km, ETA: 1h 45m). Evacuate casualty to Bharati Station medical clinic.",
            "human_decision": EmergencyDecision.PENDING,
            "decision_notes": None,
            "reported_by": ops_user_id,
        }

        existing_emg = db.query(Emergency).filter(Emergency.incident_code == emergency_incident["incident_code"]).first()
        if not existing_emg:
            db.add(Emergency(**emergency_incident))
        db.commit()

        logger.info("DHRUV database seeded successfully!")
        print("[OK] DHRUV database seeded successfully:")
        print(f"   * Users: {db.query(User).count()}")
        print(f"   * Stations: {db.query(Station).count()}")
        print(f"   * Personnel: {db.query(Personnel).count()}")
        print(f"   * Inventory: {db.query(Inventory).count()}")
        print(f"   * Assets: {db.query(Asset).count()}")
        print(f"   * Cargo: {db.query(Cargo).count()}")
        print(f"   * Cargo Events: {db.query(CargoEvent).count()}")
        print(f"   * Transport: {db.query(Transport).count()}")
        print(f"   * Missions: {db.query(Mission).count()}")
        print(f"   * Tracking Events: {db.query(TrackingEvent).count()}")
        print(f"   * Inventory Transfers: {db.query(InventoryTransfer).count()}")
        print(f"   * Fuel Logs: {db.query(FuelLog).count()}")
        print(f"   * Alerts: {db.query(Alert).count()}")
        print(f"   * Emergencies: {db.query(Emergency).count()}")

    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    seed_database()
