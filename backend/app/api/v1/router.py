from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    bills,
    bill_items,
    verification,
    hospitals,
    benchmarks,
    reports,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(bills.router, prefix="/bills", tags=["Bills"])
api_router.include_router(bill_items.router, prefix="/bills", tags=["Bill Items"])
api_router.include_router(verification.router, prefix="/bills", tags=["Deterministic Verification"])
api_router.include_router(hospitals.router, prefix="/hospitals", tags=["Hospitals"])
api_router.include_router(benchmarks.router, prefix="/benchmarks", tags=["Price Benchmarks"])
api_router.include_router(reports.router, tags=["Reports"])
