from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ReportGenerateRequest(BaseModel):
    report_type: str = "audit_dossier"


class ReportResponse(BaseModel):
    id: str
    bill_id: str
    report_type: str
    report_status: str
    storage_path: str
    summary_data: Optional[str] = None
    bill_version: int = 1
    audit_version: int = 1
    is_demo: bool
    created_at: datetime
    download_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        instance = super().model_validate(obj, *args, **kwargs)
        if instance.storage_path:
            import os
            instance.storage_path = os.path.basename(instance.storage_path)
        if not instance.download_url:
            instance.download_url = f"/api/v1/reports/{instance.id}/download"
        return instance

