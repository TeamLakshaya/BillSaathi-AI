# Bill Saathi AI — Frontend Architecture & Guide

A patient-first healthcare bill analysis workspace interface designed to provide visual clarity, actionable insights, and transparent document organization.

---

## 📁 Directory Structure

```
frontend/
├── index.html                   # HTML5 entry point with Inter font & modular links
├── README.md                    # Architecture and developer documentation
├── css/
│   ├── variables.css            # Design tokens: palette, shadows, spacing, radiuses
│   ├── base.css                 # CSS reset, typography, and utility classes
│   ├── layout.css               # Sidebar, sticky topbar, shell, main container, footer
│   ├── components.css           # Buttons, badges, icon boxes, dialog modals, toasts, dropzone
│   ├── stepper.css              # 7-stage case progress tracker and status rings
│   ├── tables.css               # Responsive data tables, search tools, pagination
│   └── views.css                # View cards, synthetic document paper, and responsive breakpoints
├── js/
│   ├── icons.js                 # Crisp SVG icon definitions and generator helper
│   ├── config.js                # Global configuration, constants, categories, stages, formatters
│   ├── state.js                 # Centralized state management, sample data, reactivity
│   ├── components/
│   │   ├── modal.js             # Accessible dialog modals and unintegrated feature notices
│   │   ├── toast.js             # Notification toast alerts with auto-dismiss
│   │   ├── navigation.js        # Sidebar brand, active nav items, collapsed mode, topbar breadcrumbs
│   │   └── stepper.js           # 7-step tracker rendering and dynamic next action resolution
│   ├── views/
│   │   ├── overview.js          # Dashboard welcome, 4 stat cards, stepper card, recent cases table
│   │   ├── cases.js             # My Cases page, table/grid toggle, search, filter, sort, pagination
│   │   ├── detail.js            # Single case detail view, case stats, information, quick actions
│   │   ├── wizard.js            # Case creation/editing 3-step wizard with form validation
│   │   ├── upload.js            # Document upload center, drag-and-drop, MIME validation, previews
│   │   ├── review.js            # Document review, side-by-side paper preview, OCR extracted fields editor
│   │   ├── audit.js             # Bill audit view, metrics cards, findings table, user review resolution modal
│   │   ├── price.js             # Price verification table, applicability checks, reference guidelines
│   │   ├── evidence.js          # Evidence center, document library, finding linker, user evidence notes
│   │   ├── drafts.js            # Complaint & Affidavit assistant, 4-step draft builder, text export, print
│   │   ├── reports.js           # 6 report summaries, text modal preview, plain-text export, print
│   │   ├── help.js              # How it works, billing terms glossary accordion, prototype disclaimers
│   │   └── settings.js          # Workspace preferences, JSON session export, clear workspace
│   └── app.js                   # Main application controller, router (hash routing), global event wiring
└── assets/
    ├── dashboard-desktop.png    # Reference desktop mockup
    └── dashboard-mobile.png     # Reference mobile mockup
```

---

## 🎨 Design System & Visual Aesthetics

1. **Typography**: Google Fonts `Inter` (weights 400, 500, 600, 700, 800) for clean, modern readability.
2. **Color Palette**:
   * **Primary Blue** (`#2563eb`): Used for key call-to-actions, active navigation highlights, and interactive indicators.
   * **Brand Teal** (`#0d9488`): Accent color for brand mark, success badges, and privacy indicators.
   * **Semantic Badges**:
     * Amber (`#d97706` / `#fef3c7`): Needs Review, Possible Duplicate, Missing Info.
     * Emerald (`#059669` / `#ecfdf5`): Completed, Reviewed Locally, Resolved by User.
     * Blue (`#2563eb` / `#eff6ff`): Awaiting Documents, In Progress.
     * Red (`#dc2626` / `#fef2f2`): Failed, Errors, Danger Actions.
3. **Responsive Grid**:
   * Desktop (1440px+): 2-column dashboard layout (minmax main + 310px sidebar widgets).
   * Tablet (1000px): Adjusted 1-column stack layout with responsive stat cards.
   * Mobile (390px - 700px): Drawer navigation with slide-in animation, zero horizontal scroll overflow.

---

## 🚀 Getting Started

No build step or dependencies required!

### Option 1: Open Directly in Browser
Double-click `frontend/index.html` to open it in Chrome, Edge, Safari, or Firefox.

### Option 2: Run via Local Server
```bash
# Using Python
python -m http.server 8000 -d "frontend"

# Or using Node npx
npx serve frontend
```
Navigate to `http://localhost:8000`.

---

## 🧪 Views & Interactive Capabilities

* **Overview (`#overview`)**: Welcome header, 4 metric cards, case progression stepper, recent cases table, attention alerts, and recent activity feed.
* **My Cases (`#cases`)**: Table & grid view toggle, real-time search, status filter, sort by date/amount/name, and pagination.
* **New Case Wizard (`#new`)**: 3-step creation wizard (case details -> review objectives -> confirmation summary).
* **Document Center (`#upload`)**: Drag-and-drop file uploader with client-side MIME check (PDF, JPG, PNG) and 10MB limit.
* **Document Review (`#review`)**: Side-by-side paper bill visualization with editable OCR fields and *"Mark as Reviewed"* confirmation.
* **Bill Audit (`#audit`)**: High-level audit metrics and findings list with *"View Evidence"* and *"Mark as Reviewed"* resolution modal.
* **Price Verification (`#price`)**: Reference comparison table with disclaimers and guidelines for valid rate references.
* **Evidence Center (`#evidence`)**: Document library with finding associations, user notes autosave, and timeline.
* **Complaint & Affidavit Drafts (`#complaint`, `#affidavit`)**: 4-step factual draft wizard with checklist verification, text export (`.txt`), and browser print dialog.
* **Reports & Exports (`#reports`)**: 6 comprehensive reports with modal preview, text download, and print support.
* **Help & Support (`#help`)**: Plain-language billing terms accordion and 8-step workflow guide.
* **Settings & Privacy (`#settings`)**: Session preferences, JSON session backup export, and workspace clearing.
