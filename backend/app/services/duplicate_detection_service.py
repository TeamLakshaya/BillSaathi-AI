from collections import defaultdict
from decimal import Decimal
from typing import List, Dict, Any, Tuple
from app.models.bill_item import BillItem

# One-time per admission services that should never be billed more than once
ONE_TIME_SERVICES = {
    "admission fee",
    "admission charge",
    "admission charges",
    "registration fee",
    "registration charge",
    "discharge summary charge",
    "discharge fee",
    "initial clinical assessment",
}


class DuplicateDetectionService:
    def check_duplicates(self, items: List[BillItem]) -> List[Dict[str, Any]]:
        """
        Detects exact and potential duplicate line items.
        Avoids false positives by returning 'needs_review' unless item is a strict one-time service.
        """
        findings = []
        name_groups: Dict[Tuple[str, Decimal], List[BillItem]] = defaultdict(list)

        for itm in items:
            key = (itm.normalized_name.lower().strip(), itm.unit_price)
            name_groups[key].append(itm)

        for (norm_name, unit_price), group in name_groups.items():
            if len(group) > 1:
                is_one_time = any(service in norm_name for service in ONE_TIME_SERVICES)
                status = "verified_discrepancy" if is_one_time else "needs_review"
                # We flag each repeated instance after the first
                for idx, repeated_item in enumerate(group[1:], start=2):
                    reason = (
                        f"Potential duplicate charge detected: '{repeated_item.description}' appears {len(group)} times "
                        f"with identical unit rate (₹{unit_price}). "
                    )
                    if is_one_time:
                        reason += "This service is classified as a single one-time admission charge."
                    else:
                        reason += "Please verify clinical chart to confirm if this represents a distinct separate administration."

                    findings.append({
                        "bill_item_id": repeated_item.id,
                        "billed_amount": repeated_item.line_total,
                        "benchmark_amount": Decimal("0.00") if is_one_time else None,
                        "difference_amount": repeated_item.line_total if is_one_time else None,
                        "status": status,
                        "reason": reason,
                        "evidence": {
                            "duplicate_check": True,
                            "is_one_time_service": is_one_time,
                            "occurrences": len(group),
                            "instance_index": idx,
                            "unit_price": str(unit_price),
                        },
                        "confidence": Decimal("0.95") if is_one_time else Decimal("0.80"),
                    })

        return findings
