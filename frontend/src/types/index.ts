/**
 * Bill Saathi AI - Type Definitions
 */

export type CaseStage =
  | 'Draft'
  | 'Awaiting Documents'
  | 'Processing'
  | 'Needs Review'
  | 'Audit Completed'
  | 'Draft Prepared'
  | 'Ready for Export';

export interface MedicalCase {
  id: string;
  name: string;
  hospital: string;
  city?: string;
  amount: number;
  currency?: 'INR';
  stage: CaseStage;
  progress: number;
  date?: string;
  admission?: string;
  discharge?: string;
  updated: string;
  description?: string;
  insurance?: 'Insured' | 'Self-paid' | 'Partially insured' | string;
  objectives: string[];
}

export interface DocumentRecord {
  id: string;
  caseId: string;
  name: string;
  category: string;
  status: 'Uploaded' | 'Processing' | 'Review Required' | 'Completed' | 'Failed' | 'Selected locally' | 'Reviewed locally';
  sample?: boolean;
  size?: number;
  page?: number;
  type?: string;
  confirmed?: boolean;
  sourcePages?: number[];
  error?: string;
}

export interface ExtractedField {
  key: string;
  value: string | number | null;
  origin: 'ocr' | 'user';
  reviewed: boolean;
  source?: { documentId: string; page: number; location?: string };
  confidence?: number;
}

export interface AuditFinding {
  id: string;
  caseId: string;
  name: string;
  amount: number | null;
  why: string;
  doc: string;
  page: number;
  status:
    | 'Needs Review'
    | 'Information Missing'
    | 'Arithmetic Mismatch'
    | 'Possible Duplicate'
    | 'Reference Check Needed'
    | 'Resolved by User';
  type: 'duplicate' | 'arithmetic' | 'package' | 'medical' | string;
  note?: string;
  extraDoc?: string;
}

export interface PriceReference {
  item: string;
  billedAmount: number;
  referenceAmount?: number;
  sourceName?: string;
  sourceUrl?: string;
  documentId?: string;
  effectiveDate?: string;
  applicabilityConditions: string[];
  verificationStatus: 'unverified' | 'verified' | 'not-found';
}

export interface UserPrefs {
  name: string;
  contact: string;
  language: string;
  notifications: boolean;
}

export interface ActivityItem {
  text: string;
  caseId?: string;
  time: string;
}

export interface PendingFile {
  file: File;
  error?: string;
  category: string;
}

export interface DraftModel {
  step: number;
  selected: string[];
  account?: string;
  recipient?: string;
  reason?: string;
  text: string;
}

export interface BackendBillItem {
  id: string;
  bill_id: string;
  description: string;
  normalized_name: string;
  service_code?: string;
  category: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
  extraction_confidence?: number;
  user_confirmed: boolean;
  data_source: 'ocr_extracted' | 'user_corrected' | 'ai_suggested' | 'manual';
  page_number?: number;
  is_uncertain: boolean;
  uncertainty_reason?: string;
  created_at: string;
}

export interface BackendBill {
  id: string;
  user_id?: string;
  session_id?: string;
  hospital_id?: string;
  original_filename: string;
  storage_path: string;
  file_hash?: string;
  bill_date?: string;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  processing_status: string;
  version: number;
  audit_version: number;
  is_audit_outdated?: boolean;
  is_demo: boolean;
  created_at: string;
  items?: BackendBillItem[];
  hospital?: { id: string; name: string; location: string; state: string };
}

export interface BackendVerificationResult {
  id: string;
  bill_id: string;
  bill_item_id?: string;
  benchmark_id?: string;
  billed_amount: number;
  benchmark_amount?: number;
  difference_amount?: number;
  status: 'verified_discrepancy' | 'needs_review' | 'insufficient_evidence' | 'no_discrepancy_detected';
  reason: string;
  evidence?: string;
  confidence: number;
  rule_version: string;
  bill_version: number;
  is_demo: boolean;
  created_at: string;
  bill_item?: BackendBillItem;
}

export interface BackendVerificationSummary {
  bill_id: string;
  bill_date?: string;
  hospital_name?: string;
  total_billed: number;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  calculated_items_total: number;
  arithmetic_valid: boolean;
  total_verified_discrepancies: number;
  total_review_items: number;
  overall_status: string;
  bill_version: number;
  audit_version: number;
  is_outdated: boolean;
  is_demo: boolean;
  results: BackendVerificationResult[];
}

