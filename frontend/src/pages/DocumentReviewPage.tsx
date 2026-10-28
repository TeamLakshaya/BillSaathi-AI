import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { DocumentRecord, BackendBillItem } from '../types';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icon';
import { Button } from '../components/common/Button';
import { CaseSelector } from '../components/navigation/CaseSelector';
import { money, date } from '../utils/formatters';

export const DocumentReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    currentCase,
    caseDocs,
    ocrEdits,
    setOcrEdits,
    updateDocument,
    docBlobUrls,
    addActivity,
    showToast,
    showUnavailable,
    isDemo,
    activeLiveBill,
    updateLiveItem,
    showModal,
    closeModal
  } = useWorkspace();

  const paramDocId = searchParams.get('docId');
  const [selectedDocId, setSelectedDocId] = useState<string>(
    paramDocId || (caseDocs[0]?.id ?? '')
  );

  useEffect(() => {
    if (paramDocId) {
      setSelectedDocId(paramDocId);
    } else if (caseDocs.length && !caseDocs.some(d => d.id === selectedDocId)) {
      setSelectedDocId(caseDocs[0].id);
    }
  }, [paramDocId, caseDocs, selectedDocId]);

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

  const selectedDoc = caseDocs.find(d => d.id === selectedDocId) || caseDocs[0];

  if (!selectedDoc) {
    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Document review</h1>
            <p>Confirm source details before using them in an audit.</p>
          </div>
          <CaseSelector />
        </div>
        <div className="empty">
          <Icon name="file" />
          <h3>No documents to review</h3>
          <p>Add a bill to this case first.</p>
          <Button variant="primary" onClick={() => navigate('/upload')}>
            Add documents
          </Button>
        </div>
      </>
    );
  }

  const initialValues = ocrEdits[selectedDoc.id] || {
    patient: 'Sample patient',
    hospital: currentCase.hospital,
    invoice: 'SAMPLE-2026-01',
    date: currentCase.date || '',
    total: currentCase.amount
  };

  const [formFields, setFormFields] = useState<Record<string, any>>(initialValues);

  useEffect(() => {
    if (ocrEdits[selectedDoc.id]) {
      setFormFields(ocrEdits[selectedDoc.id]);
    } else {
      setFormFields({
        patient: selectedDoc.sample ? 'Sample patient' : '',
        hospital: selectedDoc.sample ? currentCase.hospital : '',
        invoice: selectedDoc.sample ? 'SAMPLE-2026-01' : '',
        date: selectedDoc.sample ? currentCase.date || '' : '',
        total: selectedDoc.sample ? currentCase.amount : ''
      });
    }
  }, [selectedDoc.id, ocrEdits, currentCase]);

  const handleFieldChange = (key: string, val: string) => {
    setFormFields(prev => ({
      ...prev,
      [key]: key === 'total' ? (val ? Number(val) : '') : val
    }));
  };

  const handleSave = (confirm = false) => {
    if (confirm && Object.values(formFields).some(v => v === '' || v === null || v === undefined)) {
      showToast('Complete each field, or save changes without marking it reviewed.');
      return;
    }

    setOcrEdits(prev => ({
      ...prev,
      [selectedDoc.id]: formFields
    }));

    if (confirm) {
      updateDocument(selectedDoc.id, {
        status: 'Reviewed locally',
        confirmed: true
      });
      addActivity('Document details reviewed locally');
      showToast('Document marked reviewed in this tab.');
    } else {
      showToast('Changes saved in this tab.');
    }
  };

  const handleEditLiveItem = (item: BackendBillItem) => {
    let desc = item.description;
    let qty = item.quantity;
    let price = item.unit_price;

    showModal(
      `Edit Item: ${item.description}`,
      <div>
        <p className="note-text" style={{ marginBottom: '12px' }}>
          Correcting extracted values marks this item as <strong>User Corrected</strong>, clears uncertainty flags, increments the Bill Version, and marks previous audits outdated.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label htmlFor="edit-item-desc">Description</label>
            <input
              type="text"
              defaultValue={desc}
              id="edit-item-desc"
              onChange={e => { desc = e.target.value; }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label htmlFor="edit-item-qty">Quantity</label>
              <input
                type="number"
                step="1"
                min="1"
                defaultValue={qty}
                id="edit-item-qty"
                onChange={e => { qty = Number(e.target.value); }}
              />
            </div>
            <div>
              <label htmlFor="edit-item-price">Unit Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                defaultValue={price}
                id="edit-item-price"
                onChange={e => { price = Number(e.target.value); }}
              />
            </div>
          </div>
        </div>
      </div>,
      <Button
        variant="primary"
        onClick={async () => {
          const descInput = (document.getElementById('edit-item-desc') as HTMLInputElement)?.value || desc;
          const qtyInput = Number((document.getElementById('edit-item-qty') as HTMLInputElement)?.value || qty);
          const priceInput = Number((document.getElementById('edit-item-price') as HTMLInputElement)?.value || price);
          if (activeLiveBill) {
            await updateLiveItem(activeLiveBill.id, item.id, {
              description: descInput,
              quantity: qtyInput,
              unit_price: priceInput,
              line_total: Number((qtyInput * priceInput).toFixed(2))
            });
          }
          closeModal();
        }}
      >
        Save Correction
      </Button>
    );
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

  const renderDocumentPreview = (d: DocumentRecord) => {
    if (d.sample) return renderSamplePaper(d);
    const u = docBlobUrls.get(d.id);
    if (!u) {
      return <p>Preview unavailable in this session. Select the file again.</p>;
    }
    return d.type === 'application/pdf' ? (
      <iframe
        title="Document preview"
        src={u}
        style={{ border: 0, width: '100%', height: '520px' }}
      />
    ) : (
      <img
        src={u}
        alt="Selected document preview"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    );
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Review the source, then the details</h1>
          <p>Keep AI-extracted values separate from user-confirmed information.</p>
        </div>
        <CaseSelector />
      </div>

      {!isDemo && activeLiveBill && (activeLiveBill.is_audit_outdated || (activeLiveBill.version > activeLiveBill.audit_version && activeLiveBill.audit_version > 0)) ? (
        <div className="notice warning">
          <Icon name="warning" />
          <span>
            ⚠️ Audit Outdated: Line items were modified (Bill v{activeLiveBill.version} vs Audit v{activeLiveBill.audit_version}). Re-run verification on the Audit page to recalculate discrepancies.
          </span>
        </div>
      ) : !isDemo && activeLiveBill && activeLiveBill.processing_status === 'review_required' ? (
        <div className="notice warning">
          <Icon name="warning" />
          <span>
            🔍 Human Review Required: Low OCR confidence or uncertain amounts were detected. Please review and confirm the line items below.
          </span>
        </div>
      ) : !isDemo && activeLiveBill ? (
        <div className="notice success">
          <Icon name="shield" />
          <span>
            Live Bill Active — Extracted line items are ready for audit (Bill v{activeLiveBill.version}). Review items, correct any misread values, and continue to audit.
          </span>
        </div>
      ) : (
        <div className={`notice ${selectedDoc.sample ? '' : 'warning'}`.trim()}>
          <Icon name={selectedDoc.sample ? 'info' : 'warning'} />
          <span>
            {selectedDoc.sample
              ? 'Illustrative extracted fields · No OCR engine was run. Confidence scores are unavailable.'
              : 'OCR unavailable — no extraction service is connected. Enter values manually and check the source. No confidence score is available.'}
          </span>
        </div>
      )}

      <div className="row" style={{ marginBottom: '18px' }}>
        <label className="sr-only" htmlFor="doc-select">
          Select document
        </label>
        <select
          id="doc-select"
          className="page-selector"
          value={selectedDoc.id}
          onChange={e => setSelectedDocId(e.target.value)}
        >
          {caseDocs.map(x => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <Badge>{selectedDoc.status}</Badge>
      </div>

      <div className="two-col">
        <section className="card padded">
          <div
            className="row"
            style={{ justifyContent: 'space-between', marginBottom: '14px' }}
          >
            <strong>Source document</strong>
            <span className="source-pill">
              {selectedDoc.sample ? 'Page 1' : 'Original file'}
            </span>
          </div>
          <div className="doc-preview">{renderDocumentPreview(selectedDoc)}</div>
        </section>

        <section className="card padded">
          <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700 }}>
            {selectedDoc.sample
              ? 'Illustrative extracted information'
              : 'Manual information entry'}
          </h3>
          <p className="note-text" style={{ marginBottom: '16px' }}>
            {selectedDoc.confirmed
              ? 'User-confirmed values.'
              : 'Unconfirmed — inspect the original document before confirming.'}
          </p>

          <form
            id="ocr-form"
            onSubmit={e => {
              e.preventDefault();
              handleSave(false);
            }}
          >
            {[
              ['Patient name', 'patient', 'text'],
              ['Hospital name', 'hospital', 'text'],
              ['Invoice number', 'invoice', 'text'],
              ['Bill date', 'date', 'date'],
              ['Final total (INR)', 'total', 'number']
            ].map(([label, key, type]) => (
              <div key={key} className="extracted-field">
                <label htmlFor={`ocr-${key}`}>{label}</label>
                <input
                  id={`ocr-${key}`}
                  name={key}
                  type={type}
                  min={type === 'number' ? '0' : undefined}
                  step={type === 'number' ? '0.01' : undefined}
                  value={formFields[key] ?? ''}
                  onChange={e => handleFieldChange(key, e.target.value)}
                />
                <small>
                  {selectedDoc.sample
                    ? 'Sample source: page 1'
                    : 'Source page not supplied · manually entered'}{' '}
                  · {selectedDoc.confirmed ? 'User confirmed' : 'Not confirmed'}
                </small>
              </div>
            ))}

            <div className="actions" style={{ marginTop: '20px' }}>
              <button className="primary" type="submit">
                Save Changes
              </button>
              <Button type="button" onClick={() => handleSave(true)}>
                Mark as Reviewed
              </Button>
              <Button
                type="button"
                onClick={() =>
                  showUnavailable(
                    'OCR reprocessing',
                    'POST /api/documents/:id/reprocess'
                  )
                }
              >
                Reprocess Document
              </Button>
              <Button
                type="button"
                icon="arrow"
                onClick={() => navigate('/audit')}
              >
                Continue to Bill Audit
              </Button>
            </div>
          </form>

          <p className="inline-note">
            Edits are stored in memory only. No invented confidence percentages are shown. A
            local review does not run an audit.
          </p>
        </section>
      </div>

      {!isDemo && activeLiveBill && activeLiveBill.items && activeLiveBill.items.length > 0 && (
        <section className="card padded" style={{ marginTop: '20px' }}>
          <div className="card-head" style={{ marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Live Itemized Line Items ({activeLiveBill.items.length})
              </h3>
              <p className="note-text" style={{ margin: '4px 0 0' }}>
                Bill Version: v{activeLiveBill.version} · Audit Version: v{activeLiveBill.audit_version}
                {activeLiveBill.version > activeLiveBill.audit_version && activeLiveBill.audit_version > 0 && (
                  <span className="badge warning" style={{ marginLeft: '8px' }}>⚠️ Audit Outdated</span>
                )}
              </p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>DESCRIPTION</th>
                  <th>CATEGORY</th>
                  <th>QTY & UNIT</th>
                  <th>UNIT PRICE</th>
                  <th>LINE TOTAL</th>
                  <th>SOURCE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {activeLiveBill.items.map((it, idx) => (
                  <tr key={it.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong>{it.description}</strong>
                      {it.normalized_name && it.normalized_name !== it.description && (
                        <small style={{ display: 'block', color: 'var(--text-muted)' }}>
                          Normalized: {it.normalized_name}
                        </small>
                      )}
                    </td>
                    <td><Badge>{it.category}</Badge></td>
                    <td>{it.quantity} {it.unit}</td>
                    <td className="money">{money(it.unit_price)}</td>
                    <td className="money"><strong>{money(it.line_total)}</strong></td>
                    <td>
                      <Badge color={it.data_source === 'user_corrected' ? 'teal' : 'gray'}>
                        {it.data_source === 'user_corrected' ? 'User Corrected' : 'OCR Extracted'}
                      </Badge>
                    </td>
                    <td>
                      {it.is_uncertain ? (
                        <span className="badge warning" title={it.uncertainty_reason}>
                          ⚠️ Needs Review
                        </span>
                      ) : (
                        <span className="badge success">✓ Confirmed</span>
                      )}
                    </td>
                    <td>
                      <Button variant="small" onClick={() => handleEditLiveItem(it)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
};
