import uuid
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.logging import logger
from app.repositories.bill_repository import BillRepository
from app.repositories.hospital_repository import HospitalRepository
from app.schemas.bill import BillDetailResponse
from app.services.extraction_service import ExtractionService
from app.services.ocr_service import OCRService
from app.storage.local_storage import LocalStorageProvider
from app.utils.file_validation import validate_file


class BillUploadService:
    def __init__(self, db: Session):
        self.db = db
        self.bill_repo = BillRepository(db)
        self.hospital_repo = HospitalRepository(db)
        self.storage = LocalStorageProvider(root_dir=settings.UPLOAD_DIR)
        self.ocr_service = OCRService()
        self.extraction_service = ExtractionService()

    def process_bill_upload(
        self,
        file_bytes: bytes,
        original_filename: str,
        content_type: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        is_demo: bool = False,
    ) -> BillDetailResponse:
        # 1. Strict File Security, Signature & Integrity Validation
        ext, normalized_mime, file_hash = validate_file(
            content=file_bytes,
            original_filename=original_filename,
            content_type=content_type,
        )

        # 2. Secure Random Storage Filename (defense against path traversal / malicious names)
        secure_filename = f"{uuid.uuid4().hex}.{ext}"
        storage_rel_path = self.storage.save(file_bytes, secure_filename)

        try:
            # 3. Extract Text via OCR / PDF extraction
            try:
                extracted_text = self.ocr_service.extract_text(file_bytes, ext)
            except Exception as ocr_err:
                logger.warning(f"OCR extraction encountered error: {ocr_err}")
                extracted_text = ""

            # 4. Extract Structured Data via AI Provider abstraction
            extracted_data = self.extraction_service.extract_bill_data(
                raw_text=extracted_text,
                filename=original_filename,
                file_bytes=file_bytes,
                mime_type=normalized_mime,
                is_demo=is_demo,
            )

            # 5. Link Hospital
            hospital_id = None
            if extracted_data.hospital_name:
                hospital = self.hospital_repo.find_or_create(
                    name=extracted_data.hospital_name,
                    location=extracted_data.hospital_location or "National",
                )
                hospital_id = hospital.id

            # Determine lifecycle status based on extraction quality
            has_uncertain = False
            items_payload = []
            for itm in extracted_data.items:
                is_low_conf = itm.confidence is not None and itm.confidence < Decimal("0.75")
                is_invalid_num = itm.unit_price <= Decimal("0.00") or itm.quantity <= Decimal("0.00")
                is_unresolved = itm.is_uncertain or is_low_conf or is_invalid_num

                if is_unresolved:
                    has_uncertain = True

                uncertainty_reason = itm.uncertainty_reason
                if not uncertainty_reason:
                    if is_low_conf:
                        uncertainty_reason = f"Low extraction confidence ({itm.confidence:.2f})"
                    elif is_invalid_num:
                        uncertainty_reason = "Unresolved or zero rate/quantity requiring confirmation"

                items_payload.append({
                    "description": itm.description,
                    "normalized_name": itm.normalized_name,
                    "service_code": itm.service_code,
                    "category": itm.category,
                    "quantity": itm.quantity,
                    "unit": itm.unit,
                    "unit_price": itm.unit_price,
                    "line_total": itm.line_total,
                    "extraction_confidence": itm.confidence,
                    "user_confirmed": not is_unresolved,
                    "data_source": itm.data_source or "multimodal_ai",
                    "page_number": itm.page_number,
                    "is_uncertain": is_unresolved,
                    "uncertainty_reason": uncertainty_reason,
                })

            initial_status = "review_required" if (has_uncertain or len(items_payload) == 0) else "ready_for_audit"

            # 6. Save Bill Record
            bill = self.bill_repo.create(
                original_filename=original_filename,
                storage_path=storage_rel_path,
                user_id=user_id,
                session_id=session_id,
                hospital_id=hospital_id,
                file_hash=file_hash,
                bill_date=extracted_data.bill_date,
                subtotal=extracted_data.subtotal,
                tax_amount=extracted_data.tax_amount,
                discount_amount=extracted_data.discount_amount,
                total_amount=extracted_data.grand_total,
                extracted_text=extracted_text or extracted_data.raw_text,
                processing_status=initial_status,
                version=1,
                audit_version=0,
                is_demo=is_demo,
            )

            # 7. Save Line Items (initial creation does not increment version above 1)
            if items_payload:
                self.bill_repo.add_items(bill.id, items_payload, increment_version=False)


            # 8. Reload and return BillDetailResponse
            refreshed_bill = self.bill_repo.get_by_id(bill.id)
            return BillDetailResponse.model_validate(refreshed_bill)

        except Exception as err:
            # Clean up orphaned physical file on failure
            try:
                self.storage.delete(storage_rel_path)
            except Exception as cleanup_err:
                logger.error(f"Failed to clean up uploaded file {storage_rel_path}: {cleanup_err}")
            raise err

