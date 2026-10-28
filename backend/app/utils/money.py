from decimal import Decimal, ROUND_HALF_UP
from typing import Union, Optional

ROUND_DIGITS = Decimal("0.01")


def to_decimal(val: Union[int, float, str, Decimal, None], default: Optional[Decimal] = None) -> Decimal:
    """Safely converts input value to a 2-decimal-place quantized Decimal."""
    if val is None or val == "":
        return default if default is not None else Decimal("0.00")
    if isinstance(val, Decimal):
        return val.quantize(ROUND_DIGITS, rounding=ROUND_HALF_UP)
    try:
        # Strip currency symbols and whitespace if string
        if isinstance(val, str):
            clean_val = val.replace("₹", "").replace("Rs.", "").replace("Rs", "").replace(",", "").strip()
            if not clean_val:
                return default if default is not None else Decimal("0.00")
            return Decimal(clean_val).quantize(ROUND_DIGITS, rounding=ROUND_HALF_UP)
        return Decimal(str(val)).quantize(ROUND_DIGITS, rounding=ROUND_HALF_UP)
    except Exception:
        return default if default is not None else Decimal("0.00")


def calculate_line_total(quantity: Union[Decimal, float, int, str], unit_price: Union[Decimal, float, int, str]) -> Decimal:
    """Calculates expected line total = quantity * unit_price."""
    q = to_decimal(quantity, Decimal("1.00"))
    p = to_decimal(unit_price, Decimal("0.00"))
    return (q * p).quantize(ROUND_DIGITS, rounding=ROUND_HALF_UP)


def check_arithmetic_tolerance(
    billed_total: Union[Decimal, float, int, str],
    expected_total: Union[Decimal, float, int, str],
    tolerance: Decimal = Decimal("0.50"),
) -> bool:
    """
    Returns True if billed_total is within tolerance of expected_total.
    Tolerates minor rounding discrepancies (e.g. up to 50 paise).
    """
    b = to_decimal(billed_total)
    e = to_decimal(expected_total)
    return abs(b - e) <= tolerance
