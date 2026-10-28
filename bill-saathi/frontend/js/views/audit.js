/**
 * Bill Saathi AI - Bill Audit View
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Views = window.BillSaathi.Views || {};

(function () {
  const { esc, btn, badge, money } = window.BillSaathi.Config;
  const State = window.BillSaathi.State;

  let auditFilter = 'all';

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

    let fs = State.getFindings(), amount = cur.amount;
    let filtered = fs.filter(f => auditFilter === 'all' || f.type === auditFilter || (auditFilter === 'unresolved' && f.status !== 'Resolved by User'));

    return `
      <div class="page-heading">
        <div>
          <h1>Bill audit</h1>
          <p>Understand the questions. Inspect the evidence. Decide the next step.</p>
        </div>
        ${BillSaathi.Components.Navigation.caseSelector()}
      </div>

      <div class="notice ${fs.length ? '' : 'warning'}">
        ${window.BillSaathi.Icons.get(fs.length ? 'info' : 'warning')}
        <span>${fs.length ? 'Illustrative sample findings — not produced by a live audit service. A flag is not proof of an invalid charge, fraud or overcharging.' : 'No audit has been run. The backend audit service is not connected. Local document review does not produce automated findings.'}</span>
      </div>

      <div class="audit-mini">
        ${[
          ['Total bill amount', money(amount)],
          ['Total of itemized entries', cur.id === 'BS-1024' ? '₹84,000' : 'Not available'],
          ['Arithmetic differences', fs.filter(f => f.type === 'arithmetic').length],
          ['Potential duplicate entries', fs.filter(f => f.type === 'duplicate').length],
          ['Medical-record review', fs.filter(f => f.type === 'medical').length],
          ['Price-reference review', 'Not performed']
        ].map(([l, v]) => `
          <div class="card">
            <small>${l}</small>
            <strong>${v}</strong>
            ${State.isDemo ? '<span class="badge gray">Sample data</span>' : ''}
          </div>
        `).join('')}
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <h2>Findings requiring a closer look</h2>
            <p>Review dates, quantities, descriptions and source pages.</p>
          </div>
          ${btn('Run bill audit', "BillSaathi.Components.Modal.unavailable('Bill audit','POST /api/cases/:id/audits')", 'primary', 'audit')}
        </div>
        <div class="table-tools">
          <select aria-label="Filter audit findings" onchange="BillSaathi.Views.auditFilter = this.value; BillSaathi.Router.render()">
            ${[
              ['all', 'All findings'],
              ['unresolved', 'Unresolved'],
              ['arithmetic', 'Arithmetic verification'],
              ['duplicate', 'Potential duplicates'],
              ['medical', 'Medical-record cross-check'],
              ['package', 'Package / insurance review']
            ].map(([v, l]) => `<option value="${v}" ${auditFilter === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        ${filtered.length ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>FINDING</th>
                  <th>AMOUNT INVOLVED</th>
                  <th>WHY IT WAS FLAGGED</th>
                  <th>SOURCE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(f => `
                  <tr>
                    <td>
                      <strong>${esc(f.name)}</strong>
                      <small>${f.id} · Demo Data</small>
                    </td>
                    <td class="money">${f.amount === null ? 'Not determined' : money(f.amount)}</td>
                    <td class="item-note">${esc(f.why)}</td>
                    <td>${f.doc}<small>Page ${f.page}</small></td>
                    <td>${badge(f.status)}</td>
                    <td>
                      <div class="stack" style="gap:6px">
                        ${btn('View Evidence', `BillSaathi.Views.findingEvidence('${f.id}')`, 'text-link')}
                        ${btn('Mark as Reviewed', `BillSaathi.Views.resolveFinding('${f.id}')`, 'text-link')}
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
            <h3>No findings to display</h3>
            <p>Run a connected audit service when available, or change the filter.</p>
          </div>
        `}
        <div class="padded" style="border-top:1px solid #f1f5f9">
          <p class="note-text">Missing documentation does not prove that a service was not provided. Similar entries may represent separate services. Check uploaded package and insurance terms before drawing conclusions.</p>
        </div>
      </div>
    `;
  }

  function findingEvidence(id) {
    let f = State.getStore().findings.find(x => x.id === id);
    if (!f) return;
    window.BillSaathi.Components.Modal.show('Finding ' + id, `
      <p><strong>${esc(f.name)}</strong></p>
      <p style="margin:8px 0">${esc(f.why)}</p>
      <p>Source: ${esc(f.doc)} · page ${f.page} · <strong>Demo Data</strong></p>
      <p class="note-text">This is an illustrative observation, not a verified allegation.</p>
    `, btn('Open source', `BillSaathi.Components.Modal.close();BillSaathi.Views.previewDoc('${f.doc}')`, 'primary'));
  }

  function resolveFinding(id) {
    window.BillSaathi.Components.Modal.show('Record your review', `
      <p>Mark this observation as reviewed by you. This records your action; it does not establish that the charge is valid or invalid.</p>
      <label for="resolution-note" style="margin-top:14px">Review note (required)</label>
      <textarea id="resolution-note" placeholder="What did you check, and what remains uncertain?"></textarea>
    `, btn('Save review', `BillSaathi.Views.finishFinding('${id}')`, 'primary'));
  }

  function finishFinding(id) {
    let noteEl = document.getElementById('resolution-note');
    let note = noteEl ? noteEl.value.trim() : '';
    if (!note) {
      window.BillSaathi.Components.Toast.show('Add a review note first.');
      return;
    }
    let f = State.getStore().findings.find(x => x.id === id);
    if (f) {
      f.status = 'Resolved by User';
      f.note = note;
      State.addActivity('Finding review recorded locally');
    }
    window.BillSaathi.Components.Modal.close();
    BillSaathi.Router.render();
    window.BillSaathi.Components.Toast.show('User review recorded locally; no automated verification was performed.');
  }

  window.BillSaathi.Views.auditPage = render;
  window.BillSaathi.Views.findingEvidence = findingEvidence;
  window.BillSaathi.Views.resolveFinding = resolveFinding;
  window.BillSaathi.Views.finishFinding = finishFinding;
  Object.defineProperty(window.BillSaathi.Views, 'auditFilter', {
    get: () => auditFilter,
    set: val => { auditFilter = val; }
  });
})();
