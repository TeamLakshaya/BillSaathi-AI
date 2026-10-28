from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.hospital_repository import HospitalRepository
from app.schemas.hospital import HospitalCreate, HospitalResponse


class HospitalService:
    def __init__(self, db: Session):
        self.repo = HospitalRepository(db)

    def get_by_id(self, hospital_id: str) -> Optional[HospitalResponse]:
        h = self.repo.get_by_id(hospital_id)
        return HospitalResponse.model_validate(h) if h else None

    def list_hospitals(self, query: Optional[str] = None, skip: int = 0, limit: int = 50) -> List[HospitalResponse]:
        hospitals = self.repo.list_all(query=query, skip=skip, limit=limit)
        return [HospitalResponse.model_validate(h) for h in hospitals]

    def create_hospital(self, data: HospitalCreate) -> HospitalResponse:
        h = self.repo.create(
            name=data.name,
            location=data.location,
            state=data.state,
            hospital_category=data.hospital_category,
        )
        return HospitalResponse.model_validate(h)
