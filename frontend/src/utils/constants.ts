import { MedicalCase, DocumentRecord, AuditFinding } from '../types';

export const navs: [string, string, string][] = [
  ['overview', 'Overview', 'overview'],
  ['cases', 'My Cases', 'cases'],
  ['new', 'Create New Case', 'plus'],
  ['upload', 'Upload Documents', 'upload'],
  ['audit', 'Bill Audit', 'audit'],
  ['price', 'Price Verification', 'price'],
  ['evidence', 'Evidence Center', 'evidence'],
  ['reports', 'Reports & Evidence', 'reports'],
  ['complaint', 'Complaint & Resolution Assistant', 'complaint'],
  ['help', 'Help & Support', 'help'],
  ['settings', 'Settings', 'settings']
];

export const stages = [
  'Case Created',
  'Documents Uploaded',
  'Information Reviewed',
  'Bill Audit Completed',
  'Evidence Organized',
  'Complaint Draft Prepared',
  'Final Review'
];

export const categories = [
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

export const objectiveOptions = [
  'Understand my hospital bill.',
  'Check arithmetic and duplicate charges.',
  'Compare billed items with medical documents.',
  'Review package inclusions and exclusions.',
  'Understand insurance deductions or rejection.',
  'Check applicable pricing references.',
  'Organize evidence for a complaint.'
];

export const sampleCases: MedicalCase[] = [
  {
    id: 'BS-1024',
    name: 'Hospital Bill Review — Sample Case',
    hospital: 'Greenfield Care Hospital',
    city: 'Pune',
    amount: 84500,
    currency: 'INR',
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
    currency: 'INR',
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
    currency: 'INR',
    date: '2026-10-20',
    updated: '2026-10-24',
    stage: 'Awaiting Documents',
    progress: 1,
    description: 'Organize insurance settlement documents.',
    insurance: 'Insured',
    objectives: ['Understand insurance deductions or rejection.']
  }
];

export const sampleDocs: DocumentRecord[] = [
  { id: 'DOC-01', caseId: 'BS-1024', name: 'Itemized hospital bill · sample', category: 'Hospital bills and itemized invoices', status: 'Review Required', sample: true, size: 0, page: 1 },
  { id: 'DOC-02', caseId: 'BS-1024', name: 'Discharge summary · sample', category: 'Discharge summaries', status: 'Completed', sample: true, size: 0, page: 1 },
  { id: 'DOC-03', caseId: 'BS-1024', name: 'Payment receipt · sample', category: 'Payment receipts', status: 'Completed', sample: true, size: 0, page: 1 },
  { id: 'DOC-04', caseId: 'BS-1023', name: 'Discharge invoice · sample', category: 'Hospital bills and itemized invoices', status: 'Completed', sample: true, size: 0, page: 1 },
  { id: 'DOC-05', caseId: 'BS-1023', name: 'Prescription · sample', category: 'Prescriptions', status: 'Completed', sample: true, size: 0, page: 1 }
];

export const sampleFindings: AuditFinding[] = [
  { id: 'F-01', caseId: 'BS-1024', name: 'Similar diagnostic entries', amount: 2500, why: 'Two CBC entries have matching descriptions and quantities. Confirm the service times before deciding whether these are duplicates.', doc: 'DOC-01', page: 1, status: 'Possible Duplicate', type: 'duplicate' },
  { id: 'F-02', caseId: 'BS-1024', name: 'Subtotal does not match entries', amount: 500, why: 'Illustrative line-item total is ₹84,000; the final billed total is ₹84,500. Ask whether an adjustment or omitted line explains the ₹500 difference.', doc: 'DOC-01', page: 1, status: 'Arithmetic Mismatch', type: 'arithmetic' },
  { id: 'F-03', caseId: 'BS-1024', name: 'Package terms not available', amount: null, why: 'Package documents were not provided. Request the applicable inclusion and exclusion schedule before comparing charges.', doc: 'DOC-01', page: 1, status: 'Information Missing', type: 'package' },
  { id: 'F-04', caseId: 'BS-1023', name: 'Medicine description needs clarification', amount: null, why: 'An abbreviated medicine description needs confirmation against the prescription.', doc: 'DOC-04', page: 1, status: 'Resolved by User', type: 'medical' }
];
