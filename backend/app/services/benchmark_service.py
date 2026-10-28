from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.benchmark_repository import BenchmarkRepository
from app.schemas.benchmark import BenchmarkCreate, BenchmarkResponse


class BenchmarkService:
    def __init__(self, db: Session):
        self.repo = BenchmarkRepository(db)

    def list_benchmarks(
        self,
        query: Optional[str] = None,
        region: Optional[str] = None,
        benchmark_type: Optional[str] = None,
        is_synthetic: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[BenchmarkResponse]:
        benchmarks = self.repo.list_all(
            query=query,
            region=region,
            benchmark_type=benchmark_type,
            is_synthetic=is_synthetic,
            skip=skip,
            limit=limit,
        )
        return [BenchmarkResponse.model_validate(b) for b in benchmarks]

    def create_benchmark(self, data: BenchmarkCreate) -> BenchmarkResponse:
        b = self.repo.create(**data.model_dump())
        return BenchmarkResponse.model_validate(b)
