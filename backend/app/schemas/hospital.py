from datetime import datetime
from pydantic import BaseModel, ConfigDict


class HospitalCreate(BaseModel):
    name: str
    location: str
    state: str
    hospital_category: str = "Private"


class HospitalResponse(BaseModel):
    id: str
    name: str
    location: str
    state: str
    hospital_category: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
