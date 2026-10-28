import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
  MedicalCase,
  DocumentRecord,
  AuditFinding,
  UserPrefs,
  ActivityItem,
  PendingFile,
  DraftModel,
  BackendBill,
  BackendBillItem,
  BackendVerificationSummary
} from '../types';
import { sampleCases, sampleDocs, sampleFindings } from '../utils/constants';
import { apiClient } from '../services/api-client';

interface ModalState {
  open: boolean;
  title: string;
  content: React.ReactNode;
  actions?: React.ReactNode;
}

interface WorkspaceContextType {
  isDemo: boolean;
  setIsDemo: (val: boolean) => void;
  activeCaseId: string;
  setActiveCaseId: (id: string) => void;
  currentCase: MedicalCase | undefined;
  cases: MedicalCase[];
  docs: DocumentRecord[];
  findings: AuditFinding[];
  caseDocs: DocumentRecord[];
  caseFindings: AuditFinding[];
  notes: Record<string, string>;
  activity: ActivityItem[];
  pendingFiles: PendingFile[];
  setPendingFiles: React.Dispatch<React.SetStateAction<PendingFile[]>>;
  ocrEdits: Record<string, any>;
  setOcrEdits: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  drafts: Record<string, DraftModel>;
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, DraftModel>>>;
  userPrefs: UserPrefs;
  setUserPrefs: React.Dispatch<React.SetStateAction<UserPrefs>>;
  docBlobUrls: Map<string, string>;
  addCase: (c: MedicalCase) => void;
  updateCase: (id: string, patch: Partial<MedicalCase>) => void;
  deleteCase: (id: string) => void;
  addDocument: (doc: DocumentRecord, blobUrl?: string) => void;
  updateDocument: (id: string, patch: Partial<DocumentRecord>) => void;
  updateFinding: (id: string, patch: Partial<AuditFinding>) => void;
  addActivity: (text: string) => void;
  saveNotes: (caseId: string, text: string) => void;
  clearWorkspace: () => void;
  switchWorkspaceMode: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
  modal: ModalState;
  showModal: (title: string, content: React.ReactNode, actions?: React.ReactNode) => void;
  closeModal: () => void;
  showUnavailable: (feature: string, endpoint: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Live backend state & methods
  liveBills: BackendBill[];
  activeLiveBill: BackendBill | null;
  setActiveLiveBillId: (id: string) => void;
  liveVerification: BackendVerificationSummary | null;
  isLiveLoading: boolean;
  liveError: string | null;
  setLiveError: React.Dispatch<React.SetStateAction<string | null>>;
  fetchLiveBills: () => Promise<void>;
  fetchLiveBillDetail: (billId: string) => Promise<BackendBill | null>;
  uploadLiveBill: (file: File) => Promise<BackendBill>;
  updateLiveItem: (billId: string, itemId: string, patch: Partial<BackendBillItem>) => Promise<void>;
  runLiveAudit: (billId: string) => Promise<BackendVerificationSummary | null>;
  generateLiveReport: (billId: string) => Promise<{ id: string; downloadUrl: string } | null>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemo, setIsDemo] = useState(true);
  const [activeCaseId, setActiveCaseId] = useState('BS-1024');

  // Demo store
  const [demoCases, setDemoCases] = useState<MedicalCase[]>(() => structuredClone(sampleCases));
  const [demoDocs, setDemoDocs] = useState<DocumentRecord[]>(() => structuredClone(sampleDocs));
  const [demoFindings, setDemoFindings] = useState<AuditFinding[]>(() => structuredClone(sampleFindings));
  const [demoNotes, setDemoNotes] = useState<Record<string, string>>({});
  const [demoActivity, setDemoActivity] = useState<ActivityItem[]>([]);

  // Local store
  const [localCases, setLocalCases] = useState<MedicalCase[]>([]);
  const [localDocs, setLocalDocs] = useState<DocumentRecord[]>([]);
  const [localFindings, setLocalFindings] = useState<AuditFinding[]>([]);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [localActivity, setLocalActivity] = useState<ActivityItem[]>([]);

  // Shared session state
  const docBlobUrlsRef = useRef<Map<string, string>>(new Map());
  const [ocrEdits, setOcrEdits] = useState<Record<string, any>>({});
  const [drafts, setDrafts] = useState<Record<string, DraftModel>>({});
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [userPrefs, setUserPrefs] = useState<UserPrefs>({
    name: '',
    contact: '',
    language: 'English',
    notifications: true
  });

