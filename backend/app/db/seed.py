from datetime import date
from decimal import Decimal
from sqlalchemy.orm import Session
from app.core.logging import logger
from app.core.security import get_password_hash
from app.models.benchmark import Benchmark
from app.models.bill import Bill
from app.models.bill_item import BillItem
from app.models.hospital import Hospital
from app.models.user import User
from app.db.seed_synthetic_data import seed_synthetic_dataset


def seed_database(db: Session) -> dict:
    """
    Populates database with realistic reference benchmarks, price ceilings,
    and 9 specific demo bill scenarios.
    All synthetic demo records are explicitly marked with is_synthetic = True.
    """
    logger.info("Starting database seeding...")

    # 1. Seed Users
    admin_user = db.query(User).filter_by(email="admin@billsaathi.ai").first()
    if not admin_user:
        admin_user = User(
            name="System Administrator",
            email="admin@billsaathi.ai",
            password_hash=get_password_hash("AdminPass@123"),
            is_admin=True,
        )
        db.add(admin_user)

    demo_user = db.query(User).filter_by(email="demo@billsaathi.ai").first()
    if not demo_user:
        demo_user = User(
            name="Demo Patient",
            email="demo@billsaathi.ai",
            password_hash=get_password_hash("DemoPass@123"),
            is_admin=False,
        )
        db.add(demo_user)
    db.commit()

    # 2. Seed Hospitals
    hospitals = {
        "apollo": Hospital(
            name="Apollo Hospital (Demo Facility)",
            location="Indraprastha, Sarita Vihar",
            state="Delhi-NCR",
            hospital_category="Private Tertiary",
        ),
        "max": Hospital(
            name="Max Super Speciality Hospital (Demo)",
            location="Saket, New Delhi",
            state="Delhi-NCR",
            hospital_category="Private NABH",
        ),
        "fortis": Hospital(
            name="Fortis Memorial Research Institute (Demo)",
            location="Sector 44, Gurugram",
            state="Haryana",
            hospital_category="Private Tertiary",
        ),
    }
    for key, h in hospitals.items():
        existing = db.query(Hospital).filter_by(name=h.name).first()
        if not existing:
            db.add(h)
            db.commit()
            db.refresh(h)
            hospitals[key] = h
        else:
            hospitals[key] = existing

    # 3. Seed Reference Benchmarks & Price Rules
    benchmarks_data = [
        # Statutory Price Ceiling (Real NPPA order, verified)
        {
            "normalized_item_name": "coronary drug eluting stent",
            "service_code": "STENT-DES-01",
            "applicable_region": "National",
            "benchmark_type": "price_ceiling",
            "amount": Decimal("30080.00"),
            "currency": "INR",
            "source_name": "NPPA Statutory Price Cap Order",
            "source_reference": "National Pharmaceutical Pricing Authority Order S.O. 1335(E)",
            "source_url": "https://www.nppaindia.nic.in",
            "effective_from": date(2020, 1, 1),
            "effective_until": None,
            "verification_status": "verified",
            "is_synthetic": False,
        },
        # Statutory Medicine Ceiling (NPPA Ceiling)
        {
            "normalized_item_name": "paracetamol 650mg",
            "service_code": "PHARM-PCM-650",
            "applicable_region": "National",
            "benchmark_type": "price_ceiling",
            "amount": Decimal("2.35"),
            "currency": "INR",
            "source_name": "NPPA DPCO Drug Ceiling Schedule",
            "source_reference": "DPCO Schedule-I Essential Medicines List",
            "source_url": "https://www.nppaindia.nic.in",
            "effective_from": date(2021, 4, 1),
            "effective_until": None,
            "verification_status": "verified",
            "is_synthetic": False,
        },
        # CGHS Reference Rate
        {
            "normalized_item_name": "complete blood count",
            "service_code": "DIAG-CBC-01",
            "applicable_region": "Delhi-NCR",
            "benchmark_type": "cghs_rate",
            "amount": Decimal("180.00"),
            "currency": "INR",
            "source_name": "CGHS Delhi Rate List",
            "source_reference": "Ministry of Health & Family Welfare CGHS Diagnostic Rates 2023",
            "source_url": "https://cghs.gov.in",
            "effective_from": date(2023, 2, 1),
            "effective_until": None,
            "verification_status": "verified",
            "is_synthetic": False,
        },
        # Published Hospital Tariff (Synthetic Demo Benchmark)
        {
            "normalized_item_name": "icu bed charges",
            "service_code": "ROOM-ICU-01",
            "hospital_id": hospitals["apollo"].id,
            "applicable_region": "Delhi-NCR",
            "benchmark_type": "hospital_tariff",
            "amount": Decimal("8500.00"),
            "currency": "INR",
            "source_name": "Apollo Published Hospital Tariff (Demo Dataset)",
            "source_reference": "Apollo Institutional Tariff Guide 2024",
            "source_url": None,
            "effective_from": date(2024, 1, 1),
            "effective_until": date(2025, 12, 31),
            "verification_status": "synthetic_demo",
            "is_synthetic": True,
        },
        # Contextual Market Median (Synthetic Demo Benchmark)
        {
            "normalized_item_name": "laparoscopic cholecystectomy",
            "service_code": "PROC-LAP-CHOL",
            "applicable_region": "National",
            "benchmark_type": "market_median",
            "amount": Decimal("55000.00"),
            "currency": "INR",
            "source_name": "Delhi Regional Private Hospital Survey (Demo)",
            "source_reference": "Health Economics Market Index 2024",
            "source_url": None,
            "effective_from": date(2024, 1, 1),
            "effective_until": None,
            "verification_status": "synthetic_demo",
            "is_synthetic": True,
        },
        # Expired Benchmark (Synthetic)
        {
            "normalized_item_name": "covid-19 rt-pcr test",
            "service_code": "DIAG-RTPCR-01",
            "applicable_region": "National",
            "benchmark_type": "price_ceiling",
            "amount": Decimal("400.00"),
            "currency": "INR",
            "source_name": "State Epidemic Notification Cap (Expired)",
            "source_reference": "State Pandemic Price Cap Directive 2021",
            "source_url": None,
            "effective_from": date(2021, 1, 1),
            "effective_until": date(2022, 12, 31),  # Expired
            "verification_status": "synthetic_demo",
            "is_synthetic": True,
        },
    ]

    for b_data in benchmarks_data:
        existing = db.query(Benchmark).filter_by(
            normalized_item_name=b_data["normalized_item_name"],
            source_name=b_data["source_name"],
        ).first()
        if not existing:
            db.add(Benchmark(**b_data))
    db.commit()

    # 4. Seed the 9 Specific Bill Scenarios
    # Scenario 1: Correct Bill
    _seed_bill(
        db=db,
        user_id=demo_user.id,
        hospital_id=hospitals["apollo"].id,
        filename="scenario_1_correct_bill.pdf",
        bill_date=date(2024, 3, 10),
        total_amount=Decimal("8680.00"),
        is_demo=True,
        items=[
            ("ICU Bed Charges (1 Day)", "icu bed charges", "ROOM-ICU-01", "Room & Nursing", Decimal("1.00"), "day", Decimal("8500.00"), Decimal("8500.00"), Decimal("0.98"), True),
            ("Complete Blood Count (CBC)", "complete blood count", "DIAG-CBC-01", "Diagnostics", Decimal("1.00"), "test", Decimal("180.00"), Decimal("180.00"), Decimal("0.96"), True),
        ],
    )

    # Scenario 2: Arithmetic Error (Line calculation mismatch & grand total mismatch)
    _seed_bill(
        db=db,
        user_id=demo_user.id,
        hospital_id=hospitals["max"].id,
        filename="scenario_2_arithmetic_error.pdf",
        bill_date=date(2024, 3, 12),
        total_amount=Decimal("3500.00"),  # Actual sum is 1000 + 400 = 1400, but billed as 3500
        is_demo=True,
        items=[
            ("Specialist Consultation Fee", "specialist consultation", "CONS-SPEC-01", "Consultation", Decimal("2.00"), "visit", Decimal("500.00"), Decimal("1500.00"), Decimal("0.95"), True),  # 2 x 500 = 1000, but billed as 1500
            ("Routine Nursing Care", "nursing care", "NURS-01", "Room & Nursing", Decimal("1.00"), "day", Decimal("400.00"), Decimal("400.00"), Decimal("0.95"), True),
        ],
    )

    # Scenario 3: Duplicate Charge (Duplicate admission fee)
    _seed_bill(
        db=db,
        user_id=demo_user.id,
        hospital_id=hospitals["apollo"].id,
        filename="scenario_3_duplicate_charge.pdf",
        bill_date=date(2024, 3, 14),
        total_amount=Decimal("2000.00"),
        is_demo=True,
        items=[
            ("Hospital Admission Fee", "admission fee", "ADM-01", "Consumables & Miscellaneous", Decimal("1.00"), "charge", Decimal("1000.00"), Decimal("1000.00"), Decimal("0.99"), True),
            ("Hospital Admission Fee", "admission fee", "ADM-01", "Consumables & Miscellaneous", Decimal("1.00"), "charge", Decimal("1000.00"), Decimal("1000.00"), Decimal("0.99"), True),
        ],
    )

    # Scenario 4: High Price with Only Contextual Evidence (Laparoscopic Cholecystectomy)
    _seed_bill(
        db=db,
        user_id=demo_user.id,
        hospital_id=hospitals["fortis"].id,
        filename="scenario_4_high_price_contextual.pdf",
        bill_date=date(2024, 3, 15),
        total_amount=Decimal("95000.00"),
        is_demo=True,
        items=[
            ("Laparoscopic Cholecystectomy Procedure", "laparoscopic cholecystectomy", "PROC-LAP-CHOL", "Procedures", Decimal("1.00"), "procedure", Decimal("95000.00"), Decimal("95000.00"), Decimal("0.94"), True),
        ],
    )

    # Scenario 5: Verified Statutory Rule Violation (Coronary Stent above NPPA cap)
    _seed_bill(
        db=db,
        user_id=demo_user.id,
        hospital_id=hospitals["apollo"].id,
        filename="scenario_5_verified_rule_violation.pdf",
        bill_date=date(2024, 3, 16),
        total_amount=Decimal("65000.00"),
        is_demo=True,
        items=[
            ("Coronary Drug Eluting Stent (DES)", "coronary drug eluting stent", "STENT-DES-01", "Procedures", Decimal("1.00"), "unit", Decimal("65000.00"), Decimal("65000.00"), Decimal("0.99"), True),
        ],
    )

    # Scenario 6: Missing Benchmark (Rare specialized procedure)
    _seed_bill(
        db=db,
        user_id=demo_user.id,
        hospital_id=hospitals["fortis"].id,
        filename="scenario_6_missing_benchmark.pdf",
        bill_date=date(2024, 3, 18),
        total_amount=Decimal("12500.00"),
        is_demo=True,
        items=[
            ("Stereotactic Body Radiation Therapy Custom Plan", "stereotactic body radiation therapy", "RAD-CUSTOM-09", "Procedures", Decimal("1.00"), "plan", Decimal("12500.00"), Decimal("12500.00"), Decimal("0.92"), True),
        ],
    )

    # Scenario 7: Expired Benchmark (COVID RT-PCR billed in 2024 with expired 2022 cap)
    _seed_bill(
        db=db,
        user_id=demo_user.id,
        hospital_id=hospitals["max"].id,
        filename="scenario_7_expired_benchmark.pdf",
        bill_date=date(2024, 3, 20),
        total_amount=Decimal("900.00"),
        is_demo=True,
        items=[
            ("COVID-19 RT-PCR Test", "covid-19 rt-pcr test", "DIAG-RTPCR-01", "Diagnostics", Decimal("1.00"), "test", Decimal("900.00"), Decimal("900.00"), Decimal("0.95"), True),
        ],
    )

    # Scenario 8: Quantity or Unit Mismatch (Zero quantity billed)
    _seed_bill(
        db=db,
        user_id=demo_user.id,
        hospital_id=hospitals["apollo"].id,
        filename="scenario_8_unit_quantity_mismatch.pdf",
        bill_date=date(2024, 3, 22),
        total_amount=Decimal("500.00"),
        is_demo=True,
        items=[
            ("Incomplete Dispensing Record - Paracetamol", "paracetamol 650mg", "PHARM-PCM-650", "Pharmacy", Decimal("0.00"), "strip", Decimal("500.00"), Decimal("500.00"), Decimal("0.85"), True),
        ],
    )

    # Scenario 9: Low-Confidence OCR Extraction (Unconfirmed blurry line)
    _seed_bill(
        db=db,
        user_id=demo_user.id,
        hospital_id=hospitals["max"].id,
        filename="scenario_9_low_confidence_ocr.pdf",
        bill_date=date(2024, 3, 24),
        total_amount=Decimal("1500.00"),
        is_demo=True,
        items=[
            ("Blurry Item *Medication* 50mg", "blurry medication", None, "Pharmacy", Decimal("1.00"), "unit", Decimal("1500.00"), Decimal("1500.00"), Decimal("0.45"), False),
        ],
    )

    logger.info("Database seeding completed for base demo scenarios. Now seeding 3 fictional hospitals and 300 invoices...")
    synthetic_summary = seed_synthetic_dataset(db, invoices_per_hospital=100)

    return {
        "users": 2,
        "legacy_hospitals": len(hospitals),
        "benchmarks": len(benchmarks_data),
        "legacy_demo_bills": 9,
        **synthetic_summary,
    }



def _seed_bill(db, user_id, hospital_id, filename, bill_date, total_amount, is_demo, items):
    existing = db.query(Bill).filter_by(original_filename=filename).first()
    if existing:
        return existing

    bill = Bill(
        user_id=user_id,
        hospital_id=hospital_id,
        original_filename=filename,
        storage_path=f"demo_files/{filename}",
        bill_date=bill_date,
        total_amount=total_amount,
        extracted_text=f"Synthetic demo bill content for {filename}",
        processing_status="extracted",
        is_demo=is_demo,
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)

    for itm in items:
        desc, norm, code, cat, qty, unit, price, total, conf, conf_user = itm
        bi = BillItem(
            bill_id=bill.id,
            description=desc,
            normalized_name=norm,
            service_code=code,
            category=cat,
            quantity=qty,
            unit=unit,
            unit_price=price,
            line_total=total,
            extraction_confidence=conf,
            user_confirmed=conf_user,
        )
        db.add(bi)
    db.commit()
    return bill
