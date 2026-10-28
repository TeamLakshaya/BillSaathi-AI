from abc import ABC, abstractmethod
from typing import Optional
from app.schemas.bill import ExtractedBillData


class AIProvider(ABC):
    @abstractmethod
    def extract_bill_data(
        self,
        raw_text: str = "",
        filename: str = "",
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
        is_demo: bool = False,
    ) -> ExtractedBillData:
        """Parses document bytes, MIME type, or OCR text into structured ExtractedBillData."""
        pass
