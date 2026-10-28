/**
 * Bill Saathi AI - Help & Support View
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Views = window.BillSaathi.Views || {};

(function () {
  const { btn } = window.BillSaathi.Config;

  function render() {
    return `
      <div class="page-heading">
        <div>
          <h1>A little guidance, every step of the way</h1>
          <p>Medical billing can feel complex. Start with one document and one question.</p>
        </div>
      </div>

      <div class="card padded" style="margin-bottom:20px">
        <div class="eyebrow">HOW BILL SAATHI AI WORKS</div>
        <h3 style="font-size:18px;margin-top:6px;font-weight:750">From a confusing bill to an informed next step.</h3>
        <div class="help-steps" style="margin-top:16px">
          ${[
            'Create a case',
            'Add your documents',
            'Review extracted details',
            'Inspect the bill audit',
            'Verify relevant references',
            'Organize your evidence',
            'Prepare an optional draft',
            'Review and export'
          ].map(t => `<div>${t}</div>`).join('')}
        </div>
      </div>

      <div class="two-col">
        <section class="card padded">
          <h3 style="font-size:15px;margin-top:0;font-weight:700">Billing terms, in plain language</h3>
          ${[
            ['Itemized bill', 'A bill that lists individual services, medicines and charges.'],
            ['Potential duplicate', 'Two entries that may refer to the same charge and need review. Similar descriptions do not establish that a charge is invalid.'],
            ['Reference price', 'A documented price that may apply to a particular service or situation. Check the effective date and applicability.'],
            ['Evidence', 'Documents or information supporting a statement.'],
            ['Complaint draft', 'A document prepared for your review before submission. A draft is not a filed complaint.']
          ].map(([t, d]) => `<details><summary>${t}</summary><p>${d}</p></details>`).join('')}
        </section>

        <section class="card padded">
          <h3 style="font-size:15px;margin-top:0;font-weight:700">What is available in this prototype?</h3>
          <p class="note-text">You can create cases locally, select and preview files, edit information, explore sample findings, link evidence, prepare templates, and export text reports.</p>
          <p class="note-text" style="margin-top:8px">Cloud storage, authentication, OCR, automated AI audits, verified price lookup, notifications by email and online complaint submission are not connected.</p>
          <div class="notice warning" style="margin-top:14px">
            ${window.BillSaathi.Icons.get('warning')}
            <span>Do not use this prototype as a secure medical-record system. Files and case information are cleared on reload. Use fictional data when demonstrating it.</span>
          </div>
          ${btn('View integration requirements', "BillSaathi.Views.integrationInfo()", '', 'file')}
        </section>
      </div>
    `;
  }

  function integrationInfo() {
    window.BillSaathi.Components.Modal.show('Backend integration requirements', `
      <p>A production deployment needs authenticated APIs, authorization, secure document storage, OCR, audit orchestration and verified reference lookup.</p>
      <div class="notice" style="margin:12px 0">
        <strong>Proposed integration endpoints</strong><br>
        <pre style="font-size:11px;white-space:pre-wrap;margin-top:6px">GET/POST /api/cases
PATCH/DELETE /api/cases/:id
POST /api/cases/:id/documents
GET/PATCH /api/documents/:id
POST /api/documents/:id/reprocess
POST /api/cases/:id/audits
GET /api/cases/:id/price-references
GET/POST /api/cases/:id/evidence
POST /api/cases/:id/drafts
GET /api/cases/:id/reports</pre>
      </div>
      <p class="note-text">The source bundle includes a proposed typed client and integration notes. No existing backend was supplied.</p>
    `);
  }

  window.BillSaathi.Views.helpPage = render;
  window.BillSaathi.Views.integrationInfo = integrationInfo;
})();
