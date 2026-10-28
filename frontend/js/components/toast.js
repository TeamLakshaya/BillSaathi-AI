/**
 * Bill Saathi AI - Toast Notification Component
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Components = window.BillSaathi.Components || {};

(function () {
  const { esc } = window.BillSaathi.Config;
  let toastTimer = null;

  function show(text) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    root.innerHTML = `<div class="toast">${esc(text)}</div>`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      root.innerHTML = '';
    }, 4500);
  }

  window.BillSaathi.Components.Toast = {
    show
  };
})();
