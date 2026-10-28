# Bill Saathi AI - Backend Documentation

Production-grade medical bill verification backend built with **Python 3.12+**, **FastAPI**, **SQLAlchemy 2**, **PostgreSQL / Supabase (with SQLite offline fallback)**, **Alembic**, **ReportLab**, and **Pydantic v2**.

---

## 1. Architecture Overview

- **Core Framework**: FastAPI with asynchronous endpoints and typed Pydantic v2 validation.
- **Database Engine**: SQLAlchemy 2 ORM compatible with PostgreSQL, Supabase, and SQLite.
- **Deterministic Verification Engine**:
  - Exact `Decimal` arithmetic for financial integrity (no floating-point rounding errors).
  - Grand total verification vs. itemized summation.
  - Line calculation checks: `quantity * unit_rate == billed_line_total`.
  - Authoritative statutory price ceiling matching (NPPA drug & stent price caps).
  - Contextual market reference matching (`needs_review`).
  - Clinically-aware duplicate charge detection (distinguishes one-time admission fees from repeated medications).
- **ReportLab PDF Generator**: Compiles downloadable evidence dossiers with factual findings, statutory references, and patient action plans.
- **Provider Abstractions**:
  - **OCR**: Replaceable provider abstraction (`LocalOCRProvider` with `pypdf` digital stream extraction and optical scan fallbacks).
  - **AI Extraction**: `GeminiAIProvider` with structured JSON schema enforcement and automatic fallback to `DemoAIProvider` (allowing 100% offline execution without API keys).

---

## 2. Windows PowerShell Setup Guide

Open Windows PowerShell and navigate to the project directory:

```powershell
cd "d:\BillSaathi AI\backend"
```

### Step 1: Create and Activate Virtual Environment
```powershell
# Create Python 3.12 virtual environment
python -m venv .venv

# Activate in PowerShell
.\.venv\Scripts\Activate.ps1
```
*(If PowerShell restricts script execution, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`)*

### Step 2: Install Dependencies
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
```powershell
Copy-Item .env.example .env
```
Default `.env` settings are pre-configured for instant local demo operation with zero external credentials:
- `DEMO_MODE=true`
- `DATABASE_URL="sqlite:///./billsaathi.db"`

### Step 4: Run Alembic Database Migrations
```powershell
alembic upgrade head
```

### Step 5: Seed Demo Scenarios & Synthetic Benchmarks
```powershell
python scripts/seed_demo_data.py
```
This initializes:
- Admin account: `admin@billsaathi.ai` / `AdminPass@123`
- Demo patient: `demo@billsaathi.ai` / `DemoPass@123`
- Real-world statutory benchmarks (NPPA Stent Cap, DPCO Paracetamol)
- 9 distinct demo bills (Arithmetic errors, Duplicates, Rule breaches, Expired caps, Low-confidence scans).

### Step 6: Start FastAPI Development Server
```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## 3. API Documentation & Endpoints

Open your browser to:
- **Interactive Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **System Health Check**: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

### Key Working Endpoints:
| Method | Path | Description | Access |
|---|---|---|---|
| `GET` | `/api/v1/health` | Health & DB connectivity check | Public |
| `POST` | `/api/v1/auth/register` | Register new user | Public |
| `POST` | `/api/v1/auth/login` | Authenticate & get JWT token | Public |
| `GET` | `/api/v1/auth/me` | Current user profile | Authenticated |
| `POST` | `/api/v1/bills/upload` | Upload PDF/PNG/JPG bill (validates signature, page count, SHA-256) | Session / JWT |
| `GET` | `/api/v1/bills` | List bills scoped to current user or `X-Session-ID` | Session / JWT |
| `GET` | `/api/v1/bills/{bill_id}` | Retrieve bill & extracted items (sanitized storage path) | Owner / Session / Admin |
| `GET` | `/api/v1/bills/{bill_id}/document` | Stream original uploaded file safely with access control | Owner / Session / Admin |
| `GET` | `/api/v1/bills/{bill_id}/items` | Retrieve line items with confidence & data provenance | Owner / Session / Admin |
| `PATCH` | `/api/v1/bills/{bill_id}/items/{item_id}` | Correct line item (increments `bill.version`, marks audit outdated) | Owner / Session / Admin |
| `POST` | `/api/v1/verification/verify/{bill_id}` | Run deterministic audit (arithmetic, taxes, DPCO caps, duplicates) | Owner / Session / Admin |
| `GET` | `/api/v1/verification/{bill_id}/summary` | View audit discrepancy summary with provenance | Owner / Session / Admin |
| `POST` | `/api/v1/reports/generate/{bill_id}` | Generate evidence dossier PDF linked to Bill & Audit versions | Owner / Session / Admin |
| `GET` | `/api/v1/reports/{report_id}/download` | Download ReportLab medical bill review report PDF | Owner / Session / Admin |
| `GET` | `/api/v1/benchmarks` | Search benchmarks & price rules | Public |
| `POST` | `/api/v1/benchmarks` | Create price benchmark | Admin Only |

---

## 4. Security Architecture

1. **Session-Scoped Ownership Model**:
   - For guest users prior to authentication, uploads and requests use cryptographic `X-Session-ID` tokens generated server-side and stored in the client session.
   - Cross-session or cross-user access attempts to bills, items, documents, or reports return `403 Forbidden` (preventing IDOR vulnerabilities).
2. **File Storage Isolation & Download Protection**:
   - Client filenames are sanitized and randomized server-side (`uuid4 + sanitized_name`).
   - Private filesystem paths (`storage_path`) are never exposed in API JSON responses (only basenames returned).
   - Document files are served via authorized streaming endpoint `GET /api/v1/bills/{bill_id}/document` with active ownership verification.
3. **Bill Versioning & Audit Invalidation**:
   - Any financial mutation to line items (`PATCH /items/{id}`) automatically sets `data_source="user_corrected"`, clears uncertainty flags, increments `bill.version`, and flags existing audits as outdated (`bill.version > bill.audit_version`).
   - Reports automatically regenerate audit findings if requested while outdated.
4. **Deterministic Accounting Rules**:
   - All arithmetic uses Python `Decimal` with `ROUND_HALF_UP` to prevent floating point inaccuracies.
   - Formula: `calculated_subtotal + tax_amount - discount_amount == total_amount`.
5. **Startup Settings & Secret Protection**:
   - Secrets (`SECRET_KEY`, `GEMINI_API_KEY`) are kept in `.env` and never logged or exposed in client responses.
   - Safe validation runs on startup in lifespan to verify key lengths and storage directories.

---

## 5. Running Automated Tests

Run the complete pytest test suite covering validation, extraction, arithmetic verification, duplicate detection, and security isolation:

```powershell
python -m pytest tests/ -v
```
*(All 27 automated tests pass with 0 errors)*

---

## 6. Frontend Integration

In the frontend directory (`d:\BillSaathi AI\frontend\.env`):

```bash
VITE_API_BASE_URL=/api/v1
```

The Vite dev server (`frontend/vite.config.ts`) is configured with proxying `/api` -> `http://127.0.0.1:8000`.
