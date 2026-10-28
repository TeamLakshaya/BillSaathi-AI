import re
from datetime import date
from decimal import Decimal
from typing import List, Optional
from app.core.logging import logger
from app.providers.ai.base import AIProvider
from app.schemas.bill import ExtractedBillData, ExtractedItemData
from app.utils.dates import parse_date
from app.utils.money import to_decimal


class DemoAIProvider(AIProvider):
    """
    Deterministic rule-based and fallback bill extractor.
    Enables complete offline demo operation with zero external API credentials.
    """

    def extract_bill_data(
        self,
        raw_text: str = "",
        filename: str = "",
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
        is_demo: bool = False,
    ) -> ExtractedBillData:
        logger.info(f"DemoAIProvider parsing bill text (length: {len(raw_text or '')} chars)")

        hospital_name = self._detect_hospital(raw_text) or "City Care Super Speciality Hospital"
        bill_date = self._detect_date(raw_text) or date(2024, 3, 15)

        items = self._parse_items_from_text(raw_text)

        # If text had no parseable structured items, use realistic synthetic demo data
        if not items:
            items = self._generate_default_demo_items()

        # Calculate totals
        subtotal = sum((item.line_total for item in items), Decimal("0.00"))
        grand_total = subtotal

        return ExtractedBillData(
            hospital_name=hospital_name,
            hospital_location="Delhi-NCR",
            bill_date=bill_date,
            items=items,
            subtotal=subtotal,
            tax_amount=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            grand_total=grand_total,
            raw_text=raw_text[:2000] if raw_text else "Demo Synthetic Content",
        )

    def _detect_hospital(self, text: str) -> Optional[str]:
        hospitals = [
            "Apollo Hospital",
            "Max Super Speciality Hospital",
            "Fortis Memorial Research Institute",
            "Manipal Hospital",
            "Medanta The Medicity",
            "Artemis Hospital",
            "Narayana Health",
            "City Care Super Speciality Hospital",
        ]
        for h in hospitals:
            if h.lower() in text.lower():
                return h
        return None

    def _detect_date(self, text: str) -> Optional[date]:
        date_patterns = [
            r"\b(\d{4}-\d{2}-\d{2})\b",
            r"\b(\d{2}/\d{2}/\d{4})\b",
            r"\b(\d{2}-\d{2}-\d{4})\b",
        ]
        for pat in date_patterns:
            m = re.search(pat, text)
            if m:
                d = parse_date(m.group(1))
                if d:
                    return d
        return None

    def _parse_items_from_text(self, text: str) -> List[ExtractedItemData]:
        items: List[ExtractedItemData] = []
        if not text:
            return items

        # Pattern: [Item Name] [Qty] [Unit Price] [Line Total]
        # e.g.: Paracetamol 500mg 10 2.50 25.00
        line_pattern = re.compile(
            r"^([A-Za-z0-9\s\-\(\)\/\.]+?)\s+(\d+(?:\.\d+)?)\s*(?:nos|pcs|tab|vial|unit|day)?\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$",
            re.MULTILINE,
        )

        for match in line_pattern.finditer(text):
            desc = match.group(1).strip()
            qty = to_decimal(match.group(2))
            unit_price = to_decimal(match.group(3))
            line_total = to_decimal(match.group(4))

            # Skip header lines
            if "item" in desc.lower() or "description" in desc.lower() or "total" in desc.lower():
                continue

            items.append(
                ExtractedItemData(
                    description=desc,
                    normalized_name=desc.lower().strip(),
                    category=self._categorize_item(desc),
                    quantity=qty,
                    unit="unit",
                    unit_price=unit_price,
                    line_total=line_total,
                    confidence=Decimal("0.95"),
                )
            )

        return items

    def _categorize_item(self, desc: str) -> str:
        d = desc.lower()
        if any(w in d for w in ["icu", "room", "bed", "ward", "nursing", "stay"]):
            return "Room & Nursing"
        if any(w in d for w in ["tablet", "tab", "inj", "mg", "syrup", "paracetamol", "capsule", "pharma"]):
            return "Pharmacy"
        if any(w in d for w in ["mri", "ct scan", "x-ray", "blood", "cbc", "lipid", "culture", "pathology", "test", "ultrasound"]):
            return "Diagnostics"
        if any(w in d for w in ["surgery", "procedure", "ot charges", "operation", "biopsy"]):
            return "Procedures"
        if any(w in d for w in ["consultation", "doctor", "physician", "visit"]):
            return "Consultation"
        return "Consumables & Miscellaneous"

    def _generate_default_demo_items(self) -> List[ExtractedItemData]:
        return [
            ExtractedItemData(
                description="Complete Blood Count (CBC)",
                normalized_name="complete blood count",
                service_code="DIAG-CBC-01",
                category="Diagnostics",
                quantity=Decimal("1.00"),
                unit="test",
                unit_price=Decimal("450.00"),
                line_total=Decimal("450.00"),
                confidence=Decimal("0.98"),
            ),
            ExtractedItemData(
                description="Doctor Consultation - Senior Specialist",
                normalized_name="specialist consultation",
                service_code="CONS-SPEC-01",
                category="Consultation",
                quantity=Decimal("1.00"),
                unit="visit",
                unit_price=Decimal("1200.00"),
                line_total=Decimal("1200.00"),
                confidence=Decimal("0.95"),
            ),
            ExtractedItemData(
                description="Paracetamol 650mg Tablets (Strip of 10)",
                normalized_name="paracetamol 650mg",
                service_code="PHARM-PCM-650",
                category="Pharmacy",
                quantity=Decimal("2.00"),
                unit="strip",
                unit_price=Decimal("35.00"),
                line_total=Decimal("70.00"),
                confidence=Decimal("0.92"),
            ),
            ExtractedItemData(
                description="ICU Bed Charges (per day)",
                normalized_name="icu bed charges",
                service_code="ROOM-ICU-01",
                category="Room & Nursing",
                quantity=Decimal("1.00"),
                unit="day",
                unit_price=Decimal("9500.00"),
                line_total=Decimal("9500.00"),
                confidence=Decimal("0.96"),
            ),
        ]
