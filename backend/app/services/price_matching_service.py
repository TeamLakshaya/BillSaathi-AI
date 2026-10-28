from datetime import date
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.bill_item import BillItem
from app.models.benchmark import Benchmark
from app.repositories.benchmark_repository import BenchmarkRepository
from app.utils.dates import is_date_effective


class PriceMatchingService:
    def __init__(self, db: Session):
        self.repo = BenchmarkRepository(db)

    def match_item_to_benchmark(
        self,
        item: BillItem,
        hospital_id: Optional[str] = None,
        region: Optional[str] = None,
        bill_date: Optional[date] = None,
    ) -> Tuple[Optional[Benchmark], str, str]:
        """
        Matches a BillItem to an applicable Benchmark.
        Returns: (benchmark, status_category, selection_reason)
        status_category: 'statutory_ceiling' | 'hospital_tariff' | 'contextual' | 'insufficient_evidence'
        """
        # Search benchmark
        benchmark = self.repo.find_matching_benchmark(
            normalized_name=item.normalized_name,
            service_code=item.service_code,
            hospital_id=hospital_id,
            region=region,
            bill_date=bill_date,
        )

        if not benchmark:
            return None, "insufficient_evidence", f"No verified benchmark or statutory tariff found for '{item.normalized_name}'."

        # Date validity check
        if not is_date_effective(bill_date, benchmark.effective_from, benchmark.effective_until):
            return None, "insufficient_evidence", (
                f"Benchmark '{benchmark.source_name}' exists for '{item.normalized_name}' but is expired or not effective for bill date {bill_date}."
            )

        # Categorize benchmark applicability
        b_type = benchmark.benchmark_type.lower()
        if b_type in ("price_ceiling", "statutory_cap", "nppa_ceiling"):
            status_cat = "statutory_ceiling"
            reason = f"Statutory price ceiling governed by {benchmark.source_name} ({benchmark.source_reference})."
        elif b_type in ("hospital_tariff", "internal_rate_card", "package_term"):
            status_cat = "hospital_tariff"
            reason = f"Hospital published tariff card from {benchmark.source_name}."
        elif b_type in ("cghs_rate", "ayushman_bharat"):
            status_cat = "scheme_rate"
            reason = f"Government scheme reference rate from {benchmark.source_name} (applicable contextually unless empanelled)."
        else:
            status_cat = "contextual"
            reason = f"Comparative regional market pricing from {benchmark.source_name}."

        return benchmark, status_cat, reason
