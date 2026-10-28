import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { categories } from '../utils/constants';
import { money, date } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icon';
import { Button } from '../components/common/Button';
import { CaseSelector } from '../components/navigation/CaseSelector';
import { DraftModel } from '../types';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dossiers';

  const [activeTab, setActiveTab] = useState<'dossiers' | 'affidavit' | 'evidence'>(
    initialTab === 'affidavit' ? 'affidavit' : initialTab === 'evidence' ? 'evidence' : 'dossiers'
  );

  const {
    currentCase,
    caseDocs,
    caseFindings,
    notes,
    drafts,
    setDrafts,
    isDemo,
    showModal,
    activeLiveBill,
    generateLiveReport,
    isLiveLoading,
    showToast
  } = useWorkspace();

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

  const handleTabChange = (tab: 'dossiers' | 'affidavit' | 'evidence') => {
    setActiveTab(tab);
    setSearchParams(tab === 'dossiers' ? {} : { tab });
  };

  const reportTypes: [string, string, string][] = [
    ['Bill Audit Summary', 'audit', 'Case totals, itemized findings and unresolved questions.'],
    ['Potential Discrepancy Report', 'discrepancy', 'Suspected observations requiring provider review, not confirmed errors.'],
    ['Hospital Tariff & Price Comparison', 'pricing', 'Statutory DPCO caps and hospital standard rate comparisons.'],
    ['Document Checklist', 'checklist', 'Documents supplied and additional records to request from hospital.'],
    ['Evidence Summary', 'evidence', 'Document references, source review status, and user notes.'],
    ['Complaint Draft', 'complaint', 'Editable dispute draft prepared in the Complaint & Resolution Assistant.'],
    ['Affidavit Draft', 'affidavit', 'Unsigned factual declaration draft requiring appropriate legal review.']
  ];

  const generateReportText = (key: string): string => {
    return `${isDemo ? 'DEMO DATA — NOT A REAL PATIENT RECORD\n' : ''}BILL SAATHI AI — ${key.toUpperCase()} REPORT
Case: ${currentCase.id} / ${currentCase.name}
Date: ${new Date().toLocaleDateString('en-GB')}
Provider: ${currentCase.hospital}
Review status: ${currentCase.stage}
Billed amount (user supplied / sample): ${money(currentCase.amount)}

DOCUMENTS & REVIEW STATUS
${
  caseDocs
    .map(
      d =>
        `${d.id}: ${d.name}; ${d.status}; source page ${d.sample ? '1' : 'not supplied'}`
    )
    .join('\n') || 'No documents supplied.'
}

${
  key !== 'checklist'
    ? 'FINDINGS / SOURCE REFERENCES\n' +
      (caseFindings
        .map(
          f =>
            `${f.id}: ${f.name}\n${f.why}\nSource ${f.doc}, page ${f.page}; ${f.status}${
              f.note ? '\nUser review note: ' + f.note : ''
            }`
        )
        .join('\n\n') || 'No audit findings; no connected audit service.') +
      '\n\n'
    : ''
}USER NOTES
${notes[currentCase.id] || 'None recorded.'}

UNRESOLVED QUESTIONS
${
  caseFindings
    .filter(f => f.status !== 'Resolved by User')
    .map(f => `${f.id}: ${f.name}`)
    .join('\n') ||
  'No recorded unresolved findings. This does not establish the absence of billing issues.'
}

DOCUMENT CHECKLIST
${categories
  .map(
    cat =>
      `${caseDocs.some(d => d.category === cat) ? '[Selected]' : '[Not supplied]'} ${cat}`
  )
  .join('\n')}

DISCLAIMER
Sample findings are illustrative, not actual AI audit outputs. No independent source verification or official pricing check has been completed. User review is not proof of validity. No confirmed fraud, recovery or overcharging is asserted. This is not medical or legal advice.`;
  };

  const handleDownloadFile = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  };

  const handleExportCsv = () => {
    const rows = [
      ['Finding ID', 'Description', 'Suspected Variance (INR)', 'Category', 'Source Document', 'Source Page', 'Review Status'],
      ...caseFindings.map(f => [
        `"${f.id}"`,
        `"${f.name.replace(/"/g, '""')}"`,
        `"${f.amount ?? 0}"`,
        `"${f.type}"`,
        `"${f.doc}"`,
        `"${f.page}"`,
        `"${f.status}"`
      ])
    ];
    const csvContent = rows.map(r => r.join(',')).join('\n');
    handleDownloadFile(`${currentCase.id}-audit-discrepancies.csv`, csvContent);
    showToast('Exported itemized findings to CSV.');
  };

  const handlePrintText = (text: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.width = '800px';
    iframe.style.height = '600px';
    document.body.appendChild(iframe);
    iframe.contentDocument?.open();
    iframe.contentDocument?.write(
      `<!doctype html><html><head><title>Bill Saathi · Report Preview</title><style>body{font:13px/1.8 Georgia,serif;padding:35px;color:#0f172a}pre{white-space:pre-wrap;font:inherit}</style></head><body><pre>${text.replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c)
      )}</pre></body></html>`
    );
    iframe.contentDocument?.close();
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 60000);
  };

  const handleReviewReport = (key: string) => {
    if (key === 'complaint') {
      navigate('/complaint');
      return;
    }
    if (key === 'affidavit') {
      handleTabChange('affidavit');
      return;
    }

    const text = generateReportText(key);

    showModal(
      'Review report before export',
      <div>
        <p className="note-text">
          Check every source reference and unresolved question.{' '}
          {isDemo && 'This report contains fictional sample records.'}
        </p>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            maxHeight: '390px',
            overflow: 'auto',
            font: '11px/1.8 ui-monospace,monospace',
            background: '#f8fafc',
            padding: '14px',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-md)',
            marginTop: '12px'
          }}
        >
          {text}
        </pre>
      </div>,
      <>
        <Button onClick={() => handlePrintText(text)}>Print / Save PDF</Button>
        <Button
          variant="primary"
          icon="download"
          onClick={() =>
            handleDownloadFile(`${currentCase.id}-${key}.txt`, text)
          }
        >
          Export .txt
        </Button>
      </>
    );
  };

  const handleGeneratePdf = async () => {
    if (!activeLiveBill) {
      showToast('Select an active bill to generate dossier.');
      return;
    }
    const result = await generateLiveReport(activeLiveBill.id);
    if (result?.downloadUrl) {
      const a = document.createElement('a');
      a.href = result.downloadUrl;
      a.download = `BillSaathi-Review-Report-${activeLiveBill.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  // Affidavit Draft Assistant model state
  const affDraftKey = `${isDemo ? 'demo' : 'local'}:${currentCase.id}:affidavit`;
  const affModel: DraftModel = drafts[affDraftKey] || {
    step: 1,
    selected: [],
    account: '',
    text: ''
  };

  const updateAffModel = (patch: Partial<DraftModel>) => {
    setDrafts(prev => ({
      ...prev,
      [affDraftKey]: {
        ...(prev[affDraftKey] || { step: 1, selected: [], account: '', text: '' }),
        ...patch
      }
    }));
  };

  const handleToggleAffFinding = (id: string, checked: boolean) => {
    const nextSelected = checked
      ? [...new Set([...affModel.selected, id])]
      : affModel.selected.filter(x => x !== id);
    updateAffModel({ selected: nextSelected });
  };

  const generateAffidavitTemplate = (): string => {
    const selectedFindings = caseFindings.filter(f => affModel.selected.includes(f.id));

    return `${isDemo ? 'DEMO DATA — NOT A REAL PATIENT RECORD\n' : ''}DRAFT FOR REVIEW — FACTUAL AFFIDAVIT TEMPLATE
Local factual declaration template; no AI model or legal validation was used.
This document is an optional draft requiring appropriate professional legal review. Do not submit as a sworn affidavit without notary or magistrate verification.

Case reference: ${currentCase.id}
Date prepared: ${new Date().toLocaleDateString('en-GB')}

BEFORE THE APPROPRIATE FORUM / AUTHORITY
In the matter of hospital bill review for ${currentCase.hospital}

AFFIDAVIT OF FACTUAL DECLARATION

I, [Deponent Name], aged about [Age] years, residing at [Full Address], do hereby solemnly affirm and state on oath as follows:

1. That I am the patient / attendant in Case Reference ${currentCase.id} and am fully conversant with the facts of the treatment provided at ${currentCase.hospital}.

2. That an inpatient hospital bill dated ${date(currentCase.date)} amounting to ${money(
      currentCase.amount
    )} was issued by the healthcare provider.

3. Factual Chronology of Events:
${affModel.account || '[Insert a dated, chronological account of admission, procedures performed, billing discussions, and payment dates.]'}

4. Observations and Billing Items Requiring Clarification:
${
  selectedFindings.length
    ? selectedFindings
        .map(
          (f, i) =>
            `4.${i + 1} Finding ${f.id}: ${f.name}
   Explanation: ${f.why}
   Document reference: ${f.doc}, page ${f.page}.`
        )
        .join('\n\n')
    : '[Specify the factual observations and corresponding page references from the original bill.]'
}

5. List of Annexures (Supporting Documents):
${
  caseDocs
    .map(
      (d, i) =>
        `Annexure A-${i + 1}: ${d.name} (${d.category}, Doc ID: ${d.id}${
          d.confirmed ? ', confirmed by patient' : ''
        })`
    )
    .join('\n') || '[No annexures added.]'
}

VERIFICATION:
I, the deponent above named, do hereby verify that the contents of paragraphs 1 to 5 above are true and correct to the best of my knowledge and belief, and nothing material has been concealed therefrom.

Verified at [Place] on this [Date] day of [Month], [Year].

DEPONENT

[IMPORTANT: This is an AI-assisted draft, not a sworn or legally validated affidavit. Review it carefully and obtain appropriate legal guidance about execution, attestation, or notarization requirements.]`;
  };

  const handleAffAdvance = () => {
    let nextText = affModel.text;
    if (affModel.step === 2 && !affModel.text) {
      nextText = generateAffidavitTemplate();
    }
    updateAffModel({ step: affModel.step + 1, text: nextText });
  };

  const handleAffExport = () => {
    const checkboxes = document.querySelectorAll('.final-check') as NodeListOf<HTMLInputElement>;
    const allChecked = Array.from(checkboxes).every(c => c.checked);
    if (!allChecked) {
      showToast('Complete each final review item before exporting.');
      return;
    }
    handleDownloadFile(`${currentCase.id}-affidavit-draft.txt`, affModel.text);
    showToast('Affidavit draft exported as plain text. Nothing has been filed or submitted.');
  };

  // Metric calculations
  const totalFindingsCount = caseFindings.length;
  const suspectedVarianceTotal = caseFindings.reduce((sum, f) => sum + (f.amount || 0), 0);
  const unresolvedCount = caseFindings.filter(f => f.status !== 'Resolved by User').length;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Reports & Evidence</h1>
          <p>Hospital bill audit reports, itemized discrepancy evidence, and supported exports.</p>
        </div>
        <CaseSelector />
      </div>

      {/* Main Section Tabs */}
      <div className="section-tabs" role="tablist">
        <button
          className={`section-tab ${activeTab === 'dossiers' ? 'active' : ''}`}
          onClick={() => handleTabChange('dossiers')}
          role="tab"
          aria-selected={activeTab === 'dossiers'}
        >
          <Icon name="reports" />
          <span>Audit Dossiers & Reports</span>
        </button>

        <button
          className={`section-tab ${activeTab === 'affidavit' ? 'active' : ''}`}
          onClick={() => handleTabChange('affidavit')}
          role="tab"
          aria-selected={activeTab === 'affidavit'}
        >
          <Icon name="affidavit" />
          <span>Affidavit & Declaration Draft</span>
        </button>

        <button
          className={`section-tab ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => handleTabChange('evidence')}
          role="tab"
          aria-selected={activeTab === 'evidence'}
        >
          <Icon name="evidence" />
          <span>Supporting Evidence</span>
        </button>
      </div>

      {/* TAB 1: AUDIT DOSSIERS & REPORTS */}
      {activeTab === 'dossiers' && (
        <>
          <div className={`notice ${!isDemo ? 'success' : ''}`.trim()}>
            <Icon name={!isDemo ? 'shield' : 'info'} />
            <span>
              {!isDemo
                ? 'Live Server PDF Generator Active — Official review dossiers are compiled on the server, cryptographically linked to Bill Version and Audit Version, and protected with session authorization.'
                : 'Plain-text report export is implemented locally. The browser print dialog can save a PDF where supported. No server-side PDF, filing or legal validation is connected.'}
            </span>
          </div>

          {/* Audit Metrics & Calculation Summary Card */}
          <div
            className="card padded"
            style={{
              marginBottom: '20px',
              background: '#f8fafc',
              border: '1px solid var(--line)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-muted)' }}>
                  BILL AUDIT CALCULATIONS & EVIDENCE SUMMARY
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: 16 }}>
                  {currentCase.hospital} · {currentCase.name}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button onClick={handleExportCsv} icon="download">
                  Export Findings (.csv)
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleTabChange('affidavit')}
                  icon="affidavit"
                >
                  Draft Affidavit
                </Button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16,
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid var(--line)'
              }}
            >
              <div>
                <small className="muted" style={{ display: 'block', fontSize: 11 }}>Billed Invoice Total</small>
                <strong style={{ fontSize: 18, color: 'var(--navy)' }}>{money(currentCase.amount)}</strong>
              </div>
              <div>
                <small className="muted" style={{ display: 'block', fontSize: 11 }}>Identified Suspected Variance</small>
                <strong style={{ fontSize: 18, color: suspectedVarianceTotal > 0 ? '#d97706' : 'var(--navy)' }}>
                  {suspectedVarianceTotal > 0 ? money(suspectedVarianceTotal) : 'None flagged'}
                </strong>
              </div>
              <div>
                <small className="muted" style={{ display: 'block', fontSize: 11 }}>Audit Discrepancies</small>
                <strong style={{ fontSize: 18, color: 'var(--navy)' }}>{totalFindingsCount} item(s)</strong>
              </div>
              <div>
                <small className="muted" style={{ display: 'block', fontSize: 11 }}>Unresolved Questions</small>
                <strong style={{ fontSize: 18, color: unresolvedCount > 0 ? '#dc2626' : 'var(--teal)' }}>
                  {unresolvedCount} pending
                </strong>
              </div>
            </div>
          </div>

          <div className="report-grid">
            {!isDemo && activeLiveBill && (
              <section className="card padded" style={{ border: '2px solid var(--brand, #0d9488)' }}>
                <span className="icon-box" style={{ background: '#ecfdf5', color: '#0d9488' }}>
                  <Icon name="reports" />
                </span>
                <h3>Official Medical Bill Review Dossier (PDF)</h3>
                <p className="muted">
                  Evidence-based arithmetic, duplicate detection, and statutory DPCO/benchmark comparison report compiled by the backend verification engine.
                </p>
                <div style={{ margin: '8px 0' }}>
                  <Badge>
                    Bill v{activeLiveBill.version} · Audit v{activeLiveBill.audit_version}
                  </Badge>
                  {activeLiveBill.version > activeLiveBill.audit_version && activeLiveBill.audit_version > 0 && (
                    <span className="badge warning" style={{ marginLeft: '6px' }}>
                      Auto-refreshes outdated audit
                    </span>
                  )}
                </div>
                <div className="actions" style={{ marginTop: '16px' }}>
                  <Button
                    variant="primary"
                    icon="download"
                    disabled={isLiveLoading}
                    onClick={handleGeneratePdf}
                  >
                    {isLiveLoading ? 'Compiling Dossier...' : 'Download Official Dossier (PDF)'}
                  </Button>
                </div>
              </section>
            )}

            {reportTypes.map(([t, key, d]) => {
              const draftKey = `${isDemo ? 'demo' : 'local'}:${currentCase.id}:${key}`;
              const isDraftKey = key === 'complaint' || key === 'affidavit';
              const draftBadge = isDraftKey
                ? drafts[draftKey]?.text
                  ? 'Draft for Review'
                  : 'Not prepared'
                : isDemo
                ? 'Sample data'
                : 'Local data';

              return (
                <section key={key} className="card padded">
                  <span className="icon-box">
                    <Icon
                      name={
                        key === 'complaint'
                          ? 'complaint'
                          : key === 'affidavit'
                          ? 'affidavit'
                          : key === 'pricing'
                          ? 'price'
                          : 'reports'
                      }
                    />
                  </span>
                  <h3>{t}</h3>
                  <p className="muted">{d}</p>
                  <Badge>{draftBadge}</Badge>
                  <div className="actions" style={{ marginTop: '20px' }}>
                    <Button
                      icon={key === 'affidavit' ? 'affidavit' : key === 'complaint' ? 'arrow' : 'eye'}
                      onClick={() => handleReviewReport(key)}
                    >
                      {key === 'affidavit' ? 'Draft declaration' : key === 'complaint' ? 'Open assistant' : 'Review report'}
                    </Button>
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}

      {/* TAB 2: AFFIDAVIT & DECLARATION DRAFT ASSISTANT */}
      {activeTab === 'affidavit' && (
        <div>
          <div className="notice warning" style={{ marginBottom: 20 }}>
            <Icon name="warning" />
            <span>
              <strong>Draft Legal Notice:</strong> This is an AI-assisted draft declaration for patient review, not an officially valid or sworn legal affidavit. Review it carefully and obtain appropriate legal guidance about execution, attestation, or notarization requirements before presenting to any authority.
            </span>
          </div>

          <div className="card padded">
            <div className="wizard-top">
              {['Select concerns', 'Factual summary', 'Edit draft', 'Review & export'].map((s, i) => (
                <span
                  key={s}
                  className={
                    affModel.step === i + 1
                      ? 'active'
                      : affModel.step > i + 1
                      ? 'complete'
                      : undefined
                  }
                >
                  {i + 1}. {s}
                </span>
              ))}
            </div>

            {affModel.step === 1 && (
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>
                  Choose observations to include in affidavit draft
                </h3>
                <p className="note-text" style={{ marginBottom: '14px' }}>
                  Select audit findings from your hospital bill that you want reflected in this factual declaration draft.
                </p>
                {caseFindings.length ? (
                  caseFindings.map(f => (
                    <label key={f.id} className="check">
                      <input
                        type="checkbox"
                        checked={affModel.selected.includes(f.id)}
                        onChange={e => handleToggleAffFinding(f.id, e.target.checked)}
                      />
                      <span>
                        <strong>{f.name}</strong>{' '}
                        {f.amount && <span className="badge amber">{money(f.amount)}</span>}
                        <span className="source-pill" style={{ marginLeft: 6 }}>
                          {f.id} · {f.doc}, p.{f.page}
                        </span>
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="note-text">
                    No audit findings recorded. A blank factual template will be prepared.
                  </p>
                )}
                <label htmlFor="aff-draft-account" style={{ marginTop: '20px' }}>
                  Factual Chronology / Deposition Notes (optional)
                </label>
                <textarea
                  id="aff-draft-account"
                  placeholder="Record dated facts, conversations with hospital administrators, or disputed charges…"
                  value={affModel.account || ''}
                  onChange={e => updateAffModel({ account: e.target.value })}
                ></textarea>
              </div>
            )}

            {affModel.step === 2 && (
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>
                  Review factual summary for affidavit
                </h3>
                <p className="note-text">
                  <strong>Case:</strong> {currentCase.name} · {currentCase.id}
                </p>
                <p className="note-text">
                  <strong>Hospital:</strong> {currentCase.hospital}
                </p>
                <p className="note-text">
                  <strong>Bill Date & Amount:</strong> {date(currentCase.date)} · {money(currentCase.amount)}
                </p>
                <p className="note-text">
                  <strong>Patient account:</strong> {affModel.account || 'Not provided. Standard placeholder inserted.'}
                </p>
                <div style={{ marginTop: 12 }}>
                  <strong>Included Observations ({affModel.selected.length}):</strong>
                  {affModel.selected.map(id => {
                    const f = caseFindings.find(x => x.id === id);
                    return f ? (
                      <p key={id} className="note-text">
                        • {f.name} — {f.doc}, page {f.page} {f.amount && `(${money(f.amount)})`}
                      </p>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {affModel.step === 3 && (
              <div>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px' }}>Affidavit Draft for Review</h3>
                  <span className="badge gray">Draft Declaration · Requires Review</span>
                </div>
                <label className="sr-only" htmlFor="aff-draft-editor">
                  Editable affidavit draft
                </label>
                <textarea
                  className="draft"
                  id="aff-draft-editor"
                  value={affModel.text}
                  onChange={e => updateAffModel({ text: e.target.value })}
                ></textarea>
                <p className="inline-note">
                  Edits are kept in this session. Review with appropriate legal counsel before attestation.
                </p>
              </div>
            )}

            {affModel.step === 4 && (
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>
                  Final review checklist
                </h3>
                {[
                  'I checked every factual statement against the original medical documents.',
                  'I understand this is an unsigned draft and not an officially valid or sworn legal affidavit.',
                  'I will seek independent legal counsel regarding execution, notary, and attestation.',
                  'I confirm that all financial figures correspond to actual bills in my possession.'
                ].map((t, idx) => (
                  <label key={idx} className="check">
                    <input type="checkbox" className="final-check" />
                    {t}
                  </label>
                ))}

                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    font: '12px/1.8 Georgia,serif',
                    background: '#f8fafc',
                    padding: '20px',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-md)',
                    maxHeight: '360px',
                    overflow: 'auto',
                    margin: '16px 0'
                  }}
                >
                  {affModel.text}
                </pre>

                <div className="actions">
                  <Button
                    variant="primary"
                    icon="download"
                    onClick={handleAffExport}
                  >
                    Export draft (.txt)
                  </Button>
                  <Button icon="file" onClick={() => handlePrintText(affModel.text)}>
                    Print / Save as PDF
                  </Button>
                </div>
              </div>
            )}

            <div className="actions" style={{ justifyContent: 'space-between', marginTop: '24px' }}>
              {affModel.step > 1 ? (
                <Button onClick={() => updateAffModel({ step: affModel.step - 1 })}>Back</Button>
              ) : (
                <span></span>
              )}

              {affModel.step < 4 ? (
                <Button variant="primary" icon="arrow" onClick={handleAffAdvance}>
                  {affModel.step === 2 ? 'Prepare local template' : 'Continue'}
                </Button>
              ) : (
                <Button onClick={() => handleTabChange('dossiers')}>
                  Back to Audit Dossiers
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUPPORTING EVIDENCE */}
      {activeTab === 'evidence' && (
        <div>
          <div className="two-col" style={{ marginBottom: 20 }}>
            <section className="card padded">
              <h3 style={{ fontSize: '14px', marginTop: 0, fontWeight: 700 }}>
                Evidence & Document Summary
              </h3>
              <p className="note-text">
                <strong>Documents attached:</strong> {caseDocs.length} record(s) in this case.
              </p>
              <p className="note-text">
                <strong>Verified by patient:</strong> {caseDocs.filter(d => d.confirmed).length} confirmed.
              </p>
              <p className="note-text">
                <strong>Linked findings:</strong> {caseFindings.length} flagged observation(s).
              </p>
              <p className="note-text">
                <strong>Evidence Notes:</strong> {notes[currentCase.id] || 'None recorded yet.'}
              </p>
              <div className="actions" style={{ marginTop: 16 }}>
                <Button variant="primary" onClick={() => navigate('/evidence')}>
                  Open Full Evidence Center
                </Button>
                <Button onClick={() => navigate('/upload')}>
                  Upload More Documents
                </Button>
              </div>
            </section>

            <section className="card padded">
              <h3 style={{ fontSize: '14px', marginTop: 0, fontWeight: 700 }}>
                Evidence Document Checklist
              </h3>
              <div style={{ maxHeight: 220, overflow: 'auto' }}>
                {caseDocs.map(d => (
                  <div key={d.id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                    <strong>{d.name}</strong>
                    <div style={{ color: 'var(--text-muted)' }}>
                      {d.id} · {d.category} · <Badge>{d.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      <div className="padded" style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9' }}>
        <p className="note-text">
          <strong>Legal & Medical Notice:</strong> Medical Bill Review Reports, Dossiers, and Draft Declarations are generated for billing transparency, arithmetic auditing, and insurance dispute support. They do not constitute an official court affidavit, judicial ruling, or definitive determination of fraud.
        </p>
      </div>
    </>
  );
};
