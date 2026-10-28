/**
 * Bill Saathi AI - Configuration, Constants & Helpers
 */
window.BillSaathi = window.BillSaathi || {};

(function () {
  const navs = [
    ['overview', 'Overview'],
    ['cases', 'My Cases'],
    ['new', 'Create New Case'],
    ['upload', 'Upload Documents'],
    ['audit', 'Bill Audit'],
    ['price', 'Price Verification'],
    ['evidence', 'Evidence Center'],
    ['reports', 'Reports & Evidence'],
    ['complaint', 'Complaint & Resolution Assistant'],
    ['help', 'Help & Support'],
    ['settings', 'Settings']
  ];

  const stages = [
    'Case Created',
    'Documents Uploaded',
    'Information Reviewed',
    'Bill Audit Completed',
    'Evidence Organized',
    'Complaint Draft Prepared',
    'Final Review'
  ];

  const categories = [
    'Hospital bills and itemized invoices',
    'Payment receipts',
    'Prescriptions',
    'Diagnostic reports',
    'Discharge summaries',
    'Pharmacy invoices',
    'Insurance settlement letters',
    'Insurance rejection letters',
    'Hospital package or estimate documents',
    'Other supporting documents'
  ];

  const objectiveOptions = [
    'Understand my hospital bill.',
    'Check arithmetic and duplicate charges.',
    'Compare billed items with medical documents.',
    'Review package inclusions and exclusions.',
    'Understand insurance deductions or rejection.',
    'Check applicable pricing references.',
    'Organize evidence for a complaint.'
  ];

  function stageHelp(i) {
    return [
      'Add your case details.',
      'Select billing and medical documents.',
      'Confirm extracted fields and source references.',
      'Connect the audit service or inspect sample findings.',
      'Link documents and record notes.',
      'Prepare and edit a factual draft.',
      'Review every claim and unresolved question.'
    ][i];
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function money(n) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(n) || 0);
  }

  function date(s) {
    return s ? new Date(s + 'T12:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : 'Not provided';
  }

  function badge(text) {
    const color = /Completed|Resolved|Ready|Reviewed/.test(text) ? 'teal' :
                  /Review|Mismatch|Duplicate|Missing/.test(text) ? 'amber' :
                  /Failed/.test(text) ? 'red' : 'blue';
    return `<span class="badge ${color}">${esc(text)}</span>`;
  }

  function btn(label, action, cls = '', ico = '') {
    const iconHtml = ico ? window.BillSaathi.Icons.get(ico) : '';
    return `<button class="${cls}" onclick="${action}">${iconHtml}${label}</button>`;
  }

  window.BillSaathi.Config = {
    navs,
    stages,
    categories,
    objectiveOptions,
    stageHelp,
    esc,
    money,
    date,
    badge,
    btn
  };
})();
