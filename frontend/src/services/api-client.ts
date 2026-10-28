/**
 * Production API client for Bill Saathi AI.
 * Handles session-scoped authentication, error boundaries, and typed contracts.
 */
import {
  BackendBill,
  BackendBillItem,
  BackendVerificationSummary,
  MedicalCase,
  DocumentRecord,
  ExtractedField,
  PriceReference
} from '../types';

export class ApiError extends Error {
  constructor(message: string, public status: number, public requestId?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error_code?: string;
}

export class BillSaathiApi {
  constructor(
    private baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  ) {}

  private getSessionId(): string | null {
    try {
      return sessionStorage.getItem('billsaathi_session_id');
    } catch {
      return null;
    }
  }

  private setSessionId(id: string): void {
    try {
      sessionStorage.setItem('billsaathi_session_id', id);
    } catch {
      // Ignore in restricted environments
    }
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');

    const sessionId = this.getSessionId();
    if (sessionId) {
      headers.set('X-Session-ID', sessionId);
    }

    if (init.body && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    let response: Response;
    try {
      response = await fetch(this.baseUrl + path, {
        ...init,
        headers,
      });
    } catch (networkErr: any) {
      throw new ApiError(
        'Unable to connect to the Bill Saathi backend server. Please verify the API server is running at ' + this.baseUrl,
        0
      );
    }

    // Capture session token if issued
    const newSession = response.headers.get('X-Session-ID');
    if (newSession) {
      this.setSessionId(newSession);
    }

    if (!response.ok) {
      let errorDetail = 'The request could not be completed. Please retry.';
      try {
        const errJson = await response.json();
        if (errJson && errJson.detail) {
          errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        } else if (errJson && errJson.message) {
          errorDetail = errJson.message;
        }
      } catch {
        // Fallback to generic message
      }

      throw new ApiError(
        errorDetail,
        response.status,
        response.headers.get('X-Request-ID') || undefined
      );
    }

    if (response.status === 204) return undefined as T;
    const body: ApiResponse<T> = await response.json();
    return body.data;
  }

  // --- Real Live API Methods ---

  async uploadBill(file: File, isDemo: boolean = false): Promise<BackendBill> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_demo', String(isDemo));

    return this.request<BackendBill>('/bills/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async listBills(skip: number = 0, limit: number = 50): Promise<BackendBill[]> {
    return this.request<BackendBill[]>(`/bills?skip=${skip}&limit=${limit}`);
  }

  async getBill(billId: string): Promise<BackendBill> {
    return this.request<BackendBill>(`/bills/${encodeURIComponent(billId)}`);
  }

  getDocumentUrl(billId: string): string {
    const sessionId = this.getSessionId();
    const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
    return `${this.baseUrl}/bills/${encodeURIComponent(billId)}/document${query}`;
  }

  async updateBillItem(
    billId: string,
    itemId: string,
    patch: Partial<BackendBillItem>
  ): Promise<BackendBillItem> {
    return this.request<BackendBillItem>(
      `/bills/${encodeURIComponent(billId)}/items/${encodeURIComponent(itemId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    );
  }

  async addBillItem(billId: string, item: Partial<BackendBillItem>): Promise<BackendBillItem> {
    return this.request<BackendBillItem>(`/bills/${encodeURIComponent(billId)}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async deleteBillItem(billId: string, itemId: string): Promise<{ deleted_item_id: string }> {
    return this.request<{ deleted_item_id: string }>(
      `/bills/${encodeURIComponent(billId)}/items/${encodeURIComponent(itemId)}`,
      {
        method: 'DELETE',
      }
    );
  }

  async runVerification(billId: string): Promise<BackendVerificationSummary> {
    return this.request<BackendVerificationSummary>(`/bills/${encodeURIComponent(billId)}/verify`, {
      method: 'POST',
    });
  }

  async getVerificationSummary(billId: string): Promise<BackendVerificationSummary> {
    return this.request<BackendVerificationSummary>(`/bills/${encodeURIComponent(billId)}/verification`);
  }

  async generateReport(billId: string, reportType: string = 'audit_dossier'): Promise<any> {
    return this.request<any>(`/bills/${encodeURIComponent(billId)}/report`, {
      method: 'POST',
      body: JSON.stringify({ report_type: reportType }),
    });
  }

  getReportDownloadUrl(reportId: string): string {
    return `${this.baseUrl}/reports/${encodeURIComponent(reportId)}/download`;
  }

  async checkHealth(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }

  // --- Legacy Compatibility Stubs ---
  listCases(signal?: AbortSignal) {
    return this.request<{ items: MedicalCase[]; total: number }>('/cases', { signal });
  }

  createCase(data: Omit<MedicalCase, 'id' | 'updated' | 'stage' | 'progress'>) {
    return this.request<MedicalCase>('/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateCase(id: string, data: Partial<MedicalCase>) {
    return this.request<MedicalCase>(`/cases/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteCase(id: string) {
    return this.request<void>(`/cases/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  saveFields(id: string, fields: ExtractedField[]) {
    return this.request<DocumentRecord>(`/documents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields }),
    });
  }

  priceReferences(caseId: string) {
    return this.request<PriceReference[]>(`/cases/${encodeURIComponent(caseId)}/price-references`);
  }
}

export const apiClient = new BillSaathiApi();
