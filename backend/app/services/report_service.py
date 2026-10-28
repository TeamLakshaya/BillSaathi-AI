import json
import uuid
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.exceptions import NotFoundError
from app.repositories.bill_repository import BillRepository
from app.repositories.report_repository import ReportRepository
from app.repositories.verification_repository import VerificationRepository
from app.schemas.report import ReportResponse
from app.services.pdf_service import PDFReportService
from app.services.verification_service import VerificationService
from app.storage.local_storage import LocalStorageProvider


class ReportService:
    def __init__(self, db: Session):
        self.db = db
        self.bill_repo = BillRepository(db)
        self.report_repo = ReportRepository(db)
        self.verif_repo = VerificationRepository(db)
        self.verif_service = VerificationService(db)
        self.pdf_service = PDFReportService()
        self.storage = LocalStorageProvider(root_dir=settings.REPORT_DIR)

    def generate_report(self, bill_id: str, report_type: str = "audit_dossier") -> ReportResponse:
        bill = self.bill_repo.get_by_id(bill_id)
        if not bill:
            raise NotFoundError(f"Bill {bill_id} not found")

        # If verification is absent or outdated (bill was edited), re-run verification
        verif_results = self.verif_repo.get_by_bill_id(bill_id)
        if not verif_results or getattr(bill, "version", 1) > getattr(bill, "audit_version", 0):
            self.verif_service.verify_bill(bill_id)
            bill = self.bill_repo.get_by_id(bill_id)
            verif_results = self.verif_repo.get_by_bill_id(bill_id)

        report_uuid = str(uuid.uuid4())
        filename = f"report_{bill.id[:8]}_{report_uuid[:8]}.pdf"

        # Generate PDF
        pdf_bytes = self.pdf_service.generate_bill_report(
            bill=bill,
            results=verif_results,
            report_id=report_uuid,
        )

        # Save to storage
        rel_path = self.storage.save(pdf_bytes, filename)

        # Summary data
        total_discrepancy = sum(
            (r.difference_amount for r in verif_results if r.status == "verified_discrepancy" and r.difference_amount),
            Decimal("0.00"),
        )
        summary = {
            "total_billed": str(bill.total_amount),
            "subtotal": str(bill.subtotal) if bill.subtotal else None,
            "tax_amount": str(bill.tax_amount) if bill.tax_amount else None,
            "discount_amount": str(bill.discount_amount) if bill.discount_amount else None,
            "verified_discrepancy_amount": str(total_discrepancy),
            "flagged_items_count": len(verif_results),
            "bill_version": bill.version,
            "audit_version": bill.audit_version,
            "is_demo": bill.is_demo,
        }

        report = self.report_repo.create(
            bill_id=bill.id,
            storage_path=rel_path,
            report_type=report_type,
            report_status="completed",
            summary_data=json.dumps(summary),
            bill_version=bill.version,
            audit_version=bill.audit_version,
            is_demo=bill.is_demo,
        )

        resp = ReportResponse.model_validate(report)
        resp.download_url = f"/api/v1/reports/{report.id}/download"
        return resp


    def get_report_by_bill_id(self, bill_id: str) -> Optional[ReportResponse]:
        report = self.report_repo.get_by_bill_id(bill_id)
        if not report:
            return None
        resp = ReportResponse.model_validate(report)
        resp.download_url = f"/api/v1/reports/{report.id}/download"
        return resp

    def get_report_by_id(self, report_id: str) -> ReportResponse:
        report = self.report_repo.get_by_id(report_id)
        if not report:
            raise NotFoundError(f"Report {report_id} not found")
        resp = ReportResponse.model_validate(report)
        resp.download_url = f"/api/v1/reports/{report.id}/download"
        return resp

    def get_report_bytes(self, report_id: str) -> tuple[bytes, str]:
        report = self.report_repo.get_by_id(report_id)
        if not report:
            raise NotFoundError(f"Report {report_id} not found")
        data = self.storage.read(report.storage_path)
        return data, f"BillSaathi_Report_{report.bill_id[:8]}.pdf"
