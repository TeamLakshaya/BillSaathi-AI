import json
from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundError
from app.repositories.bill_repository import BillRepository
from app.repositories.verification_repository import VerificationRepository
from app.schemas.verification import BillVerificationSummary, VerificationResultResponse
from app.services.duplicate_detection_service import DuplicateDetectionService
from app.services.price_matching_service import PriceMatchingService
from app.utils.money import calculate_line_total, check_arithmetic_tolerance


class VerificationService:
    def __init__(self, db: Session):
        self.db = db
        self.bill_repo = BillRepository(db)
        self.verif_repo = VerificationRepository(db)
        self.price_matching = PriceMatchingService(db)
        self.dup_service = DuplicateDetectionService()

    def verify_bill(self, bill_id: str) -> BillVerificationSummary:
        bill = self.bill_repo.get_by_id(bill_id)
        if not bill:
            raise NotFoundError(f"Bill {bill_id} not found")

        items = bill.items or []
        findings: List[Dict[str, Any]] = []

        region = bill.hospital.state if bill.hospital else "National"
        current_version = getattr(bill, "version", 1)

        # 1. Grand Total & Subtotal Arithmetic Verification
        calculated_lines_total = sum((itm.line_total for itm in items), Decimal("0.00"))
        tax_amt = bill.tax_amount or Decimal("0.00")
        disc_amt = bill.discount_amount or Decimal("0.00")
        expected_grand_total = calculated_lines_total + tax_amt - disc_amt

        # 1A. Subtotal check if explicitly present
        if bill.subtotal is not None and not check_arithmetic_tolerance(bill.subtotal, calculated_lines_total, tolerance=Decimal("0.50")):
            sub_diff = bill.subtotal - calculated_lines_total
            findings.append({
                "bill_item_id": None,
                "benchmark_id": None,
                "billed_amount": bill.subtotal,
                "benchmark_amount": calculated_lines_total,
                "difference_amount": sub_diff,
                "status": "verified_discrepancy",
                "reason": (
                    f"Subtotal Arithmetic Mismatch: Stated subtotal is ₹{bill.subtotal}, "
                    f"but sum of line items is ₹{calculated_lines_total} (Difference: ₹{sub_diff})."
                ),
                "evidence": json.dumps({
                    "check": "subtotal_arithmetic",
                    "stated_subtotal": str(bill.subtotal),
                    "sum_of_lines": str(calculated_lines_total),
                    "difference": str(sub_diff),
                }),
                "confidence": Decimal("1.00"),
                "rule_version": "v1.0.0",
                "bill_version": current_version,
                "is_demo": bill.is_demo,
            })

        # 1B. Grand Total Arithmetic check
        if not check_arithmetic_tolerance(bill.total_amount, expected_grand_total, tolerance=Decimal("1.00")):
            diff = bill.total_amount - expected_grand_total
            calc_explanation = f"items ₹{calculated_lines_total}"
            if tax_amt > 0:
                calc_explanation += f" + taxes ₹{tax_amt}"
            if disc_amt > 0:
                calc_explanation += f" - discounts ₹{disc_amt}"

            findings.append({
                "bill_item_id": None,
                "benchmark_id": None,
                "billed_amount": bill.total_amount,
                "benchmark_amount": expected_grand_total,
                "difference_amount": diff,
                "status": "verified_discrepancy",
                "reason": (
                    f"Grand Total Arithmetic Mismatch: Stated bill total is ₹{bill.total_amount}, "
                    f"but calculated total ({calc_explanation}) is ₹{expected_grand_total} (Difference: ₹{diff})."
                ),
                "evidence": json.dumps({
                    "check": "grand_total_arithmetic",
                    "stated_total": str(bill.total_amount),
                    "sum_of_lines": str(calculated_lines_total),
                    "tax_amount": str(tax_amt),
                    "discount_amount": str(disc_amt),
                    "calculated_expected": str(expected_grand_total),
                    "difference": str(diff),
                }),
                "confidence": Decimal("1.00"),
                "rule_version": "v1.0.0",
                "bill_version": current_version,
                "is_demo": bill.is_demo,
            })

        # 2. Line-Level Arithmetic & Price Benchmark Checks
        for item in items:
            # Check 2A: Line item arithmetic
            expected_line = calculate_line_total(item.quantity, item.unit_price)
            if not check_arithmetic_tolerance(item.line_total, expected_line, tolerance=Decimal("0.50")):
                diff = item.line_total - expected_line
                findings.append({
                    "bill_item_id": item.id,
                    "benchmark_id": None,
                    "billed_amount": item.line_total,
                    "benchmark_amount": expected_line,
                    "difference_amount": diff,
                    "status": "verified_discrepancy",
                    "reason": (
                        f"Line Arithmetic Error on '{item.description}': Billed ₹{item.line_total}, "
                        f"but {item.quantity} x ₹{item.unit_price} = ₹{expected_line}."
                    ),
                    "evidence": json.dumps({
                        "check": "line_arithmetic",
                        "quantity": str(item.quantity),
                        "unit_price": str(item.unit_price),
                        "stated_line_total": str(item.line_total),
                        "calculated_line_total": str(expected_line),
                    }),
                    "confidence": Decimal("1.00"),
                    "rule_version": "v1.0.0",
                    "bill_version": current_version,
                    "is_demo": bill.is_demo,
                })

            # Check 2B: Quantity / Unit validity
            if item.quantity <= Decimal("0.00"):
                findings.append({
                    "bill_item_id": item.id,
                    "benchmark_id": None,
                    "billed_amount": item.line_total,
                    "benchmark_amount": None,
                    "difference_amount": None,
                    "status": "needs_review",
                    "reason": f"Non-positive or missing quantity ({item.quantity}) recorded for '{item.description}'.",
                    "evidence": json.dumps({"check": "invalid_quantity"}),
                    "confidence": Decimal("0.90"),
                    "rule_version": "v1.0.0",
                    "bill_version": current_version,
                    "is_demo": bill.is_demo,
                })

            # Check 2C: Price Benchmark Matching
            benchmark, status_category, selection_reason = self.price_matching.match_item_to_benchmark(
                item=item,
                hospital_id=bill.hospital_id,
                region=region,
                bill_date=bill.bill_date,
            )

            if not benchmark:
                findings.append({
                    "bill_item_id": item.id,
                    "benchmark_id": None,
                    "billed_amount": item.line_total,
                    "benchmark_amount": None,
                    "difference_amount": None,
                    "status": "insufficient_evidence",
                    "reason": selection_reason,
                    "evidence": json.dumps({
                        "check": "benchmark_search",
                        "status_category": status_category,
                        "normalized_name": item.normalized_name,
                    }),
                    "confidence": Decimal("0.70"),
                    "rule_version": "v1.0.0",
                    "bill_version": current_version,
                    "is_demo": bill.is_demo,
                })
            else:
                benchmark_rate = benchmark.amount
                expected_amount = benchmark_rate * item.quantity
                difference = item.line_total - expected_amount

                if item.unit_price > benchmark_rate:
                    is_statutory = status_category == "statutory_ceiling"
                    status = "verified_discrepancy" if is_statutory else "needs_review"

                    if is_statutory:
                        reason = (
                            f"Verified price cap breach for '{item.description}': Billed rate ₹{item.unit_price} "
                            f"exceeds official statutory ceiling of ₹{benchmark_rate} by ₹{item.unit_price - benchmark_rate} per unit "
                            f"(Source: {benchmark.source_name})."
                        )
                    else:
                        percent_above = ((item.unit_price - benchmark_rate) / benchmark_rate * 100).quantize(Decimal("0.1"))
                        reason = (
                            f"Price requires review for '{item.description}': Billed rate ₹{item.unit_price} is {percent_above}% "
                            f"higher than contextual reference rate of ₹{benchmark_rate} from {benchmark.source_name}. "
                            f"Private providers may have differing institutional price tiers."
                        )

                    findings.append({
                        "bill_item_id": item.id,
                        "benchmark_id": benchmark.id,
                        "billed_amount": item.line_total,
                        "benchmark_amount": expected_amount,
                        "difference_amount": difference,
                        "status": status,
                        "reason": reason,
                        "evidence": json.dumps({
                            "check": "benchmark_comparison",
                            "benchmark_id": benchmark.id,
                            "benchmark_name": benchmark.normalized_item_name,
                            "source_name": benchmark.source_name,
                            "source_reference": benchmark.source_reference,
                            "is_synthetic": benchmark.is_synthetic,
                            "rate_difference_per_unit": str(item.unit_price - benchmark_rate),
                        }),
                        "confidence": Decimal("0.98") if is_statutory else Decimal("0.85"),
                        "rule_version": "v1.0.0",
                        "bill_version": current_version,
                        "is_demo": bill.is_demo or benchmark.is_synthetic,
                    })
                else:
                    findings.append({
                        "bill_item_id": item.id,
                        "benchmark_id": benchmark.id,
                        "billed_amount": item.line_total,
                        "benchmark_amount": expected_amount,
                        "difference_amount": Decimal("0.00"),
                        "status": "no_discrepancy_detected",
                        "reason": f"Billed rate ₹{item.unit_price} is within benchmark reference of ₹{benchmark_rate} ({benchmark.source_name}).",
                        "evidence": json.dumps({
                            "check": "benchmark_comparison",
                            "benchmark_id": benchmark.id,
                            "source_name": benchmark.source_name,
                            "is_synthetic": benchmark.is_synthetic,
                        }),
                        "confidence": Decimal("0.95"),
                        "rule_version": "v1.0.0",
                        "bill_version": current_version,
                        "is_demo": bill.is_demo,
                    })

        # 3. Duplicate Items Verification
        dup_findings = self.dup_service.check_duplicates(items)
        for df in dup_findings:
            findings.append({
                "bill_item_id": df["bill_item_id"],
                "benchmark_id": None,
                "billed_amount": df["billed_amount"],
                "benchmark_amount": df.get("benchmark_amount"),
                "difference_amount": df.get("difference_amount"),
                "status": df["status"],
                "reason": df["reason"],
                "evidence": json.dumps(df.get("evidence", {})),
                "confidence": df.get("confidence", Decimal("0.85")),
                "rule_version": "v1.0.0",
                "bill_version": current_version,
                "is_demo": bill.is_demo,
            })

        # Save results to DB
        saved_records = self.verif_repo.save_results(bill_id, findings)
        # Update bill audit version to match current version
        self.bill_repo.update(
            bill_id,
            audit_version=current_version,
            processing_status="completed",
        )

        # Compile Summary
        verified_discrepancies = sum(
            (r.difference_amount for r in saved_records if r.status == "verified_discrepancy" and r.difference_amount),
            Decimal("0.00"),
        )
        review_count = sum(1 for r in saved_records if r.status == "needs_review")
        overall_status = "verified_discrepancy" if verified_discrepancies > 0 else ("needs_review" if review_count > 0 else "no_discrepancy_detected")

        return BillVerificationSummary(
            bill_id=bill.id,
            bill_date=str(bill.bill_date) if bill.bill_date else None,
            hospital_name=bill.hospital.name if bill.hospital else "Unspecified Hospital",
            total_billed=bill.total_amount,
            subtotal=bill.subtotal,
            tax_amount=bill.tax_amount,
            discount_amount=bill.discount_amount,
            calculated_items_total=calculated_lines_total,
            arithmetic_valid=check_arithmetic_tolerance(bill.total_amount, expected_grand_total),
            total_verified_discrepancies=verified_discrepancies,
            total_review_items=review_count,
            overall_status=overall_status,
            bill_version=current_version,
            audit_version=current_version,
            is_outdated=False,
            is_demo=bill.is_demo,
            results=[VerificationResultResponse.model_validate(r) for r in saved_records],
        )

    def get_verification_summary(self, bill_id: str) -> BillVerificationSummary:
        bill = self.bill_repo.get_by_id(bill_id)
        if not bill:
            raise NotFoundError(f"Bill {bill_id} not found")

        records = self.verif_repo.get_by_bill_id(bill_id)
        if not records:
            # Run verification on the fly if not yet run
            return self.verify_bill(bill_id)

        calculated_lines_total = sum((itm.line_total for itm in bill.items), Decimal("0.00"))
        tax_amt = bill.tax_amount or Decimal("0.00")
        disc_amt = bill.discount_amount or Decimal("0.00")
        expected_grand_total = calculated_lines_total + tax_amt - disc_amt

        verified_discrepancies = sum(
            (r.difference_amount for r in records if r.status == "verified_discrepancy" and r.difference_amount),
            Decimal("0.00"),
        )
        review_count = sum(1 for r in records if r.status == "needs_review")
        overall_status = "verified_discrepancy" if verified_discrepancies > 0 else ("needs_review" if review_count > 0 else "no_discrepancy_detected")

        is_outdated = (bill.version > bill.audit_version and bill.audit_version > 0)

        return BillVerificationSummary(
            bill_id=bill.id,
            bill_date=str(bill.bill_date) if bill.bill_date else None,
            hospital_name=bill.hospital.name if bill.hospital else "Unspecified Hospital",
            total_billed=bill.total_amount,
            subtotal=bill.subtotal,
            tax_amount=bill.tax_amount,
            discount_amount=bill.discount_amount,
            calculated_items_total=calculated_lines_total,
            arithmetic_valid=check_arithmetic_tolerance(bill.total_amount, expected_grand_total),
            total_verified_discrepancies=verified_discrepancies,
            total_review_items=review_count,
            overall_status=overall_status,
            bill_version=bill.version,
            audit_version=bill.audit_version,
            is_outdated=is_outdated,
            is_demo=bill.is_demo,
            results=[VerificationResultResponse.model_validate(r) for r in records],
        )

