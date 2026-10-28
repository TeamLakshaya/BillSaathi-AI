from decimal import Decimal
from app.models.bill_item import BillItem
from app.services.duplicate_detection_service import DuplicateDetectionService


def test_one_time_service_duplicate_flagged_as_discrepancy():
    service = DuplicateDetectionService()
    items = [
        BillItem(
            id="item-1",
            bill_id="b1",
            description="Hospital Admission Charge",
            normalized_name="admission charge",
            unit_price=Decimal("1500.00"),
            line_total=Decimal("1500.00"),
        ),
        BillItem(
            id="item-2",
            bill_id="b1",
            description="Hospital Admission Charge",
            normalized_name="admission charge",
            unit_price=Decimal("1500.00"),
            line_total=Decimal("1500.00"),
        ),
    ]

    findings = service.check_duplicates(items)
    assert len(findings) == 1
    assert findings[0]["status"] == "verified_discrepancy"
    assert "one-time" in findings[0]["reason"].lower()


def test_routine_service_duplicate_flagged_for_review_not_accusation():
    service = DuplicateDetectionService()
    items = [
        BillItem(
            id="item-1",
            bill_id="b1",
            description="Blood Sugar Fasting",
            normalized_name="blood sugar fasting",
            unit_price=Decimal("100.00"),
            line_total=Decimal("100.00"),
        ),
        BillItem(
            id="item-2",
            bill_id="b1",
            description="Blood Sugar Fasting",
            normalized_name="blood sugar fasting",
            unit_price=Decimal("100.00"),
            line_total=Decimal("100.00"),
        ),
    ]

    findings = service.check_duplicates(items)
    assert len(findings) == 1
    assert findings[0]["status"] == "needs_review"
    assert "clinical chart" in findings[0]["reason"].lower()


def test_distinct_items_no_duplicates():
    service = DuplicateDetectionService()
    items = [
        BillItem(
            id="item-1",
            bill_id="b1",
            description="CBC Test",
            normalized_name="cbc test",
            unit_price=Decimal("180.00"),
            line_total=Decimal("180.00"),
        ),
        BillItem(
            id="item-2",
            bill_id="b1",
            description="Lipid Profile",
            normalized_name="lipid profile",
            unit_price=Decimal("450.00"),
            line_total=Decimal("450.00"),
        ),
    ]
    findings = service.check_duplicates(items)
    assert len(findings) == 0
