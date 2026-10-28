from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_admin
from app.schemas.benchmark import BenchmarkCreate, BenchmarkResponse
from app.schemas.common import ApiResponse
from app.services.benchmark_service import BenchmarkService

router = APIRouter()


@router.get("", response_model=ApiResponse[List[BenchmarkResponse]])
def list_benchmarks(
    q: Optional[str] = Query(None, description="Search normalized item name, code, or source"),
    region: Optional[str] = Query(None, description="Filter by region (e.g. National, Delhi-NCR)"),
    benchmark_type: Optional[str] = Query(None, description="Filter by type (price_ceiling, cghs_rate, etc.)"),
    is_synthetic: Optional[bool] = Query(None, description="Filter synthetic demo records vs real-world references"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = BenchmarkService(db)
    benchmarks = service.list_benchmarks(
        query=q,
        region=region,
        benchmark_type=benchmark_type,
        is_synthetic=is_synthetic,
        skip=skip,
        limit=limit,
    )
    return ApiResponse(data=benchmarks, message=f"Retrieved {len(benchmarks)} benchmarks")


@router.post("", response_model=ApiResponse[BenchmarkResponse], status_code=status.HTTP_201_CREATED)
def create_benchmark(
    data: BenchmarkCreate,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    service = BenchmarkService(db)
    benchmark = service.create_benchmark(data)
    return ApiResponse(data=benchmark, message="Benchmark record created successfully")
