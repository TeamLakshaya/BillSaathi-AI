import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.seed import seed_database
from app.core.logging import logger


def main():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding synthetic reference benchmarks and demo bill scenarios...")
        summary = seed_database(db)
        print("Database seeding completed successfully!")
        print(f"Summary: {summary}")
        print("\nAccounts Created:")
        print("  Admin User: admin@billsaathi.ai / AdminPass@123")
        print("  Demo User:  demo@billsaathi.ai  / DemoPass@123")
        print("\n9 Demo Scenarios Initialized:")
        print("  1. Scenario 1: Correct Bill")
        print("  2. Scenario 2: Arithmetic Error (Line and Grand Total Mismatch)")
        print("  3. Scenario 3: Duplicate Charge (One-Time Service Repeated)")
        print("  4. Scenario 4: High Price with Contextual Evidence (Needs Review)")
        print("  5. Scenario 5: Verified Statutory Rule Violation (NPPA Stent Cap Breach)")
        print("  6. Scenario 6: Missing Benchmark (Insufficient Evidence)")
        print("  7. Scenario 7: Expired Benchmark (Expired Pandemic Cap)")
        print("  8. Scenario 8: Quantity / Unit Mismatch (Zero Quantity)")
        print("  9. Scenario 9: Low-Confidence OCR Extraction (User Confirmation Pending)")
    except Exception as e:
        logger.error(f"Seeding failed: {e}", exc_info=True)
        print(f"Error seeding database: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
