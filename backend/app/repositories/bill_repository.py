from datetime import date
from decimal import Decimal
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, and_, or_
from app.models.bill import Bill
from app.models.bill_item import BillItem


class BillRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, bill_id: str) -> Optional[Bill]:
        stmt = (
            select(Bill)
            .where(Bill.id == bill_id)
            .options(joinedload(Bill.hospital), joinedload(Bill.items))
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def list_by_user(
        self,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        include_demo: bool = True,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Bill]:
        stmt = select(Bill).options(joinedload(Bill.hospital)).order_by(Bill.created_at.desc())
        conditions = []
        if user_id:
            if include_demo:
                conditions.append(or_(Bill.user_id == user_id, Bill.is_demo.is_(True)))
            else:
                conditions.append(Bill.user_id == user_id)
        elif session_id:
            if include_demo:
                conditions.append(or_(Bill.session_id == session_id, Bill.is_demo.is_(True)))
            else:
                conditions.append(Bill.session_id == session_id)
        else:
            if not include_demo:
                conditions.append(Bill.is_demo.is_(False))
            else:
                # public demo list
                conditions.append(Bill.is_demo.is_(True))

        if conditions:
            stmt = stmt.where(and_(*conditions))

        return list(self.db.execute(stmt.offset(skip).limit(limit)).scalars().all())

    def create(
        self,
        original_filename: str,
        storage_path: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        hospital_id: Optional[str] = None,
        file_hash: Optional[str] = None,
        bill_date: Optional[date] = None,
        subtotal: Optional[Decimal] = None,
        tax_amount: Optional[Decimal] = None,
        discount_amount: Optional[Decimal] = None,
        total_amount: Decimal = Decimal("0.00"),
        extracted_text: Optional[str] = None,
        processing_status: str = "uploaded",
        version: int = 1,
        audit_version: int = 0,
        is_demo: bool = False,
    ) -> Bill:
        bill = Bill(
            original_filename=original_filename,
            storage_path=storage_path,
            user_id=user_id,
            session_id=session_id,
            hospital_id=hospital_id,
            file_hash=file_hash,
            bill_date=bill_date,
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            total_amount=total_amount,
            extracted_text=extracted_text,
            processing_status=processing_status,
            version=version,
            audit_version=audit_version,
            is_demo=is_demo,
        )
        self.db.add(bill)
        self.db.commit()
        self.db.refresh(bill)
        return bill

    def update(self, bill_id: str, **kwargs) -> Optional[Bill]:
        bill = self.get_by_id(bill_id)
        if not bill:
            return None
        # If financial fields are modified, increment version
        material_fields = {"total_amount", "subtotal", "tax_amount", "discount_amount", "bill_date"}
        if any(f in kwargs for f in material_fields):
            bill.version += 1
        for key, value in kwargs.items():
            if hasattr(bill, key) and value is not None:
                setattr(bill, key, value)
        self.db.commit()
        self.db.refresh(bill)
        return bill

    def delete(self, bill_id: str) -> bool:
        bill = self.get_by_id(bill_id)
        if not bill:
            return False
        self.db.delete(bill)
        self.db.commit()
        return True

    def add_items(self, bill_id: str, items: List[Dict[str, Any]], increment_version: bool = True) -> List[BillItem]:
        bill = self.get_by_id(bill_id)
        created_items = []
        for itm in items:
            item_obj = BillItem(
                bill_id=bill_id,
                description=itm.get("description", "Unknown item"),
                normalized_name=itm.get("normalized_name", itm.get("description", "Unknown item")).lower().strip(),
                service_code=itm.get("service_code"),
                category=itm.get("category", "General"),
                quantity=itm.get("quantity", Decimal("1.00")),
                unit=itm.get("unit", "unit"),
                unit_price=itm.get("unit_price", Decimal("0.00")),
                line_total=itm.get("line_total", Decimal("0.00")),
                extraction_confidence=itm.get("extraction_confidence", Decimal("0.90")),
                user_confirmed=itm.get("user_confirmed", True),
                data_source=itm.get("data_source", "ocr_extracted"),
                page_number=itm.get("page_number"),
                is_uncertain=itm.get("is_uncertain", False),
                uncertainty_reason=itm.get("uncertainty_reason"),
            )
            self.db.add(item_obj)
            created_items.append(item_obj)
        if bill and increment_version:
            bill.version += 1
        self.db.commit()
        for ci in created_items:
            self.db.refresh(ci)
        return created_items


    def get_items(self, bill_id: str) -> List[BillItem]:
        stmt = select(BillItem).where(BillItem.bill_id == bill_id).order_by(BillItem.created_at)
        return list(self.db.execute(stmt).scalars().all())

    def get_item_by_id(self, item_id: str) -> Optional[BillItem]:
        return self.db.execute(select(BillItem).where(BillItem.id == item_id)).scalar_one_or_none()

    def update_item(self, item_id: str, **kwargs) -> Optional[BillItem]:
        item = self.get_item_by_id(item_id)
        if not item:
            return None
        for key, val in kwargs.items():
            if hasattr(item, key) and val is not None:
                setattr(item, key, val)
        # Material modification increments parent bill version
        bill = self.get_by_id(item.bill_id)
        if bill:
            bill.version += 1
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete_item(self, item_id: str) -> bool:
        item = self.get_item_by_id(item_id)
        if not item:
            return False
        bill_id = item.bill_id
        self.db.delete(item)
        bill = self.get_by_id(bill_id)
        if bill:
            bill.version += 1
        self.db.commit()
        return True

