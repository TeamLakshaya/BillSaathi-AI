"""
Deterministic, idempotent synthetic dataset seeder for Bill Saathi AI.
Generates:
- 3 Fictional Hospitals in Lucknow, UP (AarogyaCare, Medivista, Lok Seva)
- 120+ Standardized Service Catalog entries per hospital (360+ catalog entries)
- Standardized Hospital Medicine Catalog entries with NPPA caps and subsidy rules
- 100 Plausible Synthetic Invoices per hospital (300 invoices total)
- Linked Admissions, Clinical Orders, Payments, and Evidence-backed Audit Findings
- Fully reproducible using random.seed(42) and idempotent by deterministic IDs.

SYNTHETIC DEMO DATA — FICTIONAL HOSPITALS AND SIMULATED PRICES. NOT ACTUAL HOSPITAL TARIFFS.
"""

import json
import random
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Dict, Any, List

from sqlalchemy.orm import Session
from app.core.logging import logger
from app.models.hospital import Hospital
from app.models.service_catalog import HospitalServiceCatalog
from app.models.medicine import HospitalMedicine
from app.models.benchmark import Benchmark
from app.models.admission import Admission
from app.models.clinical_order import ClinicalOrder
from app.models.bill import Bill
from app.models.bill_item import BillItem
from app.models.payment import BillPayment
from app.models.verification import VerificationResult
from app.utils.money import calculate_line_total

from app.db.synthetic_dataset_definitions import (
    FICTIONAL_HOSPITALS,
    STANDARDIZED_SERVICES,
    STANDARDIZED_MEDICINES,
    CLINICAL_SCENARIO_TEMPLATES,
    SYNTHETIC_FIRST_NAMES,
    SYNTHETIC_LAST_NAMES,
)


