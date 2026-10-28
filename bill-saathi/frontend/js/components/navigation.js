/**
 * Bill Saathi AI - Navigation Component (Sidebar, Topbar & Menus)
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Components = window.BillSaathi.Components || {};

(function () {
  const { navs, esc, btn } = window.BillSaathi.Config;
  const { icon } = window.BillSaathi.Icons;
  const State = window.BillSaathi.State;

  function renderSidebar(route) {
    const isDemo = State.isDemo;
    const sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) return;

    sidebarEl.innerHTML = `
      <div class="brand">
        <span class="brand-mark">${window.BillSaathi.Icons.get('audit')}</span>
        <span class="brand-copy">Bill Saathi <span style="color:var(--teal)">AI</span><small>YOUR PATIENT ALLY</small></span>
      </div>
      <div class="nav-label">WORKSPACE</div>
      <nav class="nav" aria-label="Main navigation">
        ${navs.map(([r, l]) => `
          <div class="${r === 'help' ? 'separate' : ''}">
            ${btn(`<span>${l}</span>`, `BillSaathi.Router.go('${r}')`, route === r || (r === 'cases' && route === 'detail') || (r === 'reports' && (route === 'reports' || route === 'affidavit')) ? 'active' : '', r === 'new' ? 'plus' : r)}
          </div>
        `).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="profile">
          <span class="avatar">${isDemo ? 'DP' : 'LW'}</span>
          <div class="profile-copy">
            <strong>${isDemo ? 'Demo patient' : 'Local workspace'}</strong>
            <small>${isDemo ? 'Sample account' : 'Session only · not signed in'}</small>
          </div>
        </div>
        ${btn(`${window.BillSaathi.Icons.get('left')}<span class="collapse-label">Collapse sidebar</span>`, "document.body.classList.toggle('collapsed')", 'collapse-btn')}
      </div>
    `;
  }

  function renderTopbar(route) {
    const isDemo = State.isDemo;
    const topbarEl = document.getElementById('topbar');
    if (!topbarEl) return;

    let title = route === 'review' ? 'Document Review' :
                route === 'detail' ? 'Case Workspace' :
                navs.find(x => x[0] === route)?.[1] || 'Overview';

    topbarEl.innerHTML = `
      ${btn(window.BillSaathi.Icons.get('menu'), "document.body.classList.toggle('mobile-open')", 'icon-btn mobile-toggle')}
      <div class="crumb">
        <strong>${title}</strong>
        Workspace <span style="margin:0 4px;color:#bcc6d2">/</span> ${title}
      </div>
      <form class="top-search" onsubmit="event.preventDefault();BillSaathi.Router.globalSearch(this.q.value)">
        ${window.BillSaathi.Icons.get('search')}
        <input name="q" aria-label="Search cases or documents" placeholder="Search cases or documents…">
      </form>
      <div class="top-actions">
        ${btn(window.BillSaathi.Icons.get('bell'), 'BillSaathi.Components.Navigation.notifications()', 'ghost icon-btn')}
        ${btn(window.BillSaathi.Icons.get('help'), "BillSaathi.Router.go('help')", 'ghost icon-btn help-top')}
        <button class="avatar" onclick="BillSaathi.Components.Navigation.profileMenu()" aria-label="Profile menu">${isDemo ? 'DP' : 'LW'}</button>
        ${btn('New Case', "BillSaathi.Views.resetWizard();BillSaathi.Router.go('new')", 'primary', 'plus')}
      </div>
    `;

    document.querySelector('.mobile-toggle')?.setAttribute('aria-label', 'Open navigation');
    document.querySelector('.top-actions button')?.setAttribute('aria-label', 'Notifications');
  }

  function profileMenu() {
    const isDemo = State.isDemo;
    window.BillSaathi.Components.Modal.show('Your workspace', `
      <p>${isDemo ? 'You are exploring a fictional demonstration account.' : 'This is an unsigned local browser session.'} Authentication and cloud storage are not connected.</p>
    `, btn('Open settings', "BillSaathi.Components.Modal.close();BillSaathi.Router.go('settings')", 'primary'));
  }

  function notifications() {
    const cases = State.getStore().cases;
    const list = State.prefs.notifications ? cases.filter(c => c.stage === 'Needs Review' || c.stage === 'Awaiting Documents') : [];
    window.BillSaathi.Components.Modal.show('Your next steps', list.length ? list.map(c => `
      <p><strong>${esc(c.id)}</strong> · ${esc(c.stage)}<br>
      <span class="muted">${c.stage === 'Needs Review' ? 'Confirm extracted details before continuing.' : 'Add the documents needed for this case.'}</span></p>
    `).join('') : '<p>No pending case notifications.</p>');
  }

  function switchMode() {
    const isDemo = State.isDemo;
    window.BillSaathi.Components.Modal.show('Switch workspace', `
      <p>${isDemo ? 'Open an empty, session-only workspace. No real data is sent to a server.' : 'Return to fictional demonstration records.'} Your current session is retained separately until you reload the page.</p>
    `, btn('Switch workspace', "BillSaathi.State.isDemo = !BillSaathi.State.isDemo; BillSaathi.State.drafts = {}; BillSaathi.State.activeId = BillSaathi.State.getStore().cases[0]?.id; BillSaathi.Components.Modal.close(); BillSaathi.Router.go('overview')", 'primary'));
  }

  function caseSelector() {
    const cases = State.getStore().cases;
    const cur = State.getCurrentCase();
    return cases.length ? `
      <label class="sr-only" for="active-case">Active case</label>
      <select id="active-case" class="page-selector" onchange="BillSaathi.State.activeId = this.value; BillSaathi.Router.render()">
        ${cases.map(c => `<option value="${esc(c.id)}" ${cur?.id === c.id ? 'selected' : ''}>${esc(c.id)} · ${esc(c.name)}</option>`).join('')}
      </select>
    ` : '';
  }

  window.BillSaathi.Components.Navigation = {
    renderSidebar,
    renderTopbar,
    profileMenu,
    notifications,
    switchMode,
    caseSelector
  };
})();
