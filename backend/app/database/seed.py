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

        logger.info("DHRUV database seeded successfully!")
        print("[OK] DHRUV database seeded successfully:")
        print(f"   * Users: {db.query(User).count()}")
        print(f"   * Stations: {db.query(Station).count()}")
        print(f"   * Personnel: {db.query(Personnel).count()}")
        print(f"   * Inventory: {db.query(Inventory).count()}")
        print(f"   * Assets: {db.query(Asset).count()}")

    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    seed_database()
