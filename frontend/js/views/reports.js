/**
 * Bill Saathi AI - Reports & Exports View
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Views = window.BillSaathi.Views || {};

(function () {
  const { esc, btn, badge, categories, money, date } = window.BillSaathi.Config;
  const State = window.BillSaathi.State;

  function render() {
    const cur = State.getCurrentCase();
    if (!cur) {
      return `
        <div class="empty">
          ${window.BillSaathi.Icons.get('file')}
          <h3>Create a case first</h3>
          <p>Documents, findings and drafts need a case to stay organized.</p>
          ${btn('Create a case', "BillSaathi.Views.resetWizard();BillSaathi.Router.go('new')", 'primary')}
        </div>
      `;
    }

    let types = [
      ['Bill Audit Summary', 'audit', 'Case totals, sample findings and unresolved questions.'],
      ['Potential Discrepancy Report', 'discrepancy', 'Observations that require a closer look, not confirmed errors.'],
      ['Document Checklist', 'checklist', 'Documents supplied and additional records to request.'],
      ['Evidence Summary', 'evidence', 'Document references, review status and user notes.'],
      ['Complaint Draft', 'complaint', 'Editable draft prepared by you in the complaint assistant.'],
      ['Affidavit Draft', 'affidavit', 'Unsigned factual draft requiring appropriate legal review.']
    ];

    return `
      <div class="page-heading">
        <div>
          <h1>Reports & Evidence</h1>
          <p>Take a clear, source-aware record into your next conversation.</p>
        </div>
        ${BillSaathi.Components.Navigation.caseSelector()}
      </div>

      <div class="notice">
        ${window.BillSaathi.Icons.get('info')}
        <span>Plain-text report export is implemented locally. The browser print dialog can save a PDF where supported. No server-side PDF, filing or legal validation is connected.</span>
      </div>

      <div class="report-grid">
        ${types.map(([t, key, d]) => `
          <section class="card padded">
            <span class="icon-box">${window.BillSaathi.Icons.get(key === 'complaint' ? 'complaint' : key === 'affidavit' ? 'affidavit' : 'reports')}</span>
            <h3>${t}</h3>
            <p class="muted">${d}</p>
            ${badge(key === 'complaint' || key === 'affidavit' ? (State.drafts[BillSaathi.Views.getDraftKey(key)]?.text ? 'Draft for Review' : 'Not prepared') : State.isDemo ? 'Sample data' : 'Local data')}
            <div class="actions" style="margin-top:20px">
              ${btn('Review report', `BillSaathi.Views.reviewReport('${key}')`, '', 'eye')}
            </div>
          </section>
        `).join('')}
      </div>
    `;
  }

  function reportText(key) {
    const cur = State.getCurrentCase();
    const docs = State.getDocs();
    const findings = State.getFindings();

    return `${State.isDemo ? 'DEMO DATA — NOT A REAL PATIENT RECORD\n' : ''}BILL SAATHI AI — ${key.toUpperCase()} REPORT
Case: ${cur.id} / ${cur.name}
Date: ${new Date().toLocaleDateString('en-GB')}
Provider: ${cur.hospital}
Review status: ${cur.stage}
Billed amount (user supplied / sample): ${money(cur.amount)}

DOCUMENTS & REVIEW STATUS
${docs.map(d => `${d.id}: ${d.name}; ${d.status}; source page ${d.sample ? '1' : 'not supplied'}`).join('\n') || 'No documents supplied.'}

${key !== 'checklist' ? 'FINDINGS / SOURCE REFERENCES\n' + (findings.map(f => `${f.id}: ${f.name}\n${f.why}\nSource ${f.doc}, page ${f.page}; ${f.status}${f.note ? '\nUser review note: ' + f.note : ''}`).join('\n\n') || 'No audit findings; no connected audit service.') + '\n\n' : ''}USER NOTES
${State.getStore().notes[cur.id] || 'None recorded.'}

UNRESOLVED QUESTIONS
${findings.filter(f => f.status !== 'Resolved by User').map(f => f.id + ': ' + f.name).join('\n') || 'No recorded unresolved findings. This does not establish the absence of billing issues.'}

DOCUMENT CHECKLIST
${categories.map(cat => `${docs.some(d => d.category === cat) ? '[Selected]' : '[Not supplied]'} ${cat}`).join('\n')}

DISCLAIMER
Sample findings are illustrative, not actual AI audit outputs. No independent source verification or official pricing check has been completed. User review is not proof of validity. No confirmed fraud, recovery or overcharging is asserted. This is not medical or legal advice.`;
  }

  function reviewReport(key) {
    if (['complaint', 'affidavit'].includes(key)) {
      BillSaathi.Router.go(key);
      let m = State.drafts[BillSaathi.Views.getDraftKey(key)];
      if (m) m.step = m.text ? 4 : 1;
      BillSaathi.Router.render();
      return;
    }
    let text = reportText(key);
    window.lastReport = { key, text };
    window.BillSaathi.Components.Modal.show('Review report before export', `
      <p class="note-text">Check every source reference and unresolved question. ${State.isDemo ? 'This report contains fictional sample records.' : ''}</p>
      <pre style="white-space:pre-wrap;max-height:390px;overflow:auto;font:11px/1.8 ui-monospace,monospace;background:#f8fafc;padding:14px;border:1px solid var(--line);border-radius:var(--radius-md);margin-top:12px">${esc(text)}</pre>
    `, btn('Print / Save PDF', 'BillSaathi.Views.printText(window.lastReport.text)') + btn('Export .txt', "BillSaathi.Views.downloadFile(BillSaathi.State.getCurrentCase().id+'-'+window.lastReport.key+'.txt',window.lastReport.text)", 'primary', 'download'));
  }

  function printText(text) {
    let f = document.createElement('iframe');
    f.style = 'position:fixed;left:-10000px;width:800px;height:600px';
    document.body.appendChild(f);
    f.contentDocument.open();
    f.contentDocument.write('<!doctype html><html><head><title>Bill Saathi · Report Preview</title><style>body{font:13px/1.8 Georgia,serif;padding:35px;color:#0f172a}pre{white-space:pre-wrap;font:inherit}</style></head><body><pre>' + esc(text) + '</pre></body></html>');
    f.contentDocument.close();
    f.contentWindow.focus();
    f.contentWindow.print();
    setTimeout(() => f.remove(), 60000);
  }

  function downloadFile(name, text, type = 'text/plain') {
    let blob = new Blob([text], { type });
    let u = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = u;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }

  window.BillSaathi.Views.reportsPage = render;
  window.BillSaathi.Views.reviewReport = reviewReport;
  window.BillSaathi.Views.reportText = reportText;
  window.BillSaathi.Views.printText = printText;
  window.BillSaathi.Views.downloadFile = downloadFile;
})();
