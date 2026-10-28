import logging
import re
import sys

# PII Redaction patterns
PHONE_PATTERN = re.compile(r'\b(?:\+91[- ]?)?[6-9]\d{9}\b')
EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b')
AADHAAR_PATTERN = re.compile(r'\b\d{4}[ -]?\d{4}[ -]?\d{4}\b')

class PrivacyFilter(logging.Filter):
    """Filters out common Indian PII formats from log records."""
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self.sanitize(record.msg)
        return True

    @staticmethod
    def sanitize(text: str) -> str:
        text = PHONE_PATTERN.sub("[PHONE_REDACTED]", text)
        text = EMAIL_PATTERN.sub("[EMAIL_REDACTED]", text)
        text = AADHAAR_PATTERN.sub("[ID_REDACTED]", text)
        return text

def setup_logging() -> logging.Logger:
    logger = logging.getLogger("billsaathi")
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        handler.addFilter(PrivacyFilter())
        logger.addHandler(handler)

    return logger

logger = setup_logging()
