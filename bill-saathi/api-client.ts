/** Proposed integration contracts. This client is intentionally NOT connected to the demo. */
export type CaseStage = 'Draft' | 'Awaiting Documents' | 'Processing' | 'Needs Review' | 'Audit Completed' | 'Draft Prepared' | 'Ready for Export';
export interface MedicalCase {
  id: string; name: string; hospital: string; city?: string;
  amount: number; currency: 'INR'; stage: CaseStage;
  date?: string; admission?: string; discharge?: string;
  updated: string; objectives: string[]; description?: string;
}
export interface DocumentRecord {
  id: string; caseId: string; name: string; category: string;
  status: 'Uploaded' | 'Processing' | 'Review Required' | 'Completed' | 'Failed';
  sourcePages?: number[]; error?: string;
}
export interface ExtractedField {
  key: string; value: string | number | null;
  origin: 'ocr' | 'user'; reviewed: boolean;
  source?: { documentId: string; page: number; location?: string };
  /** Omit when the provider does not supply a score. */
  confidence?: number;
}
export interface AuditFinding {
  id: string; caseId: string; explanation: string;
  amountInvolved?: number; currency?: string;
  status: 'Needs Review' | 'Information Missing' | 'Arithmetic Mismatch' | 'Possible Duplicate' | 'Reference Check Needed' | 'Resolved by User';
  sources: Array<{ documentId: string; page?: number }>;
}
export interface PriceReference {
  item: string; billedAmount: number; referenceAmount?: number;
  sourceName?: string; sourceUrl?: string; documentId?: string;
  effectiveDate?: string; applicabilityConditions: string[];
  verificationStatus: 'unverified' | 'verified' | 'not-found';
}
export class ApiError extends Error {
  constructor(message: string, public status: number, public requestId?: string) { super(message); }
}
export class BillSaathiApi {
  constructor(private baseUrl = '/api', private csrfToken?: () => string) {}
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    const csrf = this.csrfToken?.();
    if (csrf && init.method && init.method !== 'GET') headers.set('X-CSRF-Token', csrf);
    const response = await fetch(this.baseUrl + path, { ...init, headers, credentials: 'same-origin' });
    if (!response.ok) {
      // Never log patient data, raw error payloads, or document contents.
      throw new ApiError('The request could not be completed. Please retry or contact support.', response.status, response.headers.get('X-Request-ID') || undefined);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>; // Validate server responses at runtime before production use.
  }
  listCases(signal?: AbortSignal) { return this.request<{ items: MedicalCase[]; total: number }>('/cases', { signal }); }
  createCase(data: Omit<MedicalCase, 'id' | 'updated' | 'stage'>) { return this.request<MedicalCase>('/cases', { method: 'POST', body: JSON.stringify(data) }); }
  updateCase(id: string, data: Partial<MedicalCase>) { return this.request<MedicalCase>(`/cases/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  deleteCase(id: string) { return this.request<void>(`/cases/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
  uploadDocument(caseId: string, file: File, category: string) {
    const body = new FormData(); body.append('file', file); body.append('category', category);
    return this.request<DocumentRecord>(`/cases/${encodeURIComponent(caseId)}/documents`, { method: 'POST', body });
  }
  saveFields(id: string, fields: ExtractedField[]) { return this.request<DocumentRecord>(`/documents/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ fields }) }); }
  reprocess(id: string) { return this.request<{ jobId: string }>(`/documents/${encodeURIComponent(id)}/reprocess`, { method: 'POST' }); }
  startAudit(caseId: string) { return this.request<{ jobId: string }>(`/cases/${encodeURIComponent(caseId)}/audits`, { method: 'POST' }); }
  priceReferences(caseId: string) { return this.request<PriceReference[]>(`/cases/${encodeURIComponent(caseId)}/price-references`); }
}
