/**
 * Bill Saathi AI - Price Verification View
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Views = window.BillSaathi.Views || {};

(function () {
  const { btn, badge, money } = window.BillSaathi.Config;
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

    return `
      <div class="page-heading">
        <div>
          <h1>Price verification</h1>
          <p>Compare only against documented, applicable references.</p>
        </div>
        ${BillSaathi.Components.Navigation.caseSelector()}
      </div>

      <div class="notice warning">
        ${window.BillSaathi.Icons.get('warning')}
        <span>A price difference does not automatically establish overcharging. Applicability can depend on the location, date, procedure, room category, insurance contract and other conditions.</span>
      </div>

      <section class="card">
        <div class="card-head">
          <div>
            <h2>Reference comparisons</h2>
            <p>No official rates or source links have been fabricated.</p>
          </div>
          ${btn('Connect reference lookup', "BillSaathi.Components.Modal.unavailable('Reference lookup','GET /api/cases/:id/price-references')")}
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                ${['BILLED ITEM', 'BILLED AMOUNT', 'REFERENCE / DIFFERENCE', 'SOURCE / EFFECTIVE DATE', 'APPLICABILITY', 'STATUS'].map(t => `<th>${t}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Case bill total</td>
                <td class="money">${money(cur.amount)}</td>
                <td>Not available</td>
                <td>No verified source</td>
                <td>Not established</td>
                <td>${badge('Reference Check Needed')}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="empty">
          ${window.BillSaathi.Icons.get('file')}
          <h3>No applicable verified reference found.</h3>
          <p>Upload package documents, policy terms or a documented contractual price schedule. A suitable reference must be checked for applicability.</p>
          ${btn('Add reference documents', "BillSaathi.Router.go('upload')", 'primary')}
        </div>
      </section>

      <div class="space"></div>

      <div class="card padded">
        <h3 style="font-size:14px;font-weight:700;margin-bottom:12px">What makes a useful reference?</h3>
        <div class="two-col">
          <p class="note-text">An applicable government notification or official rate with a verifiable source and effective date.<br><br>Uploaded hospital package terms or contractual price schedules.</p>
          <p class="note-text">Insurance policy and settlement conditions matching your specific case.<br><br>Do not substitute a generic internet price for a verified applicable reference.</p>
        </div>
      </div>
    `;
  }

  window.BillSaathi.Views.pricePage = render;
})();
