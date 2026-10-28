/**
 * Bill Saathi AI - State Management & In-Memory Store
 */
window.BillSaathi = window.BillSaathi || {};

(function () {
  const sampleCases = [
    {
      id: 'BS-1024',
      name: 'Hospital Bill Review — Sample Case',
      hospital: 'Greenfield Care Hospital',
      city: 'Pune',
      amount: 84500,
      date: '2026-10-26',
      updated: '2026-10-27',
      stage: 'Needs Review',
      progress: 3,
      description: 'Review an itemized inpatient bill.',
      insurance: 'Partially insured',
      objectives: ['Check arithmetic and duplicate charges.']
    },
    {
      id: 'BS-1023',
      name: 'Discharge Invoice Check — Demo Case',
      hospital: 'Meadowbrook Medical Center',
      city: 'Jaipur',
      amount: 32600,
      date: '2026-10-23',
      updated: '2026-10-25',
      stage: 'Audit Completed',
      progress: 4,
      description: 'Check discharge invoice entries.',
      insurance: 'Self-paid',
      objectives: ['Understand my hospital bill.']
    },
    {
      id: 'BS-1022',
      name: 'Insurance Settlement Review — Demo Case',
      hospital: 'Willow Health Clinic',
      city: 'Bengaluru',
      amount: 56750,
      date: '2026-10-20',
      updated: '2026-10-24',
      stage: 'Awaiting Documents',
      progress: 1,
      description: 'Organize insurance settlement documents.',
      insurance: 'Insured',
      objectives: ['Understand insurance deductions or rejection.']
    }
  ];

  const sampleDocs = [
    { id: 'DOC-01', caseId: 'BS-1024', name: 'Itemized hospital bill · sample', category: 'Hospital bills and itemized invoices', status: 'Review Required', sample: true, size: 0, page: 1 },
    { id: 'DOC-02', caseId: 'BS-1024', name: 'Discharge summary · sample', category: 'Discharge summaries', status: 'Completed', sample: true, size: 0, page: 1 },
    { id: 'DOC-03', caseId: 'BS-1024', name: 'Payment receipt · sample', category: 'Payment receipts', status: 'Completed', sample: true, size: 0, page: 1 },
    { id: 'DOC-04', caseId: 'BS-1023', name: 'Discharge invoice · sample', category: 'Hospital bills and itemized invoices', status: 'Completed', sample: true, size: 0, page: 1 },
    { id: 'DOC-05', caseId: 'BS-1023', name: 'Prescription · sample', category: 'Prescriptions', status: 'Completed', sample: true, size: 0, page: 1 }
  ];

  const sampleFindings = [
    { id: 'F-01', caseId: 'BS-1024', name: 'Similar diagnostic entries', amount: 2500, why: 'Two CBC entries have matching descriptions and quantities. Confirm the service times before deciding whether these are duplicates.', doc: 'DOC-01', page: 1, status: 'Possible Duplicate', type: 'duplicate' },
    { id: 'F-02', caseId: 'BS-1024', name: 'Subtotal does not match entries', amount: 500, why: 'Illustrative line-item total is ₹84,000; the final billed total is ₹84,500. Ask whether an adjustment or omitted line explains the ₹500 difference.', doc: 'DOC-01', page: 1, status: 'Arithmetic Mismatch', type: 'arithmetic' },
    { id: 'F-03', caseId: 'BS-1024', name: 'Package terms not available', amount: null, why: 'Package documents were not provided. Request the applicable inclusion and exclusion schedule before comparing charges.', doc: 'DOC-01', page: 1, status: 'Information Missing', type: 'package' },
    { id: 'F-04', caseId: 'BS-1023', name: 'Medicine description needs clarification', amount: null, why: 'An abbreviated medicine description needs confirmation against the prescription.', doc: 'DOC-04', page: 1, status: 'Resolved by User', type: 'medical' }
  ];

  let isDemo = true;
  let activeCaseId = 'BS-1024';

  let demoStore = {
    cases: structuredClone(sampleCases),
    docs: structuredClone(sampleDocs),
    findings: structuredClone(sampleFindings),
    notes: {},
    activity: []
  };

  let localStore = {
    cases: [],
    docs: [],
    findings: [],
    notes: {},
    activity: []
  };

  const docBlobUrls = new Map();
  const ocrEdits = {};
  const drafts = {};
  let pendingFiles = [];
  let userPrefs = { name: '', contact: '', language: 'English', notifications: true };

  function getStore() {
    return isDemo ? demoStore : localStore;
  }

  function getCurrentCase() {
    const s = getStore();
    return s.cases.find(c => c.id === activeCaseId) || s.cases[0];
  }

  function getCaseDocs() {
    const cur = getCurrentCase();
    return getStore().docs.filter(d => d.caseId === cur?.id);
  }

  function getCaseFindings() {
    const cur = getCurrentCase();
    return getStore().findings.filter(f => f.caseId === cur?.id);
  }

  function addActivity(text) {
    const cur = getCurrentCase();
    getStore().activity.unshift({
      text,
      caseId: cur?.id,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  window.BillSaathi.State = {
    get isDemo() { return isDemo; },
    set isDemo(val) { isDemo = !!val; },
    get activeId() { return activeCaseId; },
    set activeId(val) { activeCaseId = val; },
    getStore,
    getCurrentCase,
    getDocs: getCaseDocs,
    getFindings: getCaseFindings,
    addActivity,
    docUrls: docBlobUrls,
    ocrEdits,
    drafts,
    get pending() { return pendingFiles; },
    set pending(val) { pendingFiles = val; },
    get prefs() { return userPrefs; },
    set prefs(val) { userPrefs = val; }
  };
})();
