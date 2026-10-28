import io
from app.core.logging import logger
from app.providers.ocr.base import OCRProvider
from pypdf import PdfReader


class LocalOCRProvider(OCRProvider):
    """
    Local OCR and PDF text extractor using pypdf for digital PDFs,
    with graceful fallback for scanned images.
    """

    def extract_text(self, file_bytes: bytes, file_ext: str) -> str:
        clean_ext = file_ext.lower().replace(".", "")
        if clean_ext == "pdf":
            return self._extract_pdf_text(file_bytes)
        elif clean_ext in ("png", "jpg", "jpeg"):
            return self._extract_image_text(file_bytes)
        else:
            return ""

    def _extract_pdf_text(self, file_bytes: bytes) -> str:
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text_parts = []
            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    text_parts.append(page_text.strip())
            extracted = "\n\n".join(text_parts).strip()
            return extracted
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            return ""

    def _extract_image_text(self, file_bytes: bytes) -> str:
        # Check if PaddleOCR or Tesseract is optionally available
        try:
            import pytesseract
            from PIL import Image
            img = Image.open(io.BytesIO(file_bytes))
            return pytesseract.image_to_string(img).strip()
        except ImportError:
            # Pytesseract is not installed; multimodal Gemini AI will process the image directly
            return ""
        except Exception as e:
            logger.warning(f"Image OCR execution error: {e}")
            return ""
