/**
 * Bill Saathi AI - Evidence Center View
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Views = window.BillSaathi.Views || {};

(function () {
  const { esc, btn, badge, categories, date } = window.BillSaathi.Config;
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

    const docs = State.getDocs();
    const findings = State.getFindings();

    return `
      <div class="page-heading">
        <div>
          <h1>Evidence center</h1>
          <p>Keep every claim connected to its source.</p>
        </div>
        ${BillSaathi.Components.Navigation.caseSelector()}
      </div>

      <div class="two-col">
        <section class="card padded">
          <h3 style="font-size:14px;margin-top:0;font-weight:700">Evidence summary</h3>
          <p class="note-text"><strong>Verified document facts:</strong> ${docs.filter(d => d.confirmed).length} document(s) reviewed by you locally. Independent verification is unavailable.</p>
          <p class="note-text"><strong>User-provided statement:</strong> ${esc(cur.description || 'None recorded.')}</p>
          <p class="note-text"><strong>AI-generated observations:</strong> ${State.isDemo ? 'Sample findings only; no live AI generation.' : 'No AI service connected.'}</p>
          <p class="note-text"><strong>Unresolved questions:</strong> ${findings.filter(f => f.status !== 'Resolved by User').length} finding(s) requiring review.</p>
          <p class="note-text"><strong>Missing supporting documents:</strong> ${docs.some(d => d.category === 'Hospital package or estimate documents') ? 'Package document selected; applicability not verified.' : 'No package / estimate document has been added.'}</p>
        </section>

        <section class="card padded">
          <h3 style="font-size:14px;margin-top:0;font-weight:700">Your evidence notes</h3>
          <label for="evidence-notes">Questions, context and document references</label>
          <textarea id="evidence-notes" placeholder="Record what you know and what needs clarification…">${esc(State.getStore().notes[cur.id] || '')}</textarea>
          <div class="actions" style="margin-top:12px">
            ${btn('Save notes', "BillSaathi.Views.saveEvidenceNotes()", 'primary')}
            ${btn('Add documents', "BillSaathi.Router.go('upload')")}
          </div>
        </section>
      </div>

      <div class="space"></div>

      <section class="card">
        <div class="card-head">
          <div>
            <h2>Document library & finding links</h2>
            <p>Original source pages and user-added associations.</p>
          </div>
        </div>
        <div class="table-tools">
          <input id="evidence-search" aria-label="Search evidence" placeholder="Search documents…" oninput="BillSaathi.Views.updateEvidence()">
          <select id="evidence-category" aria-label="Filter document category" onchange="BillSaathi.Views.updateEvidence()">
            <option value="all">All categories</option>
            ${categories.map(c => `<option>${esc(c)}</option>`).join('')}
          </select>
        </div>
        <div id="evidence-table"></div>
      </section>

      <div class="space"></div>

      <section class="card padded">
        <h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Evidence timeline</h3>
        ${docs.map(d => `
          <p class="note-text">
            <span class="source-pill">${d.sample ? 'Sample timeline' : date(new Date().toISOString().slice(0, 10))}</span>
            ${esc(d.name)} — ${esc(d.status)}
          </p>
        `).join('') || '<p class="note-text">Your documents will appear here.</p>'}
      </section>
    `;
  }

  function saveEvidenceNotes() {
    const cur = State.getCurrentCase();
    const notesEl = document.getElementById('evidence-notes');
    if (cur && notesEl) {
      State.getStore().notes[cur.id] = notesEl.value;
      window.BillSaathi.Components.Toast.show('Notes saved in this tab.');
    }
  }

  function updateEvidence() {
    const searchEl = document.getElementById('evidence-search');
    const catEl = document.getElementById('evidence-category');
    const q = searchEl ? searchEl.value.toLowerCase() : '';
    const cat = catEl ? catEl.value : 'all';

    const docs = State.getDocs().filter(d => d.name.toLowerCase().includes(q) && (cat === 'all' || d.category === cat));
    const findings = State.getFindings();
    const cur = State.getCurrentCase();
    const tableEl = document.getElementById('evidence-table');
    if (!tableEl) return;

    tableEl.innerHTML = docs.length ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>EVIDENCE ID / DOCUMENT</th>
              <th>RELATED FINDING</th>
              <th>SOURCE PAGE</th>
              <th>DATE</th>
              <th>REVIEW STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            ${docs.map(d => `
              <tr>
                <td>
                  <strong>${esc(d.name)}</strong>
                  <small>${esc(d.id)} ${d.sample ? '· Demo Data' : ''}</small>
                </td>
                <td>${findings.filter(f => f.doc === d.id || f.extraDoc === d.id).map(f => f.id).join(', ') || 'Not linked'}</td>
                <td>${d.sample ? '1' : 'Not supplied'}</td>
                <td>${d.sample ? 'Sample · ' + date(cur.date) : 'This session'}</td>
                <td>${badge(d.status)}</td>
                <td>
                  <div class="row">
                    ${btn('Preview', `BillSaathi.Views.previewDoc('${d.id}')`, 'text-link')}
                    ${btn('Link finding', `BillSaathi.Views.linkFinding('${d.id}')`, 'text-link')}
                    ${btn('Download', `BillSaathi.Views.downloadDoc('${d.id}')`, 'text-link')}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="empty">
        ${window.BillSaathi.Icons.get('file')}
        <h3>No matching evidence</h3>
        <p>Add documents or change your filters.</p>
      </div>
    `;
  }

  function linkFinding(id) {
    const findings = State.getFindings();
    if (!findings.length) {
      window.BillSaathi.Components.Toast.show('No findings exist for this case yet.');
      return;
    }
    window.BillSaathi.Components.Modal.show('Link a document to a finding', `
      <label for="link-finding">Select finding</label>
      <select id="link-finding">
        ${findings.map(f => `<option value="${f.id}">${esc(f.id + ' · ' + f.name)}</option>`).join('')}
      </select>
      <p class="note-text" style="margin-top:10px">This records your association, not independent verification.</p>
    `, btn('Save link', `BillSaathi.Views.saveFindingLink('${id}')`, 'primary'));
  }

  function saveFindingLink(docId) {
    const selEl = document.getElementById('link-finding');
    if (selEl) {
      const f = State.getFindings().find(x => x.id === selEl.value);
      if (f) f.extraDoc = docId;
      window.BillSaathi.Components.Modal.close();
      BillSaathi.Router.render();
      window.BillSaathi.Components.Toast.show('Evidence link saved locally.');
    }
  }

  function downloadDoc(id) {
    let d = State.getStore().docs.find(x => x.id === id);
    if (!d) return;
    const cur = State.getCurrentCase();

    if (d.sample) {
      BillSaathi.Views.downloadFile('sample-document-' + id + '.txt', `SYNTHETIC DOCUMENT — DEMO DATA\n${d.name}\n${cur.hospital}\nCase: ${cur.id}\nThis is a fictional demonstration document, not a patient record.\n${d.category.includes('invoices') ? 'Room & nursing 30000\nProcedure & services 42000\nCBC panel 2500\nCBC panel 2500\nMedicines & supplies 7000\nLine-item total 84000\nBilled total 84500\nSource page: 1' : ''}`);
      return;
    }
    let u = State.docUrls.get(id);
    if (u) {
      let a = document.createElement('a');
      a.href = u;
      a.download = d.name;
      a.click();
    } else {
      window.BillSaathi.Components.Toast.show('Original file is unavailable. Select it again.');
    }
  }

  window.BillSaathi.Views.evidencePage = render;
  window.BillSaathi.Views.saveEvidenceNotes = saveEvidenceNotes;
  window.BillSaathi.Views.updateEvidence = updateEvidence;
  window.BillSaathi.Views.linkFinding = linkFinding;
  window.BillSaathi.Views.saveFindingLink = saveFindingLink;
  window.BillSaathi.Views.downloadDoc = downloadDoc;
})();
