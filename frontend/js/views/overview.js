/**
 * Bill Saathi AI - Overview Dashboard View
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Views = window.BillSaathi.Views || {};

(function () {
  const { esc, btn, badge } = window.BillSaathi.Config;
  const State = window.BillSaathi.State;
  const Stepper = window.BillSaathi.Components.Stepper;

  let overviewSearchQuery = '';
  let overviewFilterStatus = 'all';

  function render() {
    const s = State.getStore();
    const c = State.getCurrentCase();
    const isDemo = State.isDemo;
    const unresolved = s.findings.filter(f => f.status !== 'Resolved by User').length;

    return `
      <section class="welcome">
        <div>
          <div class="eyebrow">YOUR MEDICAL BILL WORKSPACE</div>
          <h1>Welcome back!</h1>
          <p>Manage your medical bills, review possible discrepancies, and organize your supporting documents in one place.</p>
        </div>
        <div class="actions">
          ${btn('Start New Bill Review', "BillSaathi.Views.resetWizard();BillSaathi.Router.go('new')", 'primary', 'plus')}
          ${btn('View My Cases', "BillSaathi.Router.go('cases')")}
        </div>
      </section>

      <div class="stats">
        ${[
          ['Total Cases', s.cases.length, 'cases', 'All your reviews, in one place'],
          ['Documents Uploaded', s.docs.length, 'file', isDemo ? 'Fictional sample documents' : 'Local selections · not server uploads'],
          ['Bills Reviewed', s.cases.filter(x => x.progress >= 4).length, 'audit', isDemo ? 'Illustrative completed audit' : 'Confirmed completed audits'],
          ['Potential Issues Flagged', unresolved, 'warning', 'Findings that need a closer look']
        ].map(([t, n, i, f], j) => `
          <div class="card stat">
            <div class="stat-head">
              ${t}
              <span class="icon-box ${j === 2 ? 'teal' : j === 3 ? 'amber' : ''}">${window.BillSaathi.Icons.get(i)}</span>
            </div>
            <div class="stat-number">${n.toString().padStart(2, '0')}</div>
            <div class="stat-foot">${f} ${isDemo ? '<span>· Sample</span>' : ''}</div>
          </div>
        `).join('')}
      </div>

      <div class="grid-main">
        <div class="stack">
          <!-- Stepper Card -->
          <section class="card">
            <div class="card-head">
              <div>
                <h2>Your case, one step at a time</h2>
                <p>A clear path from your first bill to an informed next step.</p>
              </div>
              ${c ? badge('In progress') : ''}
            </div>
            ${c ? `
              <div class="case-strip">
                <div>
                  <strong>${esc(c.name)}</strong>
                  <small>${c.id} <span style="margin:0 5px">·</span> ${esc(c.hospital)} ${isDemo ? '· Demo Data' : ''}</small>
                </div>
                ${btn('View case', "BillSaathi.Router.go('detail')", 'text-link', 'chevron')}
              </div>
              ${Stepper.render(c)}
              <div class="next-step">
                ${window.BillSaathi.Icons.get('info')}
                <span><strong>Next step:</strong> ${esc(Stepper.getNextAction(c)[0])}</span>
                ${btn(Stepper.getNextAction(c)[1], `BillSaathi.Router.go('${Stepper.getNextAction(c)[2]}')`, 'primary')}
              </div>
            ` : `
              <div class="empty">
                ${window.BillSaathi.Icons.get('file')}
                <h3>No cases yet</h3>
                <p>Start with a case to organize your bill review.</p>
                ${btn('Create a case', "BillSaathi.Router.go('new')", 'primary')}
              </div>
            `}
          </section>

          <!-- Recent Cases Table Card -->
          <section class="card">
            <div class="card-head">
              <div>
                <h2>Recent cases</h2>
                <p>Your latest medical bill reviews.</p>
              </div>
              ${btn('View all cases', "BillSaathi.Router.go('cases')", 'text-link', 'arrow')}
            </div>
            <div class="table-tools">
              <input aria-label="Search recent cases" placeholder="Search by case name or ID…" oninput="BillSaathi.Views.overviewSearch(this.value)">
              <select aria-label="Filter recent cases" onchange="BillSaathi.Views.overviewFilter(this.value)">
                <option value="all">All statuses</option>
                <option>Needs Review</option>
                <option>Audit Completed</option>
                <option>Awaiting Documents</option>
              </select>
            </div>
            <div id="overview-table">
              ${BillSaathi.Views.renderCaseTable(filteredRecentCases(), false)}
            </div>
            <div class="table-footer">
              <span>${s.cases.length} ${isDemo ? 'sample ' : ''}cases in your workspace</span>
              ${btn('Manage cases', "BillSaathi.Router.go('cases')", 'text-link')}
            </div>
          </section>
        </div>

        <div class="stack">
          <!-- Attention Widget -->
          <section class="card aside-card">
            <div class="card-head">
              <h2>Needs your attention</h2>
              ${window.BillSaathi.Icons.get('bell')}
            </div>
            <div class="aside-content">
              ${c && State.getDocs().some(d => d.status === 'Review Required') ? `
                <div class="alert-item">
                  ${window.BillSaathi.Icons.get('warning')}
                  <div>
                    <strong>Bill details need confirmation</strong>
                    <p>Review extracted information before continuing with your audit.</p>
                    ${btn('Review documents', "BillSaathi.Router.go('review')", 'text-link', 'arrow')}
                  </div>
                </div>
              ` : ''}
              ${unresolved ? `
                <div class="alert-item">
                  ${window.BillSaathi.Icons.get('search')}
                  <div>
                    <strong>${unresolved} findings to review</strong>
                    <p>Check the source documents. A flag is a question, not a conclusion.</p>
                    ${btn('Explore findings', "BillSaathi.Router.go('audit')", 'text-link', 'arrow')}
                  </div>
                </div>
              ` : '<p class="note-text">No unresolved findings in this workspace.</p>'}
            </div>
          </section>

          <!-- Recent Activity Feed -->
          <section class="card aside-card">
            <div class="card-head">
              <h2>Recent activity</h2>
              ${isDemo ? '<span class="badge gray">Sample</span>' : ''}
            </div>
            <div class="aside-content">
              ${activityFeedHtml()}
            </div>
          </section>

          <!-- Guidance Tip Card -->
          <section class="card tip">
            <h3>${window.BillSaathi.Icons.get('shield')} A little clarity goes a long way.</h3>
            <p>A flagged charge doesn't always mean an error. Review the supporting documents and ask your provider for clarification.</p>
            ${btn('Understand your bill', "BillSaathi.Router.go('help')", 'text-link', 'arrow')}
          </section>
        </div>
      </div>

      <div class="privacy-footer">Understand Your Bill. Verify the Charges. Know Your Next Step.</div>
    `;
  }

  function filteredRecentCases() {
    const cases = State.getStore().cases;
    return cases.filter(c =>
      (c.name + ' ' + c.id + ' ' + c.hospital).toLowerCase().includes(overviewSearchQuery.toLowerCase()) &&
      (overviewFilterStatus === 'all' || c.stage === overviewFilterStatus)
    ).slice(0, 3);
  }

  function overviewSearch(q) {
    overviewSearchQuery = q;
    const el = document.getElementById('overview-table');
    if (el) el.innerHTML = BillSaathi.Views.renderCaseTable(filteredRecentCases(), false);
  }

  function overviewFilter(v) {
    overviewFilterStatus = v;
    overviewSearch(overviewSearchQuery);
  }

  function activityFeedHtml() {
    let a = [...State.getStore().activity];
    if (State.isDemo) {
      a.push(
        { text: 'Possible duplicate charge flagged', time: 'Sample · 27 Oct 2026' },
        { text: 'Bill details ready for review', time: 'Sample · 27 Oct 2026' },
        { text: 'Sample documents added', time: 'Sample · 26 Oct 2026' }
      );
    }
    return a.length ? a.slice(0, 4).map((x, i) => `
      <div class="activity">
        <div class="activity-icon">${window.BillSaathi.Icons.get(i ? 'file' : 'audit')}</div>
        <div>
          <strong>${esc(x.text)}</strong>
          <small>${esc(x.time)}</small>
        </div>
      </div>
    `).join('') : '<p class="note-text">Activity will appear as you work on your cases.</p>';
  }

  window.BillSaathi.Views.overview = render;
  window.BillSaathi.Views.overviewSearch = overviewSearch;
  window.BillSaathi.Views.overviewFilter = overviewFilter;
})();
