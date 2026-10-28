from datetime import date, datetime
from typing import Optional, Union


def parse_date(date_val: Union[str, date, datetime, None]) -> Optional[date]:
    """Parses various date formats safely into a datetime.date object."""
    if not date_val:
        return None
    if isinstance(date_val, datetime):
        return date_val.date()
    if isinstance(date_val, date):
        return date_val

    date_str = str(date_val).strip()
    formats = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%m/%d/%Y",
        "%d %b %Y",
        "%d %B %Y",
        "%Y/%m/%d",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None


def is_date_effective(target_date: Optional[date], effective_from: Optional[date], effective_until: Optional[date]) -> bool:
    """Checks whether target_date falls within [effective_from, effective_until]."""
    if not target_date:
        return True  # If no bill date, assume within range or needs soft check
    if effective_from and target_date < effective_from:
        return False
    if effective_until and target_date > effective_until:
        return False
    return True
