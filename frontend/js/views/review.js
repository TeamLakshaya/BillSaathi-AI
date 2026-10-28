/**
 * Bill Saathi AI - Document Review View
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Views = window.BillSaathi.Views || {};

(function () {
  const { esc, btn, badge } = window.BillSaathi.Config;
  const State = window.BillSaathi.State;

  let selectedDocId = undefined;

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

    let ds = State.getDocs();
    let d = ds.find(x => x.id === selectedDocId) || ds[0];
    if (!d) {
      return `
        <div class="page-heading">
          <div>
            <h1>Document review</h1>
            <p>Confirm source details before using them in an audit.</p>
          </div>
          ${BillSaathi.Components.Navigation.caseSelector()}
        </div>
        <div class="empty">
          ${window.BillSaathi.Icons.get('file')}
          <h3>No documents to review</h3>
          <p>Add a bill to this case first.</p>
          ${btn('Add documents', "BillSaathi.Router.go('upload')", 'primary')}
        </div>
      `;
    }

    selectedDocId = d.id;
    let values = State.ocrEdits[d.id] || {
      hospital: cur.hospital,
      invoice: 'SAMPLE-2026-01',
      date: cur.date,
      total: cur.amount,
      patient: 'Sample patient'
    };

    return `
      <div class="page-heading">
        <div>
          <h1>Review the source, then the details</h1>
          <p>Keep AI-extracted values separate from user-confirmed information.</p>
        </div>
        ${BillSaathi.Components.Navigation.caseSelector()}
      </div>

      <div class="notice ${d.sample ? '' : 'warning'}">
        ${window.BillSaathi.Icons.get(d.sample ? 'info' : 'warning')}
        <span>${d.sample ? 'Illustrative extracted fields · No OCR engine was run. Confidence scores are unavailable.' : 'OCR unavailable — no extraction service is connected. Enter values manually and check the source. No confidence score is available.'}</span>
      </div>

      <div class="row" style="margin-bottom:18px">
        <label class="sr-only" for="doc-select">Select document</label>
        <select id="doc-select" class="page-selector" onchange="BillSaathi.Views.selectedDoc = this.value; BillSaathi.Router.render()">
          ${ds.map(x => `<option value="${x.id}" ${d.id === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}
        </select>
        ${badge(d.status)}
      </div>

      <div class="two-col">
        <section class="card padded">
          <div class="row" style="justify-content:space-between;margin-bottom:14px">
            <strong>Source document</strong>
            <span class="source-pill">${d.sample ? 'Page 1' : 'Original file'}</span>
          </div>
          <div class="doc-preview">${BillSaathi.Views.documentPreview(d)}</div>
        </section>

        <section class="card padded">
          <h3 style="margin:0 0 4px;font-size:15px;font-weight:700">${d.sample ? 'Illustrative extracted information' : 'Manual information entry'}</h3>
          <p class="note-text" style="margin-bottom:16px">${d.confirmed ? 'User-confirmed values.' : 'Unconfirmed — inspect the original document before confirming.'}</p>
          <form id="ocr-form" onsubmit="event.preventDefault();BillSaathi.Views.saveOCR(false)">
            ${[
              ['Patient name', 'patient', 'text'],
              ['Hospital name', 'hospital', 'text'],
              ['Invoice number', 'invoice', 'text'],
              ['Bill date', 'date', 'date'],
              ['Final total (INR)', 'total', 'number']
            ].map(([l, k, t]) => `
              <div class="extracted-field">
                <label for="ocr-${k}">${l}</label>
                <input id="ocr-${k}" name="${k}" type="${t}" ${t === 'number' ? 'min="0" step="0.01"' : ''} value="${esc((d.sample || State.ocrEdits[d.id]) ? values[k] : '')}">
                <small>${d.sample ? 'Sample source: page 1' : 'Source page not supplied · manually entered'} · ${d.confirmed ? 'User confirmed' : 'Not confirmed'}</small>
              </div>
            `).join('')}
            <div class="actions" style="margin-top:20px">
              <button class="primary" type="submit">Save Changes</button>
              ${btn('Mark as Reviewed', 'BillSaathi.Views.saveOCR(true)')}
              ${btn('Reprocess Document', "BillSaathi.Components.Modal.unavailable('OCR reprocessing','POST /api/documents/:id/reprocess')")}
              ${btn('Continue to Bill Audit', "BillSaathi.Router.go('audit')", '', 'arrow')}
            </div>
          </form>
          <p class="inline-note">Edits are stored in memory only. No invented confidence percentages are shown. A local review does not run an audit.</p>
        </section>
      </div>
    `;
  }

  function saveOCR(confirm) {
    let form = document.getElementById('ocr-form');
    if (!form || !form.reportValidity()) return;
    let data = Object.fromEntries(new FormData(form));
    if (confirm && Object.values(data).some(v => !v.trim())) {
      window.BillSaathi.Components.Toast.show('Complete each field, or save changes without marking it reviewed.');
      return;
    }
    State.ocrEdits[selectedDocId] = data;
    let d = State.getStore().docs.find(doc => doc.id === selectedDocId);
    if (confirm && d) {
      d.status = 'Reviewed locally';
      d.confirmed = true;
      State.addActivity('Document details reviewed locally');
    }
    BillSaathi.Router.render();
    window.BillSaathi.Components.Toast.show(confirm ? 'Document marked reviewed in this tab.' : 'Changes saved in this tab.');
  }

  window.BillSaathi.Views.reviewPage = render;
  window.BillSaathi.Views.saveOCR = saveOCR;
  Object.defineProperty(window.BillSaathi.Views, 'selectedDoc', {
    get: () => selectedDocId,
    set: id => { selectedDocId = id; }
  });
})();
