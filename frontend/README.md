# Bill Saathi AI — React + Vite + TypeScript Frontend

A patient-first healthcare bill analysis workspace recreated faithfully in **React 18 + TypeScript + Vite** with **React Router v6**. Designed to provide visual clarity, actionable insights, and transparent medical document organization without compromising privacy.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 3. Build for Production
```bash
npm run build
```
Generates an optimized, type-checked bundle in `dist/`.

### 4. Preview the Production Build
```bash
npm run preview
```

### 5. Run Verification Test Suite
```bash
node test_react_app.mjs
```

---

## 📁 Architecture & Directory Layout

```
frontend/
├── index.html                   # HTML5 template with Inter typography and favicon
├── package.json                 # React 18, React Router v6, TypeScript, Vite
├── vite.config.ts               # Vite configuration with React plugin
├── tsconfig.json                # Strict TypeScript configuration
├── public/
│   └── assets/                  # Brand logos, emblem marks, and icons
├── src/
│   ├── main.tsx                 # Application entry point with CSS imports
│   ├── App.tsx                  # Root component with HashRouter and Normalizer
│   ├── routes/
│   │   └── index.tsx            # Route definitions for all 14 application views
│   ├── types/
│   │   └── index.ts             # MedicalCase, DocumentRecord, AuditFinding, etc.
│   ├── services/
│   │   └── api-client.ts        # Typed API client and proposed backend contracts
│   ├── context/
│   │   └── WorkspaceContext.tsx # Reactive workspace state, demo/local modes, dialogs
│   ├── hooks/
│   │   └── useCaseSearch.ts     # Reusable search, filtering, and sorting hook
│   ├── utils/
│   │   ├── constants.ts         # Navigation items, stages, categories, demo cases
│   │   └── formatters.ts        # INR currency, date formatting, badge colors, helpers
│   ├── styles/
│   │   ├── variables.css        # Theme tokens (navy, primary blue, brand teal)
│   │   ├── base.css             # CSS reset, typography, utility classes
│   │   ├── layout.css           # Shell, responsive sidebar, sticky topbar, footer
│   │   ├── components.css       # Buttons, badges, icon boxes, dialog modals, toasts
│   │   ├── stepper.css          # 7-stage case progress stepper
│   │   ├── tables.css           # Data tables, search tools, pagination controls
│   │   └── views.css            # Dashboard cards, document preview paper, alerts
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.tsx    # App shell, mobile drawer overlay, topbar, footer
│   │   ├── common/
│   │   │   ├── Icon.tsx         # Crisp SVG icon renderer matching original paths
│   │   │   ├── Badge.tsx        # Status badge with semantic color mapping
│   │   │   ├── Button.tsx       # Reusable button with icon & variant support
│   │   │   └── Toast.tsx        # Accessible notification toast container
│   │   ├── navigation/
│   │   │   ├── Sidebar.tsx      # Responsive sidebar with full and collapsed logo
│   │   │   ├── Topbar.tsx       # Breadcrumbs, search, notifications, profile menu
│   │   │   └── CaseSelector.tsx # Active case selector dropdown
│   │   ├── modals/
│   │   │   └── DialogModal.tsx  # Accessible native HTML5 dialog modal
│   │   ├── stepper/
│   │   │   └── ProgressStepper.tsx # 7-stage visual progress tracker
│   │   ├── tables/
│   │   │   └── CaseTable.tsx    # Reusable case table with action buttons
│   │   └── forms/
│   │       └── FormField.tsx    # Standardized form input field with labels
│   └── pages/
│       ├── OverviewPage.tsx     # Dashboard, 4 stat cards, stepper, recent cases, feed
│       ├── CasesPage.tsx        # My Cases, table/grid toggle, search, filter, paginate
│       ├── CaseDetailPage.tsx   # Detailed case workspace, metrics, actions
│       ├── CaseWizardPage.tsx   # 3-step new/edit case workflow with validation
│       ├── UploadPage.tsx       # Drag-and-drop file upload, MIME check, preview
│       ├── DocumentReviewPage.tsx # Side-by-side paper preview & extracted field editor
│       ├── AuditPage.tsx        # Audit findings, review resolution note modal
│       ├── PriceVerificationPage.tsx # Reference comparisons & educational guide
│       ├── EvidencePage.tsx     # Evidence center, document library, finding linker
│       ├── DraftsPage.tsx       # Complaint & Affidavit assistant, 4-step builder
│       ├── ReportsPage.tsx      # 6 report summaries, modal preview, text export
│       ├── HelpPage.tsx         # Workflow guide, billing glossary accordion, status
│       └── SettingsPage.tsx     # Session preferences, JSON export, clear workspace
└── test_react_app.mjs           # Automated Playwright test verifying 100% of workflows
```

---

## 🎨 Design & Visual Identity

- **Typography**: `Inter` from Google Fonts (weights 400, 500, 600, 700, 800).
- **Official Brand Mark**:
  - Full Logo: Document icon with rupee `₹` and `+` medical cross in caring hands, "Bill Saathi Ai", and tagline *"Aapka Bill, Aapka Adhikaar."*.
  - Collapsed Emblem: Isolated caring hands and medical document mark in teal & navy.
- **Color System**:
  - Primary Blue: `#2563eb` (actions, links, highlights)
  - Brand Teal: `#0d9488` (brand mark, completed badges, privacy)
  - Amber: `#d97706` (needs review, arithmetic mismatch, possible duplicate)
  - Red: `#dc2626` (errors, danger actions)
  - Slate Neutrals: `#0f172a`, `#64748b`, `#f8fafc`, `#e2e8f0`

---

## 🔒 Privacy & Prototype Boundaries

- **Local/Demo Modes**: All data is kept strictly in-memory or session storage.
- **No Backend Simulation**: Features requiring server infrastructure (OCR, automated AI auditing, external database price lookup, cloud storage) are explicitly labeled with proposed endpoints (`services/api-client.ts`) and dialog notices.
