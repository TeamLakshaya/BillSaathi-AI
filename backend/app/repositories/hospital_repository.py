from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func
from app.models.hospital import Hospital


class HospitalRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, hospital_id: str) -> Optional[Hospital]:
        return self.db.execute(select(Hospital).where(Hospital.id == hospital_id)).scalar_one_or_none()

    def get_by_name(self, name: str) -> Optional[Hospital]:
        clean_name = name.strip().lower()
        return self.db.execute(select(Hospital).where(func.lower(Hospital.name) == clean_name)).scalar_one_or_none()

    def find_or_create(self, name: str, location: str = "Unknown", state: str = "National", category: str = "Private") -> Hospital:
        clean = name.strip()
        existing = self.get_by_name(clean)
        if existing:
            return existing
        return self.create(name=clean, location=location, state=state, hospital_category=category)

    def create(self, name: str, location: str, state: str, hospital_category: str = "Private") -> Hospital:
        hospital = Hospital(
            name=name.strip(),
            location=location.strip(),
            state=state.strip(),
            hospital_category=hospital_category.strip(),
        )
        self.db.add(hospital)
        self.db.commit()
        self.db.refresh(hospital)
        return hospital

    def list_all(self, query: Optional[str] = None, skip: int = 0, limit: int = 50) -> List[Hospital]:
        stmt = select(Hospital)
        if query:
            clean_q = f"%{query.strip().lower()}%"
            stmt = stmt.where(or_(func.lower(Hospital.name).like(clean_q), func.lower(Hospital.location).like(clean_q)))
        return list(self.db.execute(stmt.offset(skip).limit(limit)).scalars().all())
