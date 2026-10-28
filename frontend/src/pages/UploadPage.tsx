import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { DocumentRecord, PendingFile } from '../types';
import { categories } from '../utils/constants';
import { money, date } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icon';
import { Button } from '../components/common/Button';
import { CaseSelector } from '../components/navigation/CaseSelector';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentCase,
    caseDocs,
    pendingFiles,
    setPendingFiles,
    addDocument,
    docBlobUrls,
    addActivity,
    showToast,
    showModal,
    isDemo,
    uploadLiveBill,
    isLiveLoading,
    liveBills
  } = useWorkspace();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!currentCase) {
    return (
      <div className="empty">
        <Icon name="file" />
        <h3>Create a case first</h3>
        <p>Documents, findings and drafts need a case to stay organized.</p>
        <Button variant="primary" onClick={() => navigate('/new')}>
          Create a case
        </Button>
      </div>
    );
  }

  const handleFilesSelect = (files: FileList | null) => {
    if (!files || !files.length) return;
    const newPending: PendingFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      let error = '';
      const ext = f.name.toLowerCase().split('.').pop() || '';
      const allowedExts = ['pdf', 'jpg', 'jpeg', 'png'];
      const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const isValidType = allowedMimes.includes(f.type) || allowedExts.includes(ext);

      if (!isValidType) {
        error = 'Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG.';
      } else if (f.size > 15 * 1024 * 1024) {
        error = 'File exceeds 15 MB limit';
      } else if (f.size === 0) {
        error = 'File is empty';
      }
      newPending.push({ file: f, error, category: categories[0] });
    }

    setPendingFiles(prev => [...prev, ...newPending]);
  };

  const handleRemovePending = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index: number, cat: string) => {
    setPendingFiles(prev =>
      prev.map((item, i) => (i === index ? { ...item, category: cat } : item))
    );
  };

  const handleCommitFiles = () => {
    const valid = pendingFiles.filter(p => !p.error);
    if (!valid.length) {
      showToast('Choose at least one valid PDF, JPG or PNG first.');
      return;
    }

    for (const p of valid) {
      const id = 'DOC-' + Date.now() + '-' + Math.random().toString(16).slice(2, 6);
      const blobUrl = URL.createObjectURL(p.file);

      const docRecord: DocumentRecord = {
        id,
        caseId: currentCase.id,
        name: p.file.name,
        category: p.category,
        status: 'Selected locally',
        size: p.file.size,
        type: p.file.type,
        sample: false
      };

      addDocument(docRecord, blobUrl);
    }

    setPendingFiles(prev => prev.filter(p => !!p.error));
    addActivity(`${valid.length} document(s) selected locally`);
    showToast('Files added to this tab only. Server upload and OCR are unavailable.');
  };

  const handleUploadToBackend = async () => {
    const valid = pendingFiles.filter(p => !p.error);
    if (!valid.length) {
      showToast('Choose at least one valid PDF, JPG or PNG first.');
      return;
    }

    try {
      for (const p of valid) {
        await uploadLiveBill(p.file);
      }
      setPendingFiles(prev => prev.filter(p => !!p.error));
      navigate('/review');
    } catch (err: any) {
      // Error handled by uploadLiveBill toast
    }
  };

  const renderSamplePaper = (d: DocumentRecord) => {
    const isBill = d.category.includes('invoices');
    return (
      <div className="paper">
        <div className="eyebrow">SYNTHETIC DOCUMENT · DEMO DATA</div>
        <h3>{currentCase?.hospital || 'Sample provider'}</h3>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '8px 0 14px' }}>
          {isBill ? 'ITEMIZED HOSPITAL BILL' : 'SUPPORTING DOCUMENT'}
          <br />
          Sample patient · {currentCase?.id}
          <br />
          Invoice: SAMPLE-2026-01
          <br />
          Bill date: {date(currentCase?.date)}
        </p>
        <hr style={{ border: 0, borderTop: '1px solid #dce2ea', marginBottom: '14px' }} />
        {isBill && currentCase?.id !== 'BS-1024' ? (
          <p className="note-text">
            Sample discharge invoice total: {money(currentCase?.amount)}. Detailed line items are
            not supplied in this illustration.
          </p>
        ) : isBill ? (
          <table>
            <tbody>
              {[
                ['Room & nursing', 30000],
                ['Procedure & services', 42000],
                ['CBC panel', 2500],
                ['CBC panel', 2500],
                ['Medicines & supplies', 7000]
              ].map(([l, a]) => (
                <tr key={l as string}>
                  <td>{l}</td>
                  <td style={{ fontWeight: 600 }}>{money(a as number)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                <td>
                  <strong>Line-item total</strong>
                </td>
                <td>
                  <strong>₹84,000</strong>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Billed total</strong>
                </td>
                <td>
                  <strong>₹84,500</strong>
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="note-text">
            This fictional supporting document is a preview placeholder. No clinical narrative or
            patient identity is provided.
          </p>
        )}
        <p style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '30px' }}>
          Page 1 · Generated illustration, not an actual patient record.
          <br />
          Amounts are synthetic and do not represent official rates.
        </p>
      </div>
    );
  };

  const handlePreviewDoc = (d: DocumentRecord) => {
    let previewContent: React.ReactNode;
    if (d.sample) {
      previewContent = renderSamplePaper(d);
    } else {
      const url = docBlobUrls.get(d.id);
      if (!url) {
        previewContent = <p>Preview unavailable in this session. Select the file again.</p>;
      } else if (d.type === 'application/pdf') {
        previewContent = (
          <iframe
            title="Document preview"
            src={url}
            style={{ border: 0, width: '100%', height: '520px' }}
          />
        );
      } else {
        previewContent = (
          <img
            src={url}
            alt="Selected document preview"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        );
      }
    }

    showModal(
      d.name,
      <div className="doc-preview" style={{ minHeight: '300px' }}>
        {previewContent}
      </div>
    );
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Your document center</h1>
          <p>Bring the bill and supporting records together.</p>
        </div>
        <CaseSelector />
      </div>

      <div className={`notice ${!isDemo ? 'success' : ''}`.trim()}>
        <Icon name={!isDemo ? 'shield' : 'lock'} />
        <span>
          {!isDemo
            ? 'Live Workspace Active — Uploaded files are cryptographically validated (SHA-256), protected with session-scoped authorization, and processed via deterministic verification.'
            : 'Select documents only if you are authorized to use them. In this prototype, files remain in memory in this tab and are not uploaded to a server.'}
        </span>
      </div>

      <div className="two-col">
        <section className="card padded">
          <div
            className={`dropzone ${isDragOver ? 'drag' : ''}`.trim()}
            id="dropzone"
            onDragOver={e => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragOver(false);
              handleFilesSelect(e.dataTransfer.files);
            }}
          >
            <Icon name="upload" />
            <h3>Drop your documents here</h3>
            <p>PDF, JPG, JPEG or PNG · Up to 15 MB per file</p>
            <input
              type="file"
              id="file-input"
              ref={fileInputRef}
              accept="application/pdf,image/jpeg,image/png,image/jpg,.pdf,.jpg,.jpeg,.png"
              multiple
              hidden
              onChange={e => {
                handleFilesSelect(e.target.files);
                e.target.value = '';
              }}
            />
            <Button
              variant="primary"
              icon="plus"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse files
            </Button>
            <p style={{ marginTop: '12px', marginBottom: 0 }}>
              Files are selected locally, not sent to a server.
            </p>
          </div>

          <div id="pending-files">
            {pendingFiles.map((p, i) => (
              <div key={i} className="document">
                <Icon name={p.error ? 'warning' : 'file'} />
                <div className="details">
                  <strong>{p.file.name}</strong>
                  <small>
                    {(p.file.size / 1024 / 1024).toFixed(2)} MB ·{' '}
                    {p.error ? (
                      <span className="error">{p.error}</span>
                    ) : (
                      'Selected locally'
                    )}
                  </small>
                </div>
                {!p.error && (
                  <select
                    aria-label={`Category for ${p.file.name}`}
                    value={p.category}
                    onChange={e => handleCategoryChange(i, e.target.value)}
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
                <Button variant="small" onClick={() => handleRemovePending(i)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="actions" style={{ marginTop: '20px' }}>
            <Button
              variant="primary"
              icon="file"
              onClick={handleCommitFiles}
            >
              Add selected files locally
            </Button>
            <Button
              variant="primary"
              icon="upload"
              disabled={isLiveLoading}
              onClick={handleUploadToBackend}
            >
              {isLiveLoading ? 'Uploading & Extracting...' : (isDemo ? 'Upload & Process (Demo)' : 'Upload & Process with Live AI')}
            </Button>
            <Button onClick={() => navigate('/review')}>Continue to review</Button>
          </div>
        </section>

        <section className="card padded">
          <h3 style={{ marginTop: 0, fontSize: '15px', fontWeight: 700 }}>
            Case documents <span className="badge gray">{caseDocs.length}</span>
          </h3>
          {caseDocs.length ? (
            caseDocs.map(d => (
              <div key={d.id} className="document">
                <Icon name="file" />
                <div className="details">
                  <strong>{d.name}</strong>
                  <small>
                    {d.category} ·{' '}
                    {d.sample ? 'Demo Data' : `${(d.size! / 1024).toFixed(0)} KB`}
                  </small>
                  <div style={{ marginTop: '5px' }}>
                    <Badge>{d.status}</Badge>
                  </div>
                </div>
                <Button
                  variant="small"
                  icon="eye"
                  onClick={() => handlePreviewDoc(d)}
                >
                  Preview
                </Button>
                <Button
                  variant="small"
                  onClick={() => navigate(`/review?docId=${d.id}`)}
                >
                  Review
                </Button>
              </div>
            ))
          ) : (
            <div className="empty">
              <Icon name="file" />
              <h3>No documents yet</h3>
              <p>Select a bill and any supporting records to begin.</p>
            </div>
          )}
          <p className="inline-note">
            Sample documents are generated illustrations, not actual uploaded patient files.
          </p>
        </section>
      </div>
    </>
  );
};
