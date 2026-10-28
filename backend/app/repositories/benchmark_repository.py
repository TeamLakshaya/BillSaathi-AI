from datetime import date
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, and_, func
from app.models.benchmark import Benchmark
from app.models.price_rule import PriceRule


class BenchmarkRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, benchmark_id: str) -> Optional[Benchmark]:
        return self.db.execute(select(Benchmark).where(Benchmark.id == benchmark_id)).scalar_one_or_none()

    def create(self, **kwargs) -> Benchmark:
        benchmark = Benchmark(**kwargs)
        self.db.add(benchmark)
        self.db.commit()
        self.db.refresh(benchmark)
        return benchmark

    def list_all(
        self,
        query: Optional[str] = None,
        region: Optional[str] = None,
        benchmark_type: Optional[str] = None,
        is_synthetic: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Benchmark]:
        stmt = select(Benchmark)
        conditions = []
        if query:
            clean_q = f"%{query.strip().lower()}%"
            conditions.append(
                or_(
                    func.lower(Benchmark.normalized_item_name).like(clean_q),
                    func.lower(Benchmark.service_code).like(clean_q),
                    func.lower(Benchmark.source_name).like(clean_q),
                )
            )
        if region:
            conditions.append(or_(Benchmark.applicable_region == region, Benchmark.applicable_region == "National"))
        if benchmark_type:
            conditions.append(Benchmark.benchmark_type == benchmark_type)
        if is_synthetic is not None:
            conditions.append(Benchmark.is_synthetic == is_synthetic)

        if conditions:
            stmt = stmt.where(and_(*conditions))

        return list(self.db.execute(stmt.offset(skip).limit(limit)).scalars().all())

    def find_matching_benchmark(
        self,
        normalized_name: str,
        service_code: Optional[str] = None,
        hospital_id: Optional[str] = None,
        region: Optional[str] = None,
        bill_date: Optional[date] = None,
    ) -> Optional[Benchmark]:
        """
        Finds the most applicable and authoritative benchmark for an item.
        Priority:
        1. Exact service_code match (if provided) with date validity
        2. Hospital tariff specific match (if hospital_id provided)
        3. Exact normalized_name + region match with date validity
        4. Exact normalized_name + National match with date validity
        5. Fuzzy/substring normalized_name match with date validity
        """
        clean_name = normalized_name.strip().lower()

        def _search(apply_dates: bool) -> Optional[Benchmark]:
            def date_filter(model):
                if not apply_dates or not bill_date:
                    return True
                return and_(
                    or_(model.effective_from.is_(None), model.effective_from <= bill_date),
                    or_(model.effective_until.is_(None), model.effective_until >= bill_date),
                )

            # 1. Exact service code match
            if service_code:
                clean_code = service_code.strip()
                stmt = (
                    select(Benchmark)
                    .where(
                        and_(
                            func.lower(Benchmark.service_code) == clean_code.lower(),
                            date_filter(Benchmark),
                        )
                    )
                    .order_by(Benchmark.benchmark_type.desc())
                )
                match = self.db.execute(stmt).scalars().first()
                if match:
                    return match

            # 2. Hospital tariff match
            if hospital_id:
                stmt = (
                    select(Benchmark)
                    .where(
                        and_(
                            Benchmark.hospital_id == hospital_id,
                            func.lower(Benchmark.normalized_item_name) == clean_name,
                            date_filter(Benchmark),
                        )
                    )
                )
                match = self.db.execute(stmt).scalars().first()
                if match:
                    return match

            # 3. Regional match
            if region and region != "National":
                stmt = (
                    select(Benchmark)
                    .where(
                        and_(
                            func.lower(Benchmark.normalized_item_name) == clean_name,
                            Benchmark.applicable_region == region,
                            date_filter(Benchmark),
                        )
                    )
                    .order_by(Benchmark.benchmark_type.desc())
                )
                match = self.db.execute(stmt).scalars().first()
                if match:
                    return match

            # 4. National exact match
            stmt = (
                select(Benchmark)
                .where(
                    and_(
                        func.lower(Benchmark.normalized_item_name) == clean_name,
                        Benchmark.applicable_region == "National",
                        date_filter(Benchmark),
                    )
                )
                .order_by(Benchmark.benchmark_type.desc())
            )
            match = self.db.execute(stmt).scalars().first()
            if match:
                return match

            # 5. Substring / partial match on normalized_name
            stmt = (
                select(Benchmark)
                .where(
                    and_(
                        or_(
                            func.lower(Benchmark.normalized_item_name).like(f"%{clean_name}%"),
                            func.lower(Benchmark.normalized_item_name) == clean_name,
                        ),
                        date_filter(Benchmark),
                    )
                )
                .order_by(Benchmark.benchmark_type.desc())
            )
            return self.db.execute(stmt).scalars().first()

        # First try active benchmarks matching bill_date
        active_match = _search(apply_dates=True)
        if active_match:
            return active_match
        # Fallback to search without date restriction to diagnose expired records
        return _search(apply_dates=False)

    def list_price_rules(self, category: Optional[str] = None, bill_date: Optional[date] = None) -> List[PriceRule]:
        stmt = select(PriceRule)
        conditions = []
        if category:
            conditions.append(func.lower(PriceRule.applicable_item_category) == category.strip().lower())
        if bill_date:
            conditions.append(
                and_(
                    or_(PriceRule.effective_from.is_(None), PriceRule.effective_from <= bill_date),
                    or_(PriceRule.effective_until.is_(None), PriceRule.effective_until >= bill_date),
                )
            )
        if conditions:
            stmt = stmt.where(and_(*conditions))
        return list(self.db.execute(stmt).scalars().all())

    def create_price_rule(self, **kwargs) -> PriceRule:
        rule = PriceRule(**kwargs)
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        return rule