  // UI state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [modal, setModal] = useState<ModalState>({
    open: false,
    title: '',
    content: null,
    actions: undefined
  });

  const cases = isDemo ? demoCases : localCases;
  const docs = isDemo ? demoDocs : localDocs;
  const findings = isDemo ? demoFindings : localFindings;
  const notes = isDemo ? demoNotes : localNotes;
  const activity = isDemo ? demoActivity : localActivity;

  const currentCase = cases.find(c => c.id === activeCaseId) || cases[0];

  // Keep active case valid
  useEffect(() => {
    if (cases.length && (!currentCase || !cases.some(c => c.id === activeCaseId))) {
      setActiveCaseId(cases[0].id);
    }
  }, [cases, activeCaseId, currentCase]);

  const caseDocs = currentCase ? docs.filter(d => d.caseId === currentCase.id) : [];
  const caseFindings = currentCase ? findings.filter(f => f.caseId === currentCase.id) : [];

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const showModal = (title: string, content: React.ReactNode, actions?: React.ReactNode) => {
    setModal({ open: true, title, content, actions });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, open: false }));
  };

  const showUnavailable = (feature: string, endpoint: string) => {
    showModal(
      `${feature} is not connected`,
      <div>
        <p>This frontend has no connected backend for {feature.toLowerCase()}. Nothing has been submitted or processed.</p>
        <div className="notice" style={{ margin: '14px 0' }}>
          <strong>Proposed integration point</strong><br />
          <code>{endpoint}</code>
        </div>
        <p className="note-text">These are proposed API contracts, not existing endpoints. See the included integration guide.</p>
      </div>
    );
  };

  const addActivity = (text: string) => {
    const item: ActivityItem = {
      text,
      caseId: currentCase?.id,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    if (isDemo) {
      setDemoActivity(prev => [item, ...prev]);
    } else {
      setLocalActivity(prev => [item, ...prev]);
    }
  };

  const addCase = (c: MedicalCase) => {
    if (isDemo) {
      setDemoCases(prev => [c, ...prev]);
    } else {
      setLocalCases(prev => [c, ...prev]);
    }
    setActiveCaseId(c.id);
  };

  const updateCase = (id: string, patch: Partial<MedicalCase>) => {
    const updater = (prev: MedicalCase[]) => prev.map(c => (c.id === id ? { ...c, ...patch } : c));
    if (isDemo) setDemoCases(updater);
    else setLocalCases(updater);
  };

  const deleteCase = (id: string) => {
    const caseDocsToDelete = docs.filter(d => d.caseId === id);
    caseDocsToDelete.forEach(d => {
      if (docBlobUrlsRef.current.has(d.id)) {
        URL.revokeObjectURL(docBlobUrlsRef.current.get(d.id)!);
        docBlobUrlsRef.current.delete(d.id);
      }
    });

    if (isDemo) {
      setDemoCases(prev => prev.filter(c => c.id !== id));
      setDemoDocs(prev => prev.filter(d => d.caseId !== id));
      setDemoFindings(prev => prev.filter(f => f.caseId !== id));
    } else {
      setLocalCases(prev => prev.filter(c => c.id !== id));
      setLocalDocs(prev => prev.filter(d => d.caseId !== id));
      setLocalFindings(prev => prev.filter(f => f.caseId !== id));
    }
    closeModal();
    showToast('Case removed from this browser session.');
  };

  const addDocument = (doc: DocumentRecord, blobUrl?: string) => {
    if (blobUrl) {
      docBlobUrlsRef.current.set(doc.id, blobUrl);
    }
    if (isDemo) {
      setDemoDocs(prev => [...prev, doc]);
    } else {
      setLocalDocs(prev => [...prev, doc]);
    }
  };

  const updateDocument = (id: string, patch: Partial<DocumentRecord>) => {
    const updater = (prev: DocumentRecord[]) => prev.map(d => (d.id === id ? { ...d, ...patch } : d));
    if (isDemo) setDemoDocs(updater);
    else setLocalDocs(updater);
  };

  const updateFinding = (id: string, patch: Partial<AuditFinding>) => {
    const updater = (prev: AuditFinding[]) => prev.map(f => (f.id === id ? { ...f, ...patch } : f));
    if (isDemo) setDemoFindings(updater);
    else setLocalFindings(updater);
  };

  const saveNotes = (caseId: string, text: string) => {
    if (isDemo) {
      setDemoNotes(prev => ({ ...prev, [caseId]: text }));
    } else {
      setLocalNotes(prev => ({ ...prev, [caseId]: text }));
    }
  };

  const clearWorkspace = () => {
    docs.forEach(d => {
      if (docBlobUrlsRef.current.has(d.id)) {
        URL.revokeObjectURL(docBlobUrlsRef.current.get(d.id)!);
        docBlobUrlsRef.current.delete(d.id);
      }
    });
    setOcrEdits({});
    setDrafts(prev => {
      const next = { ...prev };
      const prefix = isDemo ? 'demo:' : 'local:';
      for (const k of Object.keys(next)) {
        if (k.startsWith(prefix)) delete next[k];
      }
      return next;
    });

    if (isDemo) {
      setDemoCases([]);
      setDemoDocs([]);
      setDemoFindings([]);
      setDemoNotes({});
      setDemoActivity([]);
    } else {
      setLocalCases([]);
      setLocalDocs([]);
      setLocalFindings([]);
      setLocalNotes({});
      setLocalActivity([]);
    }
    setPendingFiles([]);
    closeModal();
    showToast('Workspace cleared from this tab.');
  };

  // Live backend store
  const [liveBills, setLiveBills] = useState<BackendBill[]>([]);
  const [activeLiveBillId, setActiveLiveBillId] = useState<string>('');
  const [liveVerification, setLiveVerification] = useState<BackendVerificationSummary | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const activeLiveBill = liveBills.find(b => b.id === activeLiveBillId) || liveBills[0] || null;

  // Clear verification results if active bill changes to prevent cross-bill leakage
  useEffect(() => {
    if (liveVerification && activeLiveBill && liveVerification.bill_id !== activeLiveBill.id) {
      setLiveVerification(null);
    }
  }, [activeLiveBill, liveVerification]);

  // Sync activeCaseId and activeLiveBillId when switching cases in live mode
  useEffect(() => {
    if (!isDemo && activeCaseId) {
      const match = liveBills.find(b => b.id === activeCaseId);
      if (match && match.id !== activeLiveBillId) {
        setActiveLiveBillId(match.id);
      }
    }
  }, [isDemo, activeCaseId, liveBills, activeLiveBillId]);

  // Sync live bills into localCases & localDocs for uniform navigation in live mode
  const syncLiveBillsToLocalStore = (bills: BackendBill[]) => {
    if (!bills || !bills.length) return;
    const mappedCases: MedicalCase[] = bills.map(b => ({
      id: b.id,
      name: b.original_filename.replace(/\.[^/.]+$/, ''),
      hospital: b.hospital?.name || 'Healthcare Provider',
      date: b.bill_date ? b.bill_date.split('T')[0] : b.created_at.split('T')[0],
      amount: b.total_amount ? Number(b.total_amount) : 0,
      stage: b.processing_status === 'review_required'
        ? 'Needs Review'
        : b.processing_status === 'completed'
        ? 'Audit Completed'
        : b.processing_status === 'auditing'
        ? 'Processing'
        : 'Awaiting Documents',
      progress: b.processing_status === 'completed' ? 100 : b.processing_status === 'review_required' ? 60 : 30,
      updated: b.created_at.split('T')[0],
      objectives: ['Verify bill arithmetic', 'Detect duplicate charges']
    }));

    const mappedDocs: DocumentRecord[] = bills.map(b => ({
      id: b.id,
      caseId: b.id,
      name: b.original_filename,
      category: 'Invoices & discharge summaries',
      status: b.processing_status === 'review_required'
        ? 'Review Required'
        : b.processing_status === 'completed'
        ? 'Completed'
        : b.processing_status === 'failed'
        ? 'Failed'
        : 'Uploaded',
      size: 0,
      type: b.original_filename.toLowerCase().endsWith('.pdf')
        ? 'application/pdf'
        : b.original_filename.toLowerCase().endsWith('.png')
        ? 'image/png'
        : 'image/jpeg',
      sample: false
    }));

    setLocalCases(mappedCases);
    setLocalDocs(mappedDocs);
    bills.forEach(b => {
      docBlobUrlsRef.current.set(b.id, apiClient.getDocumentUrl(b.id));
    });
  };

  const fetchLiveBills = async () => {
    try {
      setIsLiveLoading(true);
      setLiveError(null);
      const bills = await apiClient.listBills();
      setLiveBills(bills);
      syncLiveBillsToLocalStore(bills);
      if (bills.length && !activeLiveBillId) {
        setActiveLiveBillId(bills[0].id);
        setActiveCaseId(bills[0].id);
      }
    } catch (err: any) {
      setLiveError(err.message || 'Unable to fetch bills from server');
    } finally {
      setIsLiveLoading(false);
    }
  };

  const fetchLiveBillDetail = async (billId: string): Promise<BackendBill | null> => {
    try {
      setIsLiveLoading(true);
      const bill = await apiClient.getBill(billId);
      setLiveBills(prev => {
        const idx = prev.findIndex(b => b.id === billId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = bill;
          return next;
        }
        return [bill, ...prev];
      });
      return bill;
    } catch (err: any) {
      setLiveError(err.message || 'Failed to load bill details');
      return null;
    } finally {
      setIsLiveLoading(false);
    }
  };

  const uploadLiveBill = async (file: File): Promise<BackendBill> => {
    try {
      setIsLiveLoading(true);
      setLiveError(null);
      const newBill = await apiClient.uploadBill(file, isDemo);
      setLiveBills(prev => [newBill, ...prev]);
      setActiveLiveBillId(newBill.id);
      setActiveCaseId(newBill.id);
      syncLiveBillsToLocalStore([newBill, ...liveBills]);
      addActivity(`Uploaded bill "${file.name}" for live processing`);
      showToast(`Bill "${file.name}" uploaded successfully! Status: ${newBill.processing_status}`);
      fetchLiveBillDetail(newBill.id).catch(() => {});
      return newBill;
    } catch (err: any) {
      const msg = err.message || 'Failed to upload bill';
      setLiveError(msg);
      showToast(msg);
      throw err;
    } finally {
      setIsLiveLoading(false);
    }
  };

  const updateLiveItem = async (billId: string, itemId: string, patch: Partial<BackendBillItem>) => {
    try {
      setIsLiveLoading(true);
      setLiveError(null);
      await apiClient.updateBillItem(billId, itemId, patch);
      const updated = await apiClient.getBill(billId);
      setLiveBills(prev => prev.map(b => b.id === billId ? updated : b));
      addActivity(`Updated item in bill (Bill version updated to v${updated.version})`);
      showToast(`Item updated. Audit is now outdated if bill version changed.`);
    } catch (err: any) {
      const msg = err.message || 'Failed to update item';
      setLiveError(msg);
      showToast(msg);
      throw err;
    } finally {
      setIsLiveLoading(false);
    }
  };

  const runLiveAudit = async (billId: string): Promise<BackendVerificationSummary | null> => {
    try {
      setIsLiveLoading(true);
      setLiveError(null);
      const summary = await apiClient.runVerification(billId);
      setLiveVerification(summary);
      const updated = await apiClient.getBill(billId);
      setLiveBills(prev => prev.map(b => b.id === billId ? updated : b));
      addActivity(`Deterministic audit completed: ${summary.total_verified_discrepancies} discrepancies found`);
      showToast(`Audit completed with status: ${summary.overall_status}`);
      return summary;
    } catch (err: any) {
      const msg = err.message || 'Failed to run verification';
      setLiveError(msg);
      showToast(msg);
      return null;
    } finally {
      setIsLiveLoading(false);
    }
  };

  const generateLiveReport = async (billId: string): Promise<{ id: string; downloadUrl: string } | null> => {
    try {
      setIsLiveLoading(true);
      setLiveError(null);
      const report = await apiClient.generateReport(billId);
      const downloadUrl = apiClient.getReportDownloadUrl(report.id);
      addActivity(`Generated official PDF report #${report.id}`);
      showToast(`Report generated successfully.`);
      return { id: report.id, downloadUrl };
    } catch (err: any) {
      const msg = err.message || 'Failed to generate report';
      setLiveError(msg);
      showToast(msg);
      return null;
    } finally {
      setIsLiveLoading(false);
    }
  };

  useEffect(() => {
    if (!isDemo) {
      fetchLiveBills();
    }
  }, [isDemo]);

  const switchWorkspaceMode = () => {
    const newMode = !isDemo;
    setIsDemo(newMode);
    setDrafts({});
    const targetCases = newMode ? demoCases : localCases;
    setActiveCaseId(targetCases[0]?.id || '');
    closeModal();
  };

  return (
    <WorkspaceContext.Provider
      value={{
        isDemo,
        setIsDemo,
        activeCaseId,
        setActiveCaseId,
        currentCase,
        cases,
        docs,
        findings,
        caseDocs,
        caseFindings,
        notes,
        activity,
        pendingFiles,
        setPendingFiles,
        ocrEdits,
        setOcrEdits,
        drafts,
        setDrafts,
        userPrefs,
        setUserPrefs,
        docBlobUrls: docBlobUrlsRef.current,
        addCase,
        updateCase,
        deleteCase,
        addDocument,
        updateDocument,
        updateFinding,
        addActivity,
        saveNotes,
        clearWorkspace,
        switchWorkspaceMode,
        toast,
        showToast,
        modal,
        showModal,
        closeModal,
        showUnavailable,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileNavOpen,
        setIsMobileNavOpen,

        // Live backend properties
        liveBills,
        activeLiveBill,
        setActiveLiveBillId,
        liveVerification,
        isLiveLoading,
        liveError,
        setLiveError,
        fetchLiveBills,
        fetchLiveBillDetail,
        uploadLiveBill,
        updateLiveItem,
        runLiveAudit,
        generateLiveReport
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
