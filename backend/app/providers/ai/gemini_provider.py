import base64
import json
from decimal import Decimal
from typing import Optional, List
import httpx

from app.core.config import settings
from app.core.logging import logger
from app.providers.ai.base import AIProvider
from app.providers.ai.demo_provider import DemoAIProvider
from app.schemas.bill import ExtractedBillData, ExtractedItemData
from app.utils.dates import parse_date
from app.utils.money import to_decimal

ALLOWED_CATEGORIES = {
    "Pharmacy",
    "Diagnostics",
    "Room & Nursing",
    "Procedures",
    "Consultation",
    "Consumables & Miscellaneous",
    "General",
}


class GeminiAIProvider(AIProvider):
    """
    Production AI bill extractor powered by Google Gemini Multimodal REST API,
    supporting images (JPEG, PNG) and PDF documents directly via inlineData base64 bytes.
    Extracts only visible, supported bill fields without hallucinating missing values.
    """

    def __init__(self, demo_fallback: Optional[DemoAIProvider] = None):
        self.fallback = demo_fallback or DemoAIProvider()

    def extract_bill_data(
        self,
        raw_text: str = "",
        filename: str = "",
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
        is_demo: bool = False,
    ) -> ExtractedBillData:
        # 1. Demo mode requested or server configured in DEMO_MODE without credentials
        if is_demo or (settings.DEMO_MODE and not settings.GEMINI_API_KEY):
            logger.info("Demo mode active; using deterministic DemoAIProvider with demo attribution")
            demo_data = self.fallback.extract_bill_data(
                raw_text=raw_text,
                filename=filename,
                file_bytes=file_bytes,
                mime_type=mime_type,
                is_demo=True,
            )
            # Clearly note demo extraction attribution
            demo_data.raw_text = (
                "[DEMO MODE: Synthetic medical bill items generated for demonstration. "
                "Configure GEMINI_API_KEY on the server for live AI extraction.]\n"
                + (demo_data.raw_text or "")
            )
            return demo_data

        # 2. Check credentials when live extraction is expected
        if not settings.GEMINI_API_KEY:
            logger.info("GEMINI_API_KEY is not configured on the server; flagging document for manual review")
            return ExtractedBillData(
                hospital_name=None,
                hospital_location=None,
                bill_date=None,
                items=[],
                subtotal=Decimal("0.00"),
                tax_amount=Decimal("0.00"),
                discount_amount=Decimal("0.00"),
                grand_total=Decimal("0.00"),
                raw_text=(
                    "[CONFIGURATION NOTICE: GEMINI_API_KEY is not configured on the server. "
                    "Live multimodal AI extraction requires a valid Gemini API key. "
                    "Document marked for manual review.]"
                ),
            )

        # 3. Invoke live multimodal Gemini extraction
        try:
            return self._call_gemini_api(
                raw_text=raw_text,
                filename=filename,
                file_bytes=file_bytes,
                mime_type=mime_type,
            )
        except Exception as e:
            logger.error(f"Gemini API invocation failed: {e}")
            # Never report failed extraction as success; return clear review-required result
            return ExtractedBillData(
                hospital_name=None,
                hospital_location=None,
                bill_date=None,
                items=[],
                subtotal=Decimal("0.00"),
                tax_amount=Decimal("0.00"),
                discount_amount=Decimal("0.00"),
                grand_total=Decimal("0.00"),
                raw_text=f"[EXTRACTION FAILED: {str(e)}. Document marked for manual review.]",
            )

    def _call_gemini_api(
        self,
        raw_text: str,
        filename: str,
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
    ) -> ExtractedBillData:
        # Resolve canonical MIME type for Gemini
        resolved_mime = "application/pdf"
        if mime_type:
            lowered = mime_type.lower().strip()
            if lowered in ("image/jpeg", "image/jpg"):
                resolved_mime = "image/jpeg"
            elif lowered == "image/png":
                resolved_mime = "image/png"
            elif lowered == "application/pdf":
                resolved_mime = "application/pdf"
        elif filename:
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
            if ext in ("jpg", "jpeg"):
                resolved_mime = "image/jpeg"
            elif ext == "png":
                resolved_mime = "image/png"
            elif ext == "pdf":
                resolved_mime = "application/pdf"

        prompt = (
            "You are an expert Indian hospital medical bill auditor.\n"
            "Your job is to examine the attached hospital bill document and extract only visible, supported billing information.\n\n"
            "STRICT EXTRACTION RULES:\n"
            "1. Extract ONLY visible, explicit billing fields from the document. NEVER invent, hallucinate, or assume missing values.\n"
            "2. If hospital name, hospital location, or bill date is not visible, return null.\n"
            "3. For each bill item, extract:\n"
            "   - description: exact item description as printed on the bill\n"
            "   - normalized_name: lowercase generic medical or service name\n"
            "   - service_code: item or procedure code if printed, else null\n"
            "   - category: strictly one of 'Pharmacy', 'Diagnostics', 'Room & Nursing', 'Procedures', 'Consultation', 'Consumables & Miscellaneous', or 'General'\n"
            "   - quantity: number (must be > 0)\n"
            "   - unit: unit of measurement if visible (e.g. 'tab', 'vial', 'day', 'test', 'unit')\n"
            "   - unit_price: rate per unit. If not explicitly visible, leave 0\n"
            "   - line_total: total billed amount for this item\n"
            "   - confidence: float between 0.0 and 1.0 representing visual/extraction certainty\n"
            "   - is_uncertain: true if text is blurry, partially obscured, or price calculation is questionable\n"
            "   - uncertainty_reason: brief note if uncertain, else null\n"
            "4. If a calculation does not balance (quantity * unit_price != line_total) or text is ambiguous, mark is_uncertain as true with a specific uncertainty_reason.\n"
            "5. If the document is unreadable, not a hospital bill, or contains no extractable line items, return an empty items list []. NEVER invent items.\n"
            "6. Return strictly valid JSON adhering to the following schema:\n\n"
            "{\n"
            '  "hospital_name": "string or null",\n'
            '  "hospital_location": "string or null",\n'
            '  "bill_date": "YYYY-MM-DD or null",\n'
            '  "items": [\n'
            "    {\n"
            '      "description": "string",\n'
            '      "normalized_name": "string",\n'
            '      "service_code": "string or null",\n'
            '      "category": "Pharmacy | Diagnostics | Room & Nursing | Procedures | Consultation | Consumables & Miscellaneous | General",\n'
            '      "quantity": 1.0,\n'
            '      "unit": "string",\n'
            '      "unit_price": 0.0,\n'
            '      "line_total": 0.0,\n'
            '      "confidence": 0.95,\n'
            '      "is_uncertain": false,\n'
            '      "uncertainty_reason": null\n'
            "    }\n"
            "  ],\n"
            '  "subtotal": 0.0,\n'
            '  "tax_amount": 0.0,\n'
            '  "discount_amount": 0.0,\n'
            '  "grand_total": 0.0\n'
            "}\n"
        )

        parts: List[dict] = [{"text": prompt}]

        if file_bytes:
            b64_data = base64.b64encode(file_bytes).decode("utf-8")
            parts.append({
                "inlineData": {
                    "mimeType": resolved_mime,
                    "data": b64_data,
                }
            })
        elif raw_text:
            parts.append({"text": f"Bill Document Text Content:\n{raw_text[:8000]}"})

        request_body = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.1,
            },
        }

        api_url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        )

        with httpx.Client(timeout=45.0) as client:
            response = client.post(
                api_url,
                json=request_body,
                headers={"Content-Type": "application/json"},
            )

        if response.status_code != 200:
            raise RuntimeError(
                f"Gemini API returned HTTP {response.status_code}: {response.text[:300]}"
            )

        api_result = response.json()
        candidates = api_result.get("candidates", [])
        if not candidates:
            raise RuntimeError("Gemini API returned no candidates in response")

        candidate_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        if not candidate_text:
            raise RuntimeError("Gemini API returned empty text in candidate content")

        # Strip markdown fences if returned
        cleaned_json = candidate_text.strip()
        if cleaned_json.startswith("```json"):
            cleaned_json = cleaned_json[7:]
        elif cleaned_json.startswith("```"):
            cleaned_json = cleaned_json[3:]
        if cleaned_json.endswith("```"):
            cleaned_json = cleaned_json[:-3]
        cleaned_json = cleaned_json.strip()

        try:
            payload = json.loads(cleaned_json)
        except json.JSONDecodeError as json_err:
            logger.error(f"Malformed AI output from Gemini: {json_err}. Raw response: {candidate_text[:400]}")
            return ExtractedBillData(
                hospital_name=None,
                hospital_location=None,
                bill_date=None,
                items=[],
                subtotal=Decimal("0.00"),
                tax_amount=Decimal("0.00"),
                discount_amount=Decimal("0.00"),
                grand_total=Decimal("0.00"),
                raw_text=f"[EXTRACTION ERROR: Malformed AI JSON: {str(json_err)}]\n{candidate_text[:1000]}",
            )

        items: List[ExtractedItemData] = []
        for raw_item in payload.get("items", []):
            desc = str(raw_item.get("description", "")).strip()
            if not desc:
                continue

            raw_cat = str(raw_item.get("category", "General")).strip()
            cat = raw_cat if raw_cat in ALLOWED_CATEGORIES else "General"

            qty = to_decimal(raw_item.get("quantity", 1), default=Decimal("1.00"))
            if qty <= Decimal("0.00"):
                qty = Decimal("1.00")

            unit_price = to_decimal(raw_item.get("unit_price", 0), default=Decimal("0.00"))
            line_tot = to_decimal(raw_item.get("line_total", 0), default=Decimal("0.00"))
            if line_tot <= Decimal("0.00") and unit_price > Decimal("0.00"):
                line_tot = qty * unit_price

            conf = to_decimal(raw_item.get("confidence", 0.90), default=Decimal("0.90"))
            is_uncertain = bool(raw_item.get("is_uncertain", False))
            uncertainty_reason = raw_item.get("uncertainty_reason")

            # Validate arithmetic consistency
            if qty > Decimal("0.00") and unit_price > Decimal("0.00") and line_tot > Decimal("0.00"):
                calc_total = qty * unit_price
                if abs(calc_total - line_tot) > Decimal("1.00") and not is_uncertain:
                    is_uncertain = True
                    uncertainty_reason = (
                        f"Arithmetic mismatch: {qty} x {unit_price} = {calc_total}, "
                        f"but line total is {line_tot}"
                    )

            if conf < Decimal("0.75") and not is_uncertain:
                is_uncertain = True
                uncertainty_reason = f"Low AI extraction confidence ({conf:.2f})"

            if line_tot <= Decimal("0.00") and not is_uncertain:
                is_uncertain = True
                uncertainty_reason = "Unresolved or zero rate/total on item"

            items.append(
                ExtractedItemData(
                    description=desc,
                    normalized_name=str(raw_item.get("normalized_name", desc)).lower().strip(),
                    service_code=raw_item.get("service_code"),
                    category=cat,
                    quantity=qty,
                    unit=str(raw_item.get("unit", "unit")),
                    unit_price=unit_price,
                    line_total=line_tot,
                    confidence=conf,
                    data_source="multimodal_gemini",
                    is_uncertain=is_uncertain,
                    uncertainty_reason=uncertainty_reason,
                )
            )

        bill_date = parse_date(payload.get("bill_date"))
        subtotal = to_decimal(payload.get("subtotal"))
        tax_amount = to_decimal(payload.get("tax_amount"))
        discount_amount = to_decimal(payload.get("discount_amount"))
        grand_total = to_decimal(payload.get("grand_total"))

        if subtotal is None and items:
            subtotal = sum((itm.line_total for itm in items), Decimal("0.00"))

        if grand_total is None or grand_total == Decimal("0.00"):
            base_tot = subtotal or Decimal("0.00")
            grand_total = base_tot + (tax_amount or Decimal("0.00")) - (discount_amount or Decimal("0.00"))

        return ExtractedBillData(
            hospital_name=payload.get("hospital_name"),
            hospital_location=payload.get("hospital_location"),
            bill_date=bill_date,
            items=items,
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            grand_total=grand_total or Decimal("0.00"),
            raw_text=cleaned_json[:2000],
        )