def seed_synthetic_dataset(db: Session, invoices_per_hospital: int = 100) -> Dict[str, Any]:
    """
    Populates or updates database with realistic synthetic hospital data.
    Guaranteed idempotent: can be run repeatedly without duplicating records.
    """
    logger.info("Starting synthetic dataset seeding with fixed seed 42...")
    random.seed(42)

    # 1. Seed or Update the Three Fictional Hospitals
    hospital_records: Dict[str, Hospital] = {}
    for h_data in FICTIONAL_HOSPITALS:
        existing = db.query(Hospital).filter(
            (Hospital.id == h_data["id"]) | (Hospital.code == h_data["code"])
        ).first()

        if existing:
            existing.code = h_data["code"]
            existing.name = h_data["name"]
            existing.location = h_data["location"]
            existing.city = h_data["city"]
            existing.state = h_data["state"]
            existing.hospital_type = h_data["hospital_type"]
            existing.hospital_category = h_data["hospital_category"]
            existing.facility_category = h_data["facility_category"]
            existing.tier = h_data["tier"]
            existing.tariff_profile = h_data["tariff_profile"]
            existing.bed_count = h_data["bed_count"]
            existing.nabh_status = h_data["nabh_status"]
            existing.facilities_json = h_data["facilities_json"]
            existing.specialties_json = h_data["specialties_json"]
            existing.aliases_json = json.dumps(h_data["aliases"])
            existing.is_simulated = True
            existing.is_active = True
            hospital_records[h_data["code"]] = existing
        else:
            new_h = Hospital(
                id=h_data["id"],
                code=h_data["code"],
                name=h_data["name"],
                location=h_data["location"],
                city=h_data["city"],
                state=h_data["state"],
                hospital_type=h_data["hospital_type"],
                hospital_category=h_data["hospital_category"],
                facility_category=h_data["facility_category"],
                tier=h_data["tier"],
                tariff_profile=h_data["tariff_profile"],
                bed_count=h_data["bed_count"],
                nabh_status=h_data["nabh_status"],
                facilities_json=h_data["facilities_json"],
                specialties_json=h_data["specialties_json"],
                aliases_json=json.dumps(h_data["aliases"]),
                is_simulated=True,
                is_active=True,
            )
            db.add(new_h)
            hospital_records[h_data["code"]] = new_h

    db.commit()
    for code, h in hospital_records.items():
        db.refresh(h)

    # 2. Seed Standardized Service Catalog for Each Hospital
    catalog_count = 0
    service_lookup: Dict[str, Dict[str, Any]] = {}
    for s_def in STANDARDIZED_SERVICES:
        code = s_def["code"]
        service_lookup[code] = s_def
        rates = {
            "HOSP-001": s_def["rate_h1"],
            "HOSP-002": s_def["rate_h2"],
            "HOSP-003": s_def["rate_h3"],
        }
        for h_code, rate in rates.items():
            h_obj = hospital_records[h_code]
            cat_id = f"CAT-{h_code}-{code}"
            existing_cat = db.query(HospitalServiceCatalog).filter_by(id=cat_id).first()
            if not existing_cat:
                new_cat = HospitalServiceCatalog(
                    id=cat_id,
                    hospital_id=h_obj.id,
                    service_code=code,
                    service_name=s_def["name"],
                    description=s_def.get("description"),
                    category=s_def["category"],
                    department=s_def["department"],
                    applicable_service_type=s_def["type"],
                    unit=s_def["unit"],
                    rate=rate,
                    currency="INR",
                    room_category=s_def.get("room_category"),
                    effective_from=date(2024, 1, 1),
                    effective_until=date(2027, 12, 31),
                    is_active=True,
                    data_provenance=f"Simulated Tariff ({h_obj.name})",
                )
                db.add(new_cat)
                catalog_count += 1
            else:
                existing_cat.rate = rate
                existing_cat.service_name = s_def["name"]
                catalog_count += 1

    db.commit()

    # 3. Seed Hospital Medicine Catalog & Subsidies
    medicine_count = 0
    medicine_lookup: Dict[str, Dict[str, Any]] = {}
    for m_def in STANDARDIZED_MEDICINES:
        m_code = m_def["service_code"]
        medicine_lookup[m_code] = m_def
        med_configs = {
            "HOSP-001": {
                "rate": m_def["rate_h1"],
                "payable": m_def["rate_h1"],
                "stock": "in_stock",
                "subsidy": "non_subsidized",
                "reason": "Billed at standard hospital pharmacy discount off MRP",
            },
            "HOSP-002": {
                "rate": m_def["rate_h2"],
                "payable": m_def["rate_h2"],
                "stock": "in_stock",
                "subsidy": "non_subsidized",
                "reason": "Premium branded formulation billed under institutional tariff",
            },
            "HOSP-003": {
                "rate": m_def["rate_h3"],
                "payable": m_def["rate_h3"],
                "stock": m_def.get("stock_status_h3", "in_stock"),
                "subsidy": m_def.get("subsidy_category_h3", "fully_subsidized_free"),
                "reason": m_def.get("subsidy_reason_h3", "State Essential Drug List Free Dispensation"),
            },
        }

        for h_code, cfg in med_configs.items():
            h_obj = hospital_records[h_code]
            med_id = f"MED-{h_code}-{m_code}"
            existing_med = db.query(HospitalMedicine).filter_by(id=med_id).first()
            if not existing_med:
                new_med = HospitalMedicine(
                    id=med_id,
                    hospital_id=h_obj.id,
                    service_code=m_code,
                    medicine_name=m_def["medicine_name"],
                    generic_name=m_def["generic_name"],
                    brand_name=m_def.get("brand_name"),
                    strength=m_def["strength"],
                    dosage_form=m_def["dosage_form"],
                    pack_size=m_def["pack_size"],
                    dispensing_unit=m_def["dispensing_unit"],
                    manufacturer=m_def.get("manufacturer"),
                    mrp=m_def["mrp_per_unit"],
                    regulated_ceiling_price=m_def.get("nppa_ceiling"),
                    procurement_cost=m_def.get("procurement_cost"),
                    billed_rate_per_unit=cfg["rate"],
                    patient_payable_rate=cfg["payable"],
                    stock_status=cfg["stock"],
                    subsidy_category=cfg["subsidy"],
                    subsidy_reason=cfg["reason"],
                    source_reference="Simulated Lucknow Hospital Formulary 2026",
                    is_synthetic=True,
                )
                db.add(new_med)
                medicine_count += 1
            else:
                existing_med.billed_rate_per_unit = cfg["rate"]
                existing_med.patient_payable_rate = cfg["payable"]
                existing_med.stock_status = cfg["stock"]
                existing_med.subsidy_category = cfg["subsidy"]
                medicine_count += 1

    db.commit()

    # 4. Seed Essential Reference Benchmarks
    benchmarks_data = [
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
        {
            "normalized_item_name": "paracetamol 650mg tablet",
            "service_code": "MED-PCM-650",
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
        {
            "normalized_item_name": "normal saline 500ml iv",
            "service_code": "MED-NS-500",
            "applicable_region": "National",
            "benchmark_type": "price_ceiling",
            "amount": Decimal("21.50"),
            "currency": "INR",
            "source_name": "NPPA DPCO IV Fluid Ceiling Schedule",
            "source_reference": "DPCO Ceiling Order for 0.9% Sodium Chloride 500ml",
            "source_url": "https://www.nppaindia.nic.in",
            "effective_from": date(2021, 4, 1),
            "effective_until": None,
            "verification_status": "verified",
            "is_synthetic": False,
        },
        {
            "normalized_item_name": "complete blood count",
            "service_code": "DIAG-CBC-01",
            "applicable_region": "National",
            "benchmark_type": "cghs_rate",
            "amount": Decimal("180.00"),
            "currency": "INR",
            "source_name": "CGHS Lucknow Rate Schedule",
            "source_reference": "Central Government Health Scheme Lucknow Tariff 2023",
            "source_url": "https://cghs.gov.in",
            "effective_from": date(2023, 1, 1),
            "effective_until": None,
            "verification_status": "verified",
            "is_synthetic": False,
        },
    ]
    for b_item in benchmarks_data:
        existing_b = db.query(Benchmark).filter_by(
            service_code=b_item["service_code"],
            source_name=b_item["source_name"],
        ).first()
        if not existing_b:
            db.add(Benchmark(**b_item))
    db.commit()

    # 5. Seed Exactly 100 Invoices per Hospital (300 Invoices Total)
    # With linked Admissions, Orders, Items, Payments, and Verification Findings.
    invoice_count = 0
    item_count = 0
    payment_count = 0
    findings_count = 0

    base_date = date(2026, 1, 1)

    hospital_codes = ["HOSP-001", "HOSP-002", "HOSP-003"]
    tpa_names = ["Star Health & Allied Insurance", "Medi Assist TPA", "ICICI Lombard Health Care", "Bajaj Allianz General Insurance"]

    for h_code in hospital_codes:
        h_obj = hospital_records[h_code]
        h_num = h_code.split("-")[1][-1]  # 1, 2, or 3

        for i in range(1, invoices_per_hospital + 1):
            inv_id = f"INV-H{h_num}-{i:04d}"
            adm_id = f"ADM-H{h_num}-{i:04d}"

            # Pick a scenario deterministically
            template_idx = (i - 1) % len(CLINICAL_SCENARIO_TEMPLATES)
            scenario = CLINICAL_SCENARIO_TEMPLATES[template_idx]

            # Deterministic patient name
            f_name = SYNTHETIC_FIRST_NAMES[(i * 3 + int(h_num)) % len(SYNTHETIC_FIRST_NAMES)]
            l_name = SYNTHETIC_LAST_NAMES[(i * 5 + int(h_num)) % len(SYNTHETIC_LAST_NAMES)]
            patient_name = f"{f_name} {l_name} (Synthetic Demo)"
            patient_mrn = f"MRN-UP-{h_code}-{1000 + i}"

            # Dates
            day_offset = (i * 2) % 270
            adm_date = base_date + timedelta(days=day_offset)
            stay_days = scenario["stay_days"]
            disc_date = adm_date + timedelta(days=stay_days)
            bill_date = disc_date

            room_cat = scenario["room_type"]
            if h_code == "HOSP-002" and scenario.get("alt_room_h2"):
                room_cat = scenario["alt_room_h2"]

            # Intentional anomaly distribution for testing
            # i % 10 == 2 -> Arithmetic discrepancy
            # i % 10 == 3 -> Duplicate charge
            # i % 10 == 5 -> High price tariff breach / statutory cap check
            # i % 10 == 7 -> Payment reconciliation mismatch
            # Otherwise -> Clean valid bill
            anomaly_type = "valid"
            if i % 10 == 2:
                anomaly_type = "arithmetic_error"
            elif i % 10 == 3:
                anomaly_type = "duplicate_line"
            elif i % 10 == 5:
                anomaly_type = "tariff_breach"
            elif i % 10 == 7:
                anomaly_type = "payment_mismatch"

            # Check if Admission already exists
            existing_adm = db.query(Admission).filter_by(id=adm_id).first()
            if not existing_adm:
                adm = Admission(
                    id=adm_id,
                    hospital_id=h_obj.id,
                    patient_mrn=patient_mrn,
                    patient_name=patient_name,
                    admission_date=adm_date,
                    discharge_date=disc_date,
                    admission_type=scenario["admission_type"],
                    primary_diagnosis=scenario["diagnosis"],
                    attending_doctor=scenario["doctor"],
                    assigned_ward=f"{room_cat} Ward-{(i % 4) + 1}",
                    room_category=room_cat,
                    length_of_stay_days=stay_days,
                    discharge_status="Discharged Stable",
                    is_synthetic=True,
                )
                db.add(adm)
                db.commit()
            else:
                adm = existing_adm

            # Check if Bill already exists
            existing_bill = db.query(Bill).filter_by(id=inv_id).first()
            if existing_bill:
                # Bill already seeded; skip recreating items to preserve idempotency
                invoice_count += 1
                item_count += len(existing_bill.items)
                payment_count += len(existing_bill.payments)
                findings_count += len(existing_bill.verification_results)
                continue

            # Build line items
            bill_items_to_create: List[BillItem] = []
            clinical_orders_to_create: List[ClinicalOrder] = []
            line_no = 1
            running_subtotal = Decimal("0.00")

            # A. Core Services
            for s_code, qty in scenario["core_services"]:
                s_def = service_lookup.get(s_code)
                if not s_def:
                    continue

                if h_code == "HOSP-001":
                    unit_price = s_def["rate_h1"]
                elif h_code == "HOSP-002":
                    unit_price = s_def["rate_h2"]
                else:
                    unit_price = s_def["rate_h3"]

                qty_dec = Decimal(str(qty))
                line_total = calculate_line_total(qty_dec, unit_price)

                # Anomaly injection for testing
                if anomaly_type == "arithmetic_error" and line_no == 1:
                    # Line calculation intentional mismatch
                    line_total = line_total + Decimal("500.00")

                running_subtotal += line_total

                # Create Order
                ord_id = f"ORD-{inv_id}-{line_no}"
                c_order = ClinicalOrder(
                    id=ord_id,
                    admission_id=adm.id,
                    hospital_id=h_obj.id,
                    service_code=s_code,
                    order_type=s_def["type"],
                    order_description=s_def["name"],
                    ordered_quantity=qty_dec,
                    dispensed_quantity=qty_dec,
                    administered_quantity=qty_dec,
                    order_status="completed",
                    order_date=datetime.combine(adm_date, datetime.min.time(), tzinfo=timezone.utc),
                    completion_date=datetime.combine(adm_date, datetime.min.time(), tzinfo=timezone.utc),
                    ordering_clinician=scenario["doctor"],
                    notes="Synthetic clinical order record",
                )
                clinical_orders_to_create.append(c_order)

                # Create BillItem
                b_item = BillItem(
                    id=f"ITM-{inv_id}-{line_no}",
                    bill_id=inv_id,
                    order_id=ord_id,
                    line_number=line_no,
                    description=s_def["name"],
                    normalized_name=s_def["name"].lower().strip(),
                    service_code=s_code,
                    category=s_def["category"],
                    quantity=qty_dec,
                    dispensed_quantity=qty_dec,
                    administered_quantity=qty_dec,
                    unit=s_def["unit"],
                    unit_price=unit_price,
                    discount_amount=Decimal("0.00"),
                    tax_amount=Decimal("0.00"),
                    line_total=line_total,
                    extraction_confidence=Decimal("0.98"),
                    user_confirmed=True,
                    data_source="synthetic_demo",
                    is_synthetic=True,
                )
                bill_items_to_create.append(b_item)
                line_no += 1

            # B. Core Medicines
            for m_code, qty in scenario["core_medicines"]:
                m_def = medicine_lookup.get(m_code)
                if not m_def:
                    continue

                if h_code == "HOSP-001":
                    unit_price = m_def["rate_h1"]
                elif h_code == "HOSP-002":
                    unit_price = m_def["rate_h2"]
                else:
                    unit_price = m_def["rate_h3"]

                qty_dec = Decimal(str(qty))
                line_total = calculate_line_total(qty_dec, unit_price)

                # Anomaly: Stent cap breach in Medivista for testing statutory cap breach
                if anomaly_type == "tariff_breach" and m_code == "MED-PCM-650" and h_code == "HOSP-002":
                    unit_price = Decimal("15.00")  # Way above NPPA cap of 2.35
                    line_total = calculate_line_total(qty_dec, unit_price)

                running_subtotal += line_total

                b_item = BillItem(
                    id=f"ITM-{inv_id}-{line_no}",
                    bill_id=inv_id,
                    line_number=line_no,
                    description=f"{m_def['medicine_name']} ({m_def.get('brand_name') or 'Generic'})",
                    normalized_name=m_def["medicine_name"].lower().strip(),
                    service_code=m_code,
                    category="Pharmacy",
                    quantity=qty_dec,
                    dispensed_quantity=qty_dec,
                    administered_quantity=qty_dec,
                    unit=m_def["dispensing_unit"],
                    unit_price=unit_price,
                    discount_amount=Decimal("0.00"),
                    tax_amount=Decimal("0.00"),
                    line_total=line_total,
                    extraction_confidence=Decimal("0.96"),
                    user_confirmed=True,
                    data_source="synthetic_demo",
                    is_synthetic=True,
                )
                bill_items_to_create.append(b_item)
                line_no += 1

            # Anomaly: Duplicate line injection
            if anomaly_type == "duplicate_line":
                dup_item = BillItem(
                    id=f"ITM-{inv_id}-{line_no}",
                    bill_id=inv_id,
                    line_number=line_no,
                    description="Hospital Inpatient Admission Registration Fee",
                    normalized_name="hospital inpatient admission registration fee",
                    service_code="ADM-REG-01",
                    category="Room & Stay",
                    quantity=Decimal("1.00"),
                    unit="charge",
                    unit_price=Decimal("500.00") if h_code != "HOSP-003" else Decimal("20.00"),
                    line_total=Decimal("500.00") if h_code != "HOSP-003" else Decimal("20.00"),
                    extraction_confidence=Decimal("0.99"),
                    user_confirmed=True,
                    data_source="synthetic_demo",
                    is_synthetic=True,
                )
                bill_items_to_create.append(dup_item)
                running_subtotal += dup_item.line_total
                line_no += 1

            # Grand Total Calculation
            tax_amt = Decimal("0.00")
            disc_amt = Decimal("0.00")
            if h_code != "HOSP-003" and running_subtotal > Decimal("10000.00"):
                disc_amt = (running_subtotal * Decimal("0.05")).quantize(Decimal("0.01"))

            stated_total = running_subtotal - disc_amt + tax_amt
            if anomaly_type == "arithmetic_error":
                # Stated grand total has additional arithmetic discrepancy
                stated_total += Decimal("1000.00")

            # Create Bill
            bill = Bill(
                id=inv_id,
                hospital_id=h_obj.id,
                admission_id=adm.id,
                invoice_number=f"INV/{h_code}/2026/{i:04d}",
                invoice_type="final",
                patient_mrn=patient_mrn,
                patient_name=patient_name,
                room_category=room_cat,
                admission_date=adm_date,
                discharge_date=disc_date,
                original_filename=f"synthetic_invoice_{h_code}_{i:04d}.pdf",
                storage_path=f"demo_synthetic/{h_code}/invoice_{i:04d}.pdf",
                file_hash=f"hash_{inv_id}",
                bill_date=bill_date,
                subtotal=running_subtotal,
                tax_amount=tax_amt,
                discount_amount=disc_amt,
                rounding_adjustment=Decimal("0.00"),
                total_amount=stated_total,
                net_amount=stated_total,
                extracted_text=f"SYNTHETIC DEMO INVOICE\nHospital: {h_obj.name}\nInvoice: {inv_id}\nPatient: {patient_name}\nTotal: INR {stated_total}",
                processing_status="completed",
                audit_scenario=anomaly_type,
                version=1,
                audit_version=1,
                is_demo=True,
            )
            db.add(bill)

            # Add Clinical Orders and Items
            for co in clinical_orders_to_create:
                db.add(co)
            for bi in bill_items_to_create:
                db.add(bi)

            # C. Payments & Insurance Reconciliation Records
            # 1. Advance Deposit
            deposit_amt = Decimal("0.00")
            if h_code != "HOSP-003" and stated_total > Decimal("5000.00"):
                deposit_amt = Decimal("5000.00") if stated_total < Decimal("20000.00") else Decimal("15000.00")
                dep_payment = BillPayment(
                    id=f"PAY-{inv_id}-DEP",
                    bill_id=inv_id,
                    payment_date=adm_date,
                    payment_type="deposit",
                    payment_mode="UPI",
                    amount=deposit_amt,
                    transaction_reference=f"UPI-TXN-{h_num}{i:04d}-DEP",
                    reconciliation_status="reconciled",
                    notes="Advance deposit collected at admission counter",
                )
                db.add(dep_payment)
                payment_count += 1

            # 2. Insurance / TPA claim or Patient Settlement
            remaining_balance = stated_total - deposit_amt
            if remaining_balance > Decimal("0.00"):
                if h_code == "HOSP-002" and remaining_balance > Decimal("10000.00"):
                    # TPA Insurance Claim
                    tpa = tpa_names[i % len(tpa_names)]
                    claimed = remaining_balance
                    approved = (claimed * Decimal("0.85")).quantize(Decimal("0.01"))
                    deductions = claimed - approved
                    is_pending = (anomaly_type == "payment_mismatch")

                    ins_payment = BillPayment(
                        id=f"PAY-{inv_id}-TPA",
                        bill_id=inv_id,
                        payment_date=disc_date,
                        payment_type="tpa_insurance_claim",
                        payment_mode="TPA Direct",
                        amount=approved if not is_pending else Decimal("0.00"),
                        transaction_reference=f"TPA-CLM-{h_num}{i:04d}",
                        insurance_claim_id=f"CLM/{h_code}/{i:04d}",
                        tpa_name=tpa,
                        claim_claimed_amount=claimed,
                        claim_approved_amount=approved if not is_pending else Decimal("0.00"),
                        claim_deduction_amount=deductions if not is_pending else Decimal("0.00"),
                        claim_status="settled" if not is_pending else "submitted",
                        reconciliation_status="reconciled" if not is_pending else "pending_settlement",
                        notes="Cashless claim settlement" if not is_pending else "Claim under final TPA review",
                    )
                    db.add(ins_payment)
                    payment_count += 1

                    # Patient Co-pay for deductions
                    if not is_pending and deductions > Decimal("0.00"):
                        copay_payment = BillPayment(
                            id=f"PAY-{inv_id}-COPAY",
                            bill_id=inv_id,
                            payment_date=disc_date,
                            payment_type="partial_payment",
                            payment_mode="Credit Card",
                            amount=deductions,
                            transaction_reference=f"CARD-TXN-{h_num}{i:04d}-COP",
                            reconciliation_status="reconciled",
                            notes="Patient copay for non-payable consumables and deductions",
                        )
                        db.add(copay_payment)
                        payment_count += 1
                else:
                    # Direct Patient Settlement
                    final_pay = BillPayment(
                        id=f"PAY-{inv_id}-SETTL",
                        bill_id=inv_id,
                        payment_date=disc_date,
                        payment_type="final_settlement",
                        payment_mode="Cash" if h_code == "HOSP-003" else "UPI",
                        amount=remaining_balance if anomaly_type != "payment_mismatch" else (remaining_balance - Decimal("500.00")),
                        transaction_reference=f"TXN-{h_num}{i:04d}-FIN",
                        reconciliation_status="reconciled" if anomaly_type != "payment_mismatch" else "disputed",
                        notes="Discharge counter final settlement payment",
                    )
                    db.add(final_pay)
                    payment_count += 1

            # D. Audit Findings Generation for Seeded Bills
            # 1. Base Arithmetic check
            expected_total = running_subtotal - disc_amt + tax_amt
            if abs(stated_total - expected_total) > Decimal("0.50"):
                diff = stated_total - expected_total
                finding_arith = VerificationResult(
                    id=f"VR-{inv_id}-ARITH",
                    bill_id=inv_id,
                    bill_item_id=None,
                    billed_amount=stated_total,
                    benchmark_amount=expected_total,
                    difference_amount=diff,
                    status="verified_discrepancy",
                    finding_category="arithmetic_mismatch",
                    severity="high",
                    reason=f"Grand Total Arithmetic Mismatch: Stated total is ₹{stated_total}, but line sum minus discounts is ₹{expected_total} (Difference: ₹{diff}).",
                    recommendation="Request re-issued invoice with corrected addition before processing payment.",
                    evidence=json.dumps({"stated": str(stated_total), "expected": str(expected_total), "difference": str(diff)}),
                    confidence=Decimal("1.00"),
                    reviewer_status="confirmed",
                    rule_version="v2.0.0",
                    bill_version=1,
                    is_demo=True,
                )
                db.add(finding_arith)
                findings_count += 1

            # 2. Duplicate line finding
            if anomaly_type == "duplicate_line":
                finding_dup = VerificationResult(
                    id=f"VR-{inv_id}-DUP",
                    bill_id=inv_id,
                    bill_item_id=bill_items_to_create[-1].id,
                    billed_amount=bill_items_to_create[-1].line_total,
                    benchmark_amount=Decimal("0.00"),
                    difference_amount=bill_items_to_create[-1].line_total,
                    status="needs_review",
                    finding_category="possible_duplicate",
                    severity="medium",
                    reason="Possible duplicate charge: Admission Registration Fee appears more than once on the same bill.",
                    recommendation="Confirm with billing office whether repeated admission entry is an accidental duplicate.",
                    evidence=json.dumps({"service_code": "ADM-REG-01", "duplicate_type": "repeated_one_time_charge"}),
                    confidence=Decimal("0.85"),
                    reviewer_status="requires_review",
                    rule_version="v2.0.0",
                    bill_version=1,
                    is_demo=True,
                )
                db.add(finding_dup)
                findings_count += 1

            # 3. Tariff check / Statutory cap finding
            if anomaly_type == "tariff_breach":
                finding_tariff = VerificationResult(
                    id=f"VR-{inv_id}-TARIFF",
                    bill_id=inv_id,
                    billed_amount=Decimal("15.00"),
                    benchmark_amount=Decimal("2.35"),
                    difference_amount=Decimal("12.65"),
                    status="verified_discrepancy",
                    finding_category="medicine_price_compliance",
                    severity="high",
                    reason="Verified statutory price ceiling breach: Paracetamol 650mg billed at ₹15.00/tab, exceeding NPPA DPCO cap of ₹2.35/tab by ₹12.65.",
                    recommendation="Present NPPA DPCO ceiling schedule reference to hospital billing desk for recalculation to notified ceiling.",
                    evidence=json.dumps({"official_cap": "2.35", "billed_rate": "15.00", "source": "NPPA DPCO Essential Drug Schedule"}),
                    confidence=Decimal("0.98"),
                    reviewer_status="confirmed",
                    rule_version="v2.0.0",
                    bill_version=1,
                    is_demo=True,
                )
                db.add(finding_tariff)
                findings_count += 1

            # 4. Payment reconciliation finding
            if anomaly_type == "payment_mismatch":
                finding_pay = VerificationResult(
                    id=f"VR-{inv_id}-PAY",
                    bill_id=inv_id,
                    billed_amount=stated_total,
                    benchmark_amount=stated_total - Decimal("500.00"),
                    difference_amount=Decimal("500.00"),
                    status="needs_review",
                    finding_category="payment_reconciliation_mismatch",
                    severity="medium",
                    reason="Payment reconciliation discrepancy: Recorded payments and claims do not reconcile with the total invoice amount.",
                    recommendation="Request an updated statement of accounts showing all payment receipts and pending TPA settlements.",
                    evidence=json.dumps({"unreconciled_difference": "500.00"}),
                    confidence=Decimal("0.90"),
                    reviewer_status="requires_review",
                    rule_version="v2.0.0",
                    bill_version=1,
                    is_demo=True,
                )
                db.add(finding_pay)
                findings_count += 1

            invoice_count += 1
            item_count += len(bill_items_to_create)

        db.commit()
        logger.info(f"Seeded hospital {h_code} successfully with {invoices_per_hospital} invoices.")

    summary = {
        "hospitals_seeded": len(hospital_records),
        "service_catalog_entries": catalog_count,
        "medicine_catalog_entries": medicine_count,
        "invoices_seeded": invoice_count,
        "invoice_items_seeded": item_count,
        "payments_seeded": payment_count,
        "audit_findings_seeded": findings_count,
        "fictional_warning": "SYNTHETIC DEMO DATA — FICTIONAL HOSPITALS AND SIMULATED PRICES. NOT ACTUAL HOSPITAL TARIFFS.",
    }
    logger.info(f"Synthetic dataset seeding completed: {summary}")
    return summary
