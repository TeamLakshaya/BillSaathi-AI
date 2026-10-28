from app.providers.ocr.base import OCRProvider
from app.providers.ocr.local_ocr import LocalOCRProvider


class OCRService:
    def __init__(self, provider: OCRProvider = None):
        self.provider = provider or LocalOCRProvider()

    def extract_text(self, file_bytes: bytes, file_ext: str) -> str:
        return self.provider.extract_text(file_bytes, file_ext)
