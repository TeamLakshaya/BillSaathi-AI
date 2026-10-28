# Bill Saathi AI (बिल साथी) 🏥🧾

> **Factual, Evidence-Based Medical Bill Verification & Patient Advocacy System for Indian Healthcare**

Bill Saathi AI empowers patients, families, and healthcare advocates to audit hospital bills against statutory government price ceilings (NPPA / DPCO), identify duplicate charges, audit line arithmetic, and prepare structured grievance drafts and evidence dossiers.

---

## 🌟 Key Capabilities

- **Multimodal Bill Upload & Parsing**:
  - Full end-to-end support for **JPG, JPEG, PNG, and PDF** (digital & scanned).
  - Multimodal AI ingestion using Google Gemini REST API (`inlineData` base64).
  - No synthetic hallucinations: extracts strictly visible, supported bill items.
  - Transparent error flagging: uncertain rates or low confidence are automatically flagged for user review (`review_required`).
- **Deterministic Healthcare Financial Audit**:
  - `Decimal` arithmetic precision (zero floating-point errors).
  - Verifies `quantity * unit_rate == billed_line_total` and grand total balance.
  - Matches items against authoritative NPPA price ceilings (e.g. coronary stents, essential medicines under DPCO).
  - Clinically-aware duplicate detection (distinguishes one-time admission/nursing fees from recurring doses).
- **Patient Advocacy & Dispute Resolution**:
  - Automated evidence dossiers and legal complaint drafts.
  - Formal Affidavit / Declaration templates for insurance claims and consumer dispute forums.
  - CSV exports of audit findings for external reconciliation.
- **Privacy & Security by Design**:
  - Anonymous session-isolated bill storage via `X-Session-ID` tokens.
  - Cryptographic file integrity checks (`SHA-256`), magic byte signature verification, and image dimension limits (up to 10,000x10,000 px).
  - Sanitized file storage paths preventing path traversal.

---

## 🏗️ Architecture

```
BillSaathi-AI/
├── backend/                   # FastAPI Python backend
│   ├── app/
│   │   ├── api/v1/            # REST endpoints (auth, bills, verification, reports)
│   │   ├── core/              # Config, security, logging
│   │   ├── models/            # SQLAlchemy database models
│   │   ├── providers/ai/      # Gemini multimodal & demo AI providers
│   │   ├── providers/ocr/     # Local PDF text extraction
│   │   ├── repositories/      # Database abstraction repositories
│   │   ├── schemas/           # Pydantic v2 validation models
│   │   ├── services/          # Audit & verification business logic
│   │   └── utils/             # Money (Decimal), dates, file validation
│   ├── scripts/               # Database seeder scripts
│   └── tests/                 # 35 comprehensive automated tests (pytest)
├── frontend/                  # Modern React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components & layouts
│   │   ├── context/           # Workspace & live API state management
│   │   ├── pages/             # App pages (Upload, Review, Audit, Price, Reports, Complaint)
│   │   └── services/          # Typed API client with session management
└── LICENSE                    # MIT License
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.12+**
- **Node.js 18+** & `npm`

### 2. Backend Setup
```powershell
cd backend

# Create & activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment (preconfigured with local SQLite & demo fallback)
copy .env.example .env

# Run database migrations & seed benchmarks
alembic upgrade head
python scripts/seed_demo_data.py

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Health: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
- Interactive Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Frontend Setup
```powershell
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
- Web Application: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

---

## 🧪 Testing

### Backend Tests (pytest)
```powershell
cd backend
pytest
```
*35 tests covering multimodal image/PDF uploads, corrupted image rejection, missing credentials handling, malformed AI output handling, duplicate detection, statutory price matching, session isolation, and audit versioning.*

### Frontend Production Build
```powershell
cd frontend
npm run build
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
Copyright (c) 2026 Team Lakshaya.
