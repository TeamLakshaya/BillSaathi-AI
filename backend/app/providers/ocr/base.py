from abc import ABC, abstractmethod


class OCRProvider(ABC):
    @abstractmethod
    def extract_text(self, file_bytes: bytes, file_ext: str) -> str:
        """Extracts plain text from document bytes (PDF or Image)."""
        pass
