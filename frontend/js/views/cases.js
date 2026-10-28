/**
 * Bill Saathi AI - My Cases View (Table & Grid Views, Search, Filter, Sort, Delete)
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Views = window.BillSaathi.Views || {};

(function () {
  const { esc, btn, badge, money, date } = window.BillSaathi.Config;
  const State = window.BillSaathi.State;

  let caseView = 'table';
  let searchQuery = '';
  let filterStatus = 'all';
  let sortOption = 'updated';
  let currentPage = 1;
  const pageSize = 5;

  function render() {
    return `
      <div class="page-heading">
        <div>
          <h1>My cases</h1>
          <p>A clear view of every bill review in your workspace.</p>
        </div>
        ${btn('Create New Case', "BillSaathi.Views.resetWizard();BillSaathi.Router.go('new')", 'primary', 'plus')}
      </div>
      <div class="card">
        <div class="card-head">
          <div class="row">
            <span class="badge gray">${State.getStore().cases.length} cases</span>
            ${State.isDemo ? '<span class="badge teal">Demo Data</span>' : ''}
          </div>
          <div class="row">
            ${btn(window.BillSaathi.Icons.get('list'), "BillSaathi.Views.setCaseView('table')", 'small')}
            ${btn(window.BillSaathi.Icons.get('grid'), "BillSaathi.Views.setCaseView('grid')", 'small')}
          </div>
        </div>
        <div class="table-tools">
          <input id="case-search" aria-label="Search cases" placeholder="Search case name, ID or hospital…" oninput="BillSaathi.Views.onCaseSearch(this.value)">
          <select aria-label="Filter by case stage" onchange="BillSaathi.Views.onCaseFilter(this.value)">
            <option value="all">All statuses</option>
            ${['Draft', 'Awaiting Documents', 'Processing', 'Needs Review', 'Audit Completed', 'Draft Prepared', 'Ready for Export'].map(x => `<option>${x}</option>`).join('')}
          </select>
          <select aria-label="Sort cases" onchange="BillSaathi.Views.onCaseSort(this.value)">
            <option value="updated">Recently updated</option>
            <option value="amount">Highest amount</option>
            <option value="name">Case name A–Z</option>
          </select>
        </div>
        <div id="cases-result"></div>
      </div>
    `;
  }

  function getFilteredCases() {
    return State.getStore().cases.filter(c =>
      (c.name + ' ' + c.id + ' ' + c.hospital).toLowerCase().includes(searchQuery.toLowerCase()) &&
      (filterStatus === 'all' || c.stage === filterStatus)
    ).sort((a, b) =>
      sortOption === 'amount' ? b.amount - a.amount :
      sortOption === 'name' ? a.name.localeCompare(b.name) :
      b.updated.localeCompare(a.updated)
    );
  }

  function renderCaseTable(list, manage = true) {
    if (!list.length) {
      return `
        <div class="empty">
          ${window.BillSaathi.Icons.get('file')}
          <h3>No cases found</h3>
          <p>Create a case or adjust your search and filters.</p>
          ${btn('Create a case', "BillSaathi.Router.go('new')", 'primary')}
        </div>
      `;
    }

    return `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>CASE / PROVIDER</th>
              <th>BILL AMOUNT</th>
              <th>LAST UPDATED</th>
              <th>CURRENT STAGE</th>
              <th>ACTION</th>
              ${manage ? '<th></th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${list.map(c => `
              <tr>
                <td>
                  <strong>${esc(c.name)}</strong>
                  <small>${esc(c.id)} · ${esc(c.hospital)} ${State.isDemo ? '· Demo Data' : ''}</small>
                </td>
                <td class="money">${money(c.amount)}</td>
                <td>${date(c.updated)}</td>
                <td>${badge(c.stage)}</td>
                <td>${btn('View case', `BillSaathi.Router.go('detail','${c.id}')`, 'text-link')}</td>
                ${manage ? `<td>${btn(window.BillSaathi.Icons.get('trash'), `BillSaathi.Views.deleteCaseModal('${c.id}')`, 'ghost small danger')}</td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function updateCases() {
    const list = getFilteredCases();
    const start = (currentPage - 1) * pageSize;
    const shown = list.slice(start, start + pageSize);
    const container = document.getElementById('cases-result');
    if (!container) return;

    container.innerHTML = (
      caseView === 'table' ? renderCaseTable(shown) : `
        <div class="case-grid padded">
          ${shown.map(c => `
            <div class="card padded">
              ${badge(c.stage)}
              <h3>${esc(c.name)}</h3>
              <p class="muted">${esc(c.id)} · ${esc(c.hospital)}</p>
              <strong>${money(c.amount)}</strong>
              <div class="progressbar"><i style="width:${(c.progress / 7) * 100}%"></i></div>
              <p class="muted">${c.progress} of 7 stages ${State.isDemo ? '· Demo Data' : ''}</p>
              <div class="actions">
                ${btn('Open case', `BillSaathi.Router.go('detail','${c.id}')`, 'primary')}
                ${btn('Delete', `BillSaathi.Views.deleteCaseModal('${c.id}')`, 'danger')}
              </div>
            </div>
          `).join('') || `
            <div class="empty">
              ${window.BillSaathi.Icons.get('file')}
              <h3>No matching cases</h3>
              <p>Adjust your search or status filter.</p>
            </div>
          `}
        </div>
      `
    ) + `
      <div class="table-footer">
        <span>${list.length ? start + 1 : 0}–${Math.min(start + pageSize, list.length)} of ${list.length} cases</span>
        <div class="row">
          <button ${currentPage <= 1 ? 'disabled' : ''} onclick="BillSaathi.Views.changeCasePage(-1)">Previous</button>
          <span>Page ${currentPage}</span>
          <button ${start + pageSize >= list.length ? 'disabled' : ''} onclick="BillSaathi.Views.changeCasePage(1)">Next</button>
        </div>
      </div>
    `;

    document.querySelectorAll('button').forEach(b => {
      if (!b.textContent.trim() && b.innerHTML.includes('svg')) {
        b.setAttribute('aria-label', b.getAttribute('onclick')?.includes('deleteCase') ? 'Delete case' : b.getAttribute('onclick')?.includes('grid') ? 'Grid view' : 'Table view');
      }
    });
  }

  function deleteCaseModal(id) {
    window.BillSaathi.Components.Modal.show('Delete this case?', `
      <p>This removes the case and its documents from this ${State.isDemo ? 'demo' : 'local'} session. It does not delete anything from a server.</p>
    `, btn('Delete case', `BillSaathi.Views.confirmDeleteCase('${id}')`, 'danger'));
  }

  function confirmDeleteCase(id) {
    const s = State.getStore();
    s.docs.filter(d => d.caseId === id).forEach(d => {
      if (State.docUrls.has(d.id)) {
        URL.revokeObjectURL(State.docUrls.get(d.id));
        State.docUrls.delete(d.id);
      }
    });
    s.cases = s.cases.filter(c => c.id !== id);
    s.docs = s.docs.filter(d => d.caseId !== id);
    s.findings = s.findings.filter(f => f.caseId !== id);
    window.BillSaathi.Components.Modal.close();
    BillSaathi.Router.go('cases');
    window.BillSaathi.Components.Toast.show('Case removed from this browser session.');
  }

  window.BillSaathi.Views.casesPage = render;
  window.BillSaathi.Views.renderCaseTable = renderCaseTable;
  window.BillSaathi.Views.updateCases = updateCases;
  window.BillSaathi.Views.deleteCaseModal = deleteCaseModal;
  window.BillSaathi.Views.confirmDeleteCase = confirmDeleteCase;
  window.BillSaathi.Views.setCaseView = v => { caseView = v; updateCases(); };
  window.BillSaathi.Views.onCaseSearch = q => { searchQuery = q; currentPage = 1; updateCases(); };
  window.BillSaathi.Views.onCaseFilter = f => { filterStatus = f; currentPage = 1; updateCases(); };
  window.BillSaathi.Views.onCaseSort = s => { sortOption = s; updateCases(); };
  window.BillSaathi.Views.changeCasePage = delta => { currentPage += delta; updateCases(); };
})();
