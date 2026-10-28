/**
 * Bill Saathi AI - Main Application Controller & Router
 */
window.BillSaathi = window.BillSaathi || {};

(function () {
  const State = window.BillSaathi.State;
  const Navigation = window.BillSaathi.Components.Navigation;
  const Views = window.BillSaathi.Views;

  let currentRoute = 'overview';

  const viewRegistry = {
    overview: Views.overview,
    cases: Views.casesPage,
    new: Views.newPage,
    upload: Views.uploadPage,
    review: Views.reviewPage,
    audit: Views.auditPage,
    price: Views.pricePage,
    evidence: Views.evidencePage,
    complaint: () => Views.draftPage('complaint'),
    affidavit: () => Views.draftPage('affidavit'),
    reports: Views.reportsPage,
    help: Views.helpPage,
    settings: Views.settingsPage,
    detail: Views.detailPage
  };

  function go(route, id) {
    currentRoute = route;
    if (id) State.activeId = id;
    document.body.classList.remove('mobile-open');
    location.hash = route;
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    const s = State.getStore();
    if (!s.cases.find(c => c.id === State.activeId)) {
      State.activeId = s.cases[0]?.id;
    }

    // Render Navigation
    Navigation.renderSidebar(currentRoute);
    Navigation.renderTopbar(currentRoute);

    // Render Main View
    const mainEl = document.getElementById('main');
    if (!mainEl) return;

    const isDemo = State.isDemo;
    const viewFn = viewRegistry[currentRoute] || Views.overview;

    mainEl.innerHTML = `
      <div class="demo-banner">
        ${window.BillSaathi.Icons.get(isDemo ? 'info' : 'lock')}
        <span><strong>${isDemo ? 'Demo Data — Not a Real Patient Record' : 'Local workspace — No backend connected'}</strong> ${isDemo ? 'Fictional records and illustrative audit results.' : 'Files stay in this browser tab. OCR, server upload and AI auditing are unavailable.'}</span>
        ${window.BillSaathi.Config.btn(isDemo ? 'Use empty workspace' : 'Explore demo', 'BillSaathi.Components.Navigation.switchMode()')}
      </div>
      ${viewFn()}
      <footer class="footer">
        <span>${window.BillSaathi.Icons.get('shield')} Designed around clarity, evidence and your privacy.</span>
        <span>Bill Saathi AI · Patient assistance workspace</span>
      </footer>
    `;

    // Post-render attachments
    if (currentRoute === 'upload' && document.getElementById('dropzone')) {
      Views.wireDrop();
    }
    if (currentRoute === 'new') {
      Views.bindWizard();
    }
    if (currentRoute === 'evidence' && document.getElementById('evidence-table')) {
      Views.updateEvidence();
    }
    if (currentRoute === 'cases') {
      Views.updateCases();
    }
  }

  function globalSearch(q) {
    go('cases');
    const el = document.getElementById('case-search');
    if (el) el.value = q;
    Views.onCaseSearch(q);
  }

  // Event Listeners
  window.addEventListener('hashchange', () => {
    let r = location.hash.slice(1);
    if (r && r !== currentRoute) {
      currentRoute = r;
      render();
    }
  });

  const dialogEl = document.getElementById('dialog');
  if (dialogEl) {
    dialogEl.addEventListener('click', e => {
      if (e.target === e.currentTarget) {
        let b = e.currentTarget.getBoundingClientRect();
        if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) {
          e.currentTarget.close();
        }
      }
    });
  }

  window.addEventListener('beforeunload', () => {
    State.docUrls.forEach(u => URL.revokeObjectURL(u));
  });

  // Export Router
  window.BillSaathi.Router = {
    go,
    render,
    globalSearch,
    get currentRoute() { return currentRoute; }
  };

  // Initial Boot
  document.addEventListener('DOMContentLoaded', () => {
    currentRoute = location.hash.slice(1) || 'overview';
    render();
  });

  // If already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    currentRoute = location.hash.slice(1) || 'overview';
    render();
  }
})();
