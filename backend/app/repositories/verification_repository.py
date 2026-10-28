from typing import List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, delete
from app.models.verification import VerificationResult


class VerificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_bill_id(self, bill_id: str) -> List[VerificationResult]:
        stmt = (
            select(VerificationResult)
            .where(VerificationResult.bill_id == bill_id)
            .options(joinedload(VerificationResult.bill_item))
            .order_by(VerificationResult.created_at)
        )
        return list(self.db.execute(stmt).scalars().all())

    def delete_by_bill_id(self, bill_id: str) -> int:
        stmt = delete(VerificationResult).where(VerificationResult.bill_id == bill_id)
        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount

    def save_results(self, bill_id: str, results_data: List[Dict[str, Any]]) -> List[VerificationResult]:
        # Delete previous results for fresh run
        self.delete_by_bill_id(bill_id)

        created = []
        for r in results_data:
            vr = VerificationResult(
                bill_id=bill_id,
                bill_item_id=r.get("bill_item_id"),
                benchmark_id=r.get("benchmark_id"),
                billed_amount=r["billed_amount"],
                benchmark_amount=r.get("benchmark_amount"),
                difference_amount=r.get("difference_amount"),
                status=r["status"],
                reason=r["reason"],
                evidence=r.get("evidence"),
                confidence=r.get("confidence", 1.00),
                rule_version=r.get("rule_version", "v1.0.0"),
                bill_version=r.get("bill_version", 1),
                is_demo=r.get("is_demo", False),
            )
            self.db.add(vr)
            created.append(vr)
        self.db.commit()
        for c in created:
            self.db.refresh(c)
        return created
