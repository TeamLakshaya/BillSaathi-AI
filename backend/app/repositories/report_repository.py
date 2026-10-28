from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.report import Report


class ReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, report_id: str) -> Optional[Report]:
        return self.db.execute(select(Report).where(Report.id == report_id)).scalar_one_or_none()

    def get_by_bill_id(self, bill_id: str) -> Optional[Report]:
        stmt = select(Report).where(Report.bill_id == bill_id).order_by(Report.created_at.desc())
        return self.db.execute(stmt).scalars().first()

    def list_by_bill_id(self, bill_id: str) -> List[Report]:
        stmt = select(Report).where(Report.bill_id == bill_id).order_by(Report.created_at.desc())
        return list(self.db.execute(stmt).scalars().all())

    def create(
        self,
        bill_id: str,
        storage_path: str,
        report_type: str = "audit_dossier",
        report_status: str = "generated",
        summary_data: Optional[str] = None,
        bill_version: int = 1,
        audit_version: int = 1,
        is_demo: bool = False,
    ) -> Report:
        report = Report(
            bill_id=bill_id,
            storage_path=storage_path,
            report_type=report_type,
            report_status=report_status,
            summary_data=summary_data,
            bill_version=bill_version,
            audit_version=audit_version,
            is_demo=is_demo,
        )
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

