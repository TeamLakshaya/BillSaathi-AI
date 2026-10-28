/**
 * Bill Saathi AI - Case Creation / Edit Wizard View
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Views = window.BillSaathi.Views || {};

(function () {
  const { esc, btn, money, date, objectiveOptions } = window.BillSaathi.Config;
  const State = window.BillSaathi.State;

  let wizardStep = 1;
  let wizardData = {};

  function render() {
    let edit = !!wizardData.id;
    return `
      <div class="page-heading">
        <div>
          <h1>${edit ? 'Edit your case' : 'Start a new bill review'}</h1>
          <p>A few details will help keep your documents and review organized.</p>
        </div>
      </div>

      <div class="card padded" style="max-width:900px">
        <div class="wizard-top">
          ${['Case information', 'Review objectives', 'Review & create'].map((s, i) => `
            <span class="${wizardStep === i + 1 ? 'active' : wizardStep > i + 1 ? 'complete' : ''}">${i + 1}. ${s}</span>
          `).join('')}
        </div>

        <form id="wizard-form">
          ${wizardStep === 1 ? `
            <div class="form-grid">
              ${field('Case name', 'name', 'text', true)}
              ${field('Hospital or healthcare provider', 'hospital', 'text', true)}
              ${field('Hospital city', 'city')}
              ${field('Total bill amount', 'amount', 'number', true)}
              ${field('Admission date', 'admission', 'date')}
              ${field('Discharge date', 'discharge', 'date')}
              ${field('Bill date', 'date', 'date')}
              <div>
                <label for="insurance">Insurance status</label>
                <select name="insurance" id="insurance">
                  ${['Insured', 'Self-paid', 'Partially insured'].map(v => `<option ${wizardData.insurance === v ? 'selected' : ''}>${v}</option>`).join('')}
                </select>
              </div>
              <div class="wide">
                <label for="description">What would you like to understand?</label>
                <textarea name="description" id="description" placeholder="Describe the bill or the concern in your own words.">${esc(wizardData.description || '')}</textarea>
              </div>
            </div>
          ` : wizardStep === 2 ? `
            <h3 style="font-size:15px;margin-bottom:6px">What would you like to review?</h3>
            <p class="note-text" style="margin-bottom:16px">Select one or more objectives. You can update these later.</p>
            ${objectiveOptions.map(v => `
              <label class="check">
                <input type="checkbox" name="objectives" value="${esc(v)}" ${(wizardData.objectives || []).includes(v) ? 'checked' : ''}>
                ${esc(v)}
              </label>
            `).join('')}
          ` : `
            <h3 style="font-size:15px;margin-bottom:6px">Check your case details</h3>
            <div class="notice">
              ${State.isDemo ? 'This case will be added to the separate demo session. Use fictional details only.' : 'This case stays only in this tab. Refreshing or closing it will clear the workspace.'}
            </div>
            <div class="form-grid">
              ${[
                ['Case name', wizardData.name],
                ['Provider', wizardData.hospital],
                ['City', wizardData.city],
                ['Bill amount', money(wizardData.amount)],
                ['Bill date', date(wizardData.date)],
                ['Insurance', wizardData.insurance]
              ].map(([k, v]) => `
                <div>
                  <label>${k}</label>
                  <span style="font-weight:600">${esc(v || 'Not provided')}</span>
                </div>
              `).join('')}
              <div class="wide">
                <label>Review objectives</label>
                ${(wizardData.objectives || []).map(v => `<p class="note-text">${window.BillSaathi.Icons.get('check')} ${esc(v)}</p>`).join('')}
              </div>
            </div>
          `}
          <p id="wizard-error" class="error" role="alert"></p>
          <div class="actions" style="justify-content:space-between;margin-top:24px">
            ${wizardStep > 1 ? btn('Back', 'BillSaathi.Views.stepBackWizard()') : btn('Cancel', "BillSaathi.Router.go('cases')")}
            <button type="submit" class="primary">
              ${wizardStep < 3 ? 'Continue' : edit ? 'Save case locally' : 'Create case locally'} ${window.BillSaathi.Icons.get('arrow')}
            </button>
          </div>
        </form>
        <p class="inline-note">No backend is connected. Progress is retained only while this tab remains open.</p>
      </div>
    `;
  }

  function field(label, key, type = 'text', required = false) {
    return `
      <div>
        <label for="f-${key}">${label}${required ? ' *' : ''}</label>
        <input id="f-${key}" name="${key}" type="${type}" ${required ? 'required' : ''} ${type === 'number' ? 'min="0" step="0.01"' : ''} value="${esc(wizardData[key] || '')}">
      </div>
    `;
  }

  function bindWizard() {
    const form = document.getElementById('wizard-form');
    if (!form) return;

    form.onsubmit = e => {
      e.preventDefault();
      let data = new FormData(e.target);
      if (wizardStep === 1) {
        Object.assign(wizardData, Object.fromEntries(data));
        wizardData.amount = Number(wizardData.amount);
        if (wizardData.admission && wizardData.discharge && wizardData.discharge < wizardData.admission) {
          document.getElementById('wizard-error').textContent = 'Discharge date must not be before admission date.';
          return;
        }
        wizardStep = 2;
        BillSaathi.Router.render();
      } else if (wizardStep === 2) {
        wizardData.objectives = data.getAll('objectives');
        if (!wizardData.objectives.length) {
          document.getElementById('wizard-error').textContent = 'Select at least one review objective.';
          return;
        }
        wizardStep = 3;
        BillSaathi.Router.render();
      } else {
        let edit = !!wizardData.id;
        let id = wizardData.id || 'LOCAL-' + Date.now().toString().slice(-6);
        let c = {
          ...wizardData,
          id,
          updated: new Date().toISOString().slice(0, 10),
          stage: wizardData.stage || 'Awaiting Documents',
          progress: wizardData.progress || 1
        };
        const s = State.getStore();
        if (edit) s.cases = s.cases.map(x => x.id === id ? c : x);
        else s.cases.unshift(c);
        State.activeId = id;
        State.addActivity(edit ? 'Case details updated locally' : 'Case created locally');
        wizardData = {};
        wizardStep = 1;
        BillSaathi.Router.go('detail', id);
        window.BillSaathi.Components.Toast.show('Case saved in this tab. No server request was made.');
      }
    };
  }

  function resetWizard() {
    wizardData = {};
    wizardStep = 1;
  }

  window.BillSaathi.Views.newPage = render;
  window.BillSaathi.Views.bindWizard = bindWizard;
  window.BillSaathi.Views.resetWizard = resetWizard;
  window.BillSaathi.Views.stepBackWizard = () => { wizardStep--; BillSaathi.Router.render(); };
  window.BillSaathi.Views.wizardData = wizardData;
  window.BillSaathi.Views.wizardStep = wizardStep;
})();
