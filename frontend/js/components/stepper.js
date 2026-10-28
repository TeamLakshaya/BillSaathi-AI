/**
 * Bill Saathi AI - 7-Step Progress Stepper & Case Next Action Helper
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Components = window.BillSaathi.Components || {};

(function () {
  const { stages, stageHelp, esc } = window.BillSaathi.Config;

  function render(caseObj) {
    if (!caseObj) return '';
    const p = caseObj.progress;
    return `
      <div class="steps">
        ${stages.map((s, i) => `
          <div class="step ${i < p ? 'done' : i === p ? 'current' : ''}" title="${esc(stageHelp(i))}">
            <div class="step-dot">${i < p ? window.BillSaathi.Icons.get('check') : i + 1}</div>
            ${s.replace(' ', '<br>')}
          </div>
        `).join('')}
      </div>
    `;
  }

  function getNextAction(c) {
    if (!c) return ['Start with a case to organize your bill review.', 'Create a case', 'new'];
    if (c.progress < 2) return ['Add billing and supporting documents.', 'Add documents', 'upload'];
    if (c.progress < 4) return ['Review the bill details and confirm the source information.', 'Review details', 'review'];
    if (c.progress < 5) return ['Organize the documents supporting each finding.', 'Organize evidence', 'evidence'];
    return ['Check your draft and unresolved questions.', 'Review draft', 'complaint'];
  }

  window.BillSaathi.Components.Stepper = {
    render,
    getNextAction
  };
})();
