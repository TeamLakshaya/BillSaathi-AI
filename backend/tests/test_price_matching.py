from datetime import date
from decimal import Decimal
from app.models.benchmark import Benchmark
from app.models.bill_item import BillItem
from app.services.price_matching_service import PriceMatchingService


def test_price_matching_statutory_ceiling(db_session):
    # Setup benchmark
    bm = Benchmark(
        normalized_item_name="coronary stent",
        service_code="STENT-01",
        applicable_region="National",
        benchmark_type="price_ceiling",
        amount=Decimal("30000.00"),
        source_name="NPPA Stent Cap",
        source_reference="Order S.O. 123",
        effective_from=date(2023, 1, 1),
        effective_until=None,
        is_synthetic=False,
    )
    db_session.add(bm)
    db_session.commit()

    service = PriceMatchingService(db_session)
    item = BillItem(
        bill_id="test-bill",
        description="Coronary Stent Premium",
        normalized_name="coronary stent",
        service_code="STENT-01",
        quantity=Decimal("1.00"),
        unit_price=Decimal("45000.00"),
        line_total=Decimal("45000.00"),
    )

    matched_bm, cat, reason = service.match_item_to_benchmark(item, bill_date=date(2024, 1, 1))
    assert matched_bm is not None
    assert cat == "statutory_ceiling"
    assert "NPPA Stent Cap" in reason


def test_price_matching_expired_benchmark_rejected(db_session):
    bm = Benchmark(
        normalized_item_name="covid test",
        applicable_region="National",
        benchmark_type="price_ceiling",
        amount=Decimal("400.00"),
        source_name="State Order 2021",
        source_reference="COVID Cap",
        effective_from=date(2021, 1, 1),
        effective_until=date(2022, 12, 31),  # Expired
        is_synthetic=True,
    )
    db_session.add(bm)
    db_session.commit()

    service = PriceMatchingService(db_session)
    item = BillItem(
        bill_id="test-bill",
        description="COVID Test",
        normalized_name="covid test",
        quantity=Decimal("1.00"),
        unit_price=Decimal("900.00"),
        line_total=Decimal("900.00"),
    )

    # Date in 2024 (after expiration)
    matched_bm, cat, reason = service.match_item_to_benchmark(item, bill_date=date(2024, 3, 1))
    assert matched_bm is None
    assert cat == "insufficient_evidence"
    assert "expired" in reason.lower()


def test_price_matching_no_benchmark_insufficient_evidence(db_session):
    service = PriceMatchingService(db_session)
    item = BillItem(
        bill_id="test-bill",
        description="Rare Exotic Brain Surgery",
        normalized_name="rare exotic brain surgery",
        quantity=Decimal("1.00"),
        unit_price=Decimal("150000.00"),
        line_total=Decimal("150000.00"),
    )

    matched_bm, cat, reason = service.match_item_to_benchmark(item, bill_date=date(2024, 3, 1))
    assert matched_bm is None
    assert cat == "insufficient_evidence"
