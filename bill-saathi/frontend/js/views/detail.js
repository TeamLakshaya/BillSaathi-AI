/**
 * Bill Saathi AI - Case Detail View
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Views = window.BillSaathi.Views || {};

(function () {
  const { esc, btn, badge, money, date } = window.BillSaathi.Config;
  const State = window.BillSaathi.State;
  const Stepper = window.BillSaathi.Components.Stepper;

  function render() {
    const c = State.getCurrentCase();
    if (!c) {
      return `
        <div class="empty">
          ${window.BillSaathi.Icons.get('file')}
          <h3>No case selected</h3>
          <p>Create a case to begin.</p>
          ${btn('Create a case', "BillSaathi.Router.go('new')", 'primary')}
        </div>
      `;
    }

    return `
      <div class="page-heading">
        <div>
          <h1>${esc(c.name)}</h1>
          <p>${esc(c.id)} · ${esc(c.hospital)} ${State.isDemo ? '· Demo Data' : ''}</p>
        </div>
        ${btn('Edit case', "BillSaathi.Views.editCase()", '', 'edit')}
      </div>

      <div class="stats">
        ${[
          ['Bill amount', money(c.amount)],
          ['Documents', State.getDocs().length],
          ['Findings', State.getFindings().length],
          ['Current stage', c.stage]
        ].map(([t, v]) => `
          <div class="card stat">
            <div class="stat-head">${t}</div>
            <div style="font-size:22px;font-weight:700;margin-top:12px">${esc(v)}</div>
          </div>
        `).join('')}
      </div>

      <section class="card">
        <div class="card-head">
          <div>
            <h2>Case progress</h2>
            <p>Hover over a stage to see what it involves.</p>
          </div>
          ${badge(c.stage)}
        </div>
        ${Stepper.render(c)}
        <div class="next-step">
          ${window.BillSaathi.Icons.get('info')}
          <span>${esc(Stepper.getNextAction(c)[0])}</span>
          ${btn(Stepper.getNextAction(c)[1], `BillSaathi.Router.go('${Stepper.getNextAction(c)[2]}')`, 'primary')}
        </div>
      </section>

      <div class="space"></div>

      <div class="two-col">
        <section class="card padded">
          <h3>Case information</h3>
          <p class="note-text" style="margin-top:8px">${esc(c.description || 'No description provided.')}</p>
          <p class="note-text" style="margin-top:12px">
            Hospital city: ${esc(c.city || 'Not provided')}<br>
            Bill date: ${date(c.date)}<br>
            Admission: ${date(c.admission)}<br>
            Discharge: ${date(c.discharge)}<br>
            Insurance: ${esc(c.insurance)}
          </p>
          <h4 style="margin-top:18px">Review objectives</h4>
          <div style="margin-top:8px">
            ${(c.objectives || []).map(o => `
              <p class="note-text" style="margin-bottom:6px">
                ${window.BillSaathi.Icons.get('check')} ${esc(o)}
              </p>
            `).join('')}
          </div>
        </section>

        <section class="card padded">
          <h3>Your next actions</h3>
          <div class="stack" style="margin-top:16px">
            ${[
              ['upload', 'Upload supporting documents'],
              ['audit', 'Inspect audit findings'],
              ['price', 'Check price references'],
              ['evidence', 'Organize evidence'],
              ['complaint', 'Prepare a complaint draft'],
              ['reports', 'Review available exports']
            ].map(([r, l]) => btn(l, `BillSaathi.Router.go('${r}')`, '', 'arrow')).join('')}
          </div>
        </section>
      </div>
    `;
  }

  function editCase() {
    const cur = State.getCurrentCase();
    if (cur) {
      BillSaathi.Views.wizardData = { ...cur };
      BillSaathi.Views.wizardStep = 1;
      BillSaathi.Router.go('new');
    }
  }

  window.BillSaathi.Views.detailPage = render;
  window.BillSaathi.Views.editCase = editCase;
})();
