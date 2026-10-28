/**
 * Bill Saathi AI - Accessible Modal & Unavailable Dialog Component
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Components = window.BillSaathi.Components || {};

(function () {
  const { esc, btn } = window.BillSaathi.Config;

  function show(title, body, actions = '') {
    const d = document.getElementById('dialog');
    if (!d) return;
    d.innerHTML = `
      <h2>${esc(title)}</h2>
      ${body}
      <div class="actions">
        ${btn('Close', "BillSaathi.Components.Modal.close()")}
        ${actions}
      </div>
    `;
    if (!d.open) d.showModal();
  }

  function close() {
    const d = document.getElementById('dialog');
    if (d && d.open) d.close();
  }

  function unavailable(feature, endpoint) {
    show(feature + ' is not connected', `
      <p>This frontend has no connected backend for ${esc(feature.toLowerCase())}. Nothing has been submitted or processed.</p>
      <div class="notice" style="margin:14px 0">
        <strong>Proposed integration point</strong><br>
        <code>${esc(endpoint)}</code>
      </div>
      <p class="note-text">These are proposed API contracts, not existing endpoints. See the included integration guide.</p>
    `);
  }

  window.BillSaathi.Components.Modal = {
    show,
    close,
    unavailable
  };
})();
