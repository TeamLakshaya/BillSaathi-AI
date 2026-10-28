from typing import Optional
from app.providers.ai.base import AIProvider
from app.providers.ai.gemini_provider import GeminiAIProvider
from app.schemas.bill import ExtractedBillData


class ExtractionService:
    def __init__(self, provider: AIProvider = None):
        self.provider = provider or GeminiAIProvider()

    def extract_bill_data(
        self,
        raw_text: str = "",
        filename: str = "",
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
        is_demo: bool = False,
    ) -> ExtractedBillData:
        return self.provider.extract_bill_data(
            raw_text=raw_text,
            filename=filename,
            file_bytes=file_bytes,
            mime_type=mime_type,
            is_demo=is_demo,
        )
