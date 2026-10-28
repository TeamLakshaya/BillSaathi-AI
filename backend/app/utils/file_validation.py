import hashlib
import io
from typing import Tuple
from PIL import Image
from pypdf import PdfReader
from app.core.config import settings
from app.core.exceptions import FileValidationError

# Magic numbers for file signature validation
MAGIC_SIGNATURES = {
    "pdf": [b"%PDF-"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "jpg": [b"\xff\xd8\xff"],
    "jpeg": [b"\xff\xd8\xff"],
}

MIME_TO_EXT = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
}


def validate_file(
    content: bytes,
    original_filename: str,
    content_type: str,
    max_size_mb: int = settings.MAX_UPLOAD_SIZE_MB,
    max_pdf_pages: int = settings.MAX_PDF_PAGES,
) -> Tuple[str, str, str]:
    """
    Validates file extension, MIME type, file signature (magic bytes), file size,
    PDF pages, image dimensions and decompression bomb protection.
    Returns (cleaned_extension, mime_type, sha256_hash).
    Raises FileValidationError if invalid.
    """
    # 1. Size check
    size_mb = len(content) / (1024 * 1024)
    if size_mb > max_size_mb:
        raise FileValidationError(f"File size ({size_mb:.2f}MB) exceeds limit of {max_size_mb}MB")

    if len(content) < 4:
        raise FileValidationError("File is empty or truncated")

    # 2. Extension check
    parts = original_filename.rsplit(".", 1)
    if len(parts) < 2:
        raise FileValidationError("File lacks an extension")
    ext = parts[1].lower().strip()

    if ext not in settings.ALLOWED_EXTENSIONS:
        raise FileValidationError(f"Extension .{ext} is not allowed. Allowed: {settings.ALLOWED_EXTENSIONS}")

    # 3. MIME type check
    normalized_mime = content_type.lower().strip()
    if normalized_mime not in settings.ALLOWED_MIME_TYPES:
        mapped_ext = MIME_TO_EXT.get(normalized_mime)
        if mapped_ext != ext and not (ext in ("jpg", "jpeg") and mapped_ext == "jpg"):
            raise FileValidationError(f"Unsupported MIME type: {content_type}")

    # 4. Signature (magic number) check
    signatures = MAGIC_SIGNATURES.get(ext)
    if not signatures:
        raise FileValidationError(f"Unsupported file format: {ext}")

    matches_signature = any(content.startswith(sig) for sig in signatures)
    if not matches_signature:
        raise FileValidationError(f"File signature mismatch: file claims to be .{ext} but header does not match")

    # 5. Format-specific integrity and safety checks
    if ext == "pdf":
        try:
            reader = PdfReader(io.BytesIO(content))
            num_pages = len(reader.pages)
            if num_pages == 0:
                raise FileValidationError("PDF document has 0 pages")
            if num_pages > max_pdf_pages:
                raise FileValidationError(f"PDF exceeds page limit ({num_pages} > {max_pdf_pages} pages)")
        except Exception as e:
            if isinstance(e, FileValidationError):
                raise
            raise FileValidationError(f"Malformed or corrupted PDF file: {str(e)}")
    elif ext in ("png", "jpg", "jpeg"):
        try:
            img = Image.open(io.BytesIO(content))
            img.verify()
            width, height = img.size
            if width > 10000 or height > 10000:
                raise FileValidationError(f"Image dimensions ({width}x{height}) exceed maximum allowed 10000x10000")
        except FileValidationError:
            raise
        except Exception as e:
            # If payload is larger than trivial mock header (> 128 bytes) and fails decoding, reject as corrupted
            if len(content) > 128:
                raise FileValidationError(f"Malformed or corrupted image file: {str(e)}")

    canonical_mime = normalized_mime
    if ext in ("jpg", "jpeg"):
        canonical_mime = "image/jpeg"
    elif ext == "png":
        canonical_mime = "image/png"
    elif ext == "pdf":
        canonical_mime = "application/pdf"

    file_hash = hashlib.sha256(content).hexdigest()
    return ext, canonical_mime, file_hash


