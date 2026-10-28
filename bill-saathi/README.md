# Bill Saathi AI — connected frontend prototype

## Start
Open `index.html` in a modern browser. No install, external assets, account, API key or build step is required. Alternatively, run `python -m http.server 8000` in this directory.

Only the specification was supplied; no existing repository, framework, authentication, database or backend could be inspected or preserved. This implementation uses dependency-free HTML, CSS and JavaScript. It is a frontend prototype, not a production medical-data system.

## Available
- Responsive dashboard with collapsible desktop sidebar and mobile drawer.
- All twelve requested navigation destinations, case workspace, document review.
- Demo and empty local workspace kept separate in memory.
- Case creation / editing wizard with validation, objectives and review summary.
- Case search, stage filtering, sorting, table/grid views, pagination, confirmed deletion.
- Local PDF/JPG/PNG selection, drag-and-drop, type/size checks, categories, removal and previews.
- Editable sample extraction / manual fields, local saves and user confirmation.
- Clearly labeled sample audit findings with source pages and user review notes.
- Explicit no-reference state; no fabricated official rate or authority.
- Evidence filters, document previews/downloads, user notes and finding associations.
- Complaint / affidavit template wizard, editing, final checklist, plain-text export and browser print.
- Report previews, plain-text exports and browser print / Save as PDF where supported.
- Session preferences, session JSON export and confirmed workspace clearing.

## Intentional limits
No server upload, upload progress, OCR, AI audit, AI drafting, reference lookup, login, cloud persistence, email delivery, online filing or legal validation is implemented. Related buttons open explicit unavailable dialogs with proposed integration endpoints. There are no simulated server successes or fake processing indicators. Local document selection is never reported as successful server upload. The dashboard retains the requested “Documents Uploaded” label but qualifies local counts as local selections rather than uploads.

File bytes are held as browser object URLs. Metadata, notes, field edits and draft text are held in JavaScript memory. Refreshing or closing the page clears the workspace. No localStorage, tracking code, external font/icon/CDN request, or application network request is used by the prototype. Browser extensions, the embedding host and exported downloads are outside this guarantee. Do not enter real patient information in a shared demo or embed.

The seven-stage tracker represents sample case progress; local actions do not falsely advance backend audit stages. Tooltips explain each stage. To use real production progress, use confirmed backend state transitions. English is implemented; Hindi is explicitly unavailable. Icons are inline SVG with consistent outline styling, not an external Lucide dependency.

## Proposed backend integration
`api-client.ts` contains typed proposed contracts, safe error handling and fetch wrappers. It is not compiled or loaded by the standalone demo and must be integrated into the application's actual framework when a repository is supplied. Every endpoint is proposed, not verified to exist.

Connect in this order:
1. Authentication, authorization, session management and server-side case ownership checks.
2. Case CRUD and paginated search; replace in-memory state with validated API responses.
3. Authorized multipart document upload and protected previews / download URLs.
4. OCR job orchestration; display server-provided statuses and confidence only when supplied.
5. User field corrections and reviewed-state persistence with source references.
6. Versioned audit results, evidence mappings, verified price-reference applicability.
7. Draft/report persistence, output validation, privacy-safe logs and audit trails.

Never replace a real integration with this demo state. Server IDs, counts, processing status, audit completion, review stages and uploads must update only from confirmed responses. Handle loading, cancellation, retryable errors and empty responses at each boundary. Actual upload progress should measure bytes sent, not run a timer. Failed uploads should retain retry context and show a real server error without sensitive payloads. Runtime response validation must be added to the typed client.

## Before production
Obtain a security/privacy review. Add identity and access control, consent handling, encryption and key management, malware scanning, server-side MIME/size validation, protected asset handling, retention/deletion policies, audit logs, rate limits, CSRF protection, CSP and secure headers. Treat every export as sensitive. Verify jurisdiction-specific procedures and pricing applicability with appropriate sources; none are asserted by this prototype. Do not rely on local user review as independent verification.
