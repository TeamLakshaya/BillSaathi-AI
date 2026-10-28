import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { DraftModel } from '../types';
import { money, date } from '../utils/formatters';
import { Icon } from '../components/common/Icon';
import { Button } from '../components/common/Button';
import { CaseSelector } from '../components/navigation/CaseSelector';

interface DraftsPageProps {
  type: 'complaint' | 'affidavit';
}

const DEFAULT_RECIPIENTS = [
  'Hospital Billing & Accounts Department',
  'Medical Superintendent / Grievance Redressal Committee',
  'District Consumer Disputes Redressal Commission (DCDRC)',
  'Insurance TPA / Health Insurance Grievance Cell',
  'Other / Custom Recipient'
];

const DEFAULT_REASONS = [
  'Arithmetic discrepancy between line items and total billed',
  'Duplicate charges for same clinical procedure or diagnostic test',
  'Package tariff billing discrepancy (package inclusions billed separately)',
  'Charges exceeding published tariff schedule or DPCO caps',
  'Unexplained pharmacy or miscellaneous diagnostic charges',
  'Other / Custom Dispute Reason'
];

export const DraftsPage: React.FC<DraftsPageProps> = ({ type }) => {
  const navigate = useNavigate();
  const { currentCase, caseDocs, caseFindings, drafts, setDrafts, isDemo, showToast } =
    useWorkspace();

  const isAff = type === 'affidavit';
  const title = isAff ? 'Affidavit draft assistant' : 'Complaint & Resolution Assistant';

  const draftKey = `${isDemo ? 'demo' : 'local'}:${currentCase?.id}:${type}`;
  const model: DraftModel = drafts[draftKey] || {
    step: 1,
    selected: [],
    account: '',
    recipient: DEFAULT_RECIPIENTS[0],
    reason: DEFAULT_REASONS[0],
    text: ''
  };

  const [customRecipient, setCustomRecipient] = useState('');
  const [customReason, setCustomReason] = useState('');

  const updateModel = (patch: Partial<DraftModel>) => {
    setDrafts(prev => ({
      ...prev,
      [draftKey]: {
        ...(prev[draftKey] || {
          step: 1,
          selected: [],
          account: '',
          recipient: DEFAULT_RECIPIENTS[0],
          reason: DEFAULT_REASONS[0],
          text: ''
        }),
        ...patch
      }
    }));
  };

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

  const handleToggleFinding = (id: string, checked: boolean) => {
    const nextSelected = checked
      ? [...new Set([...model.selected, id])]
      : model.selected.filter(x => x !== id);
    updateModel({ selected: nextSelected });
  };

  const generateDraftTemplate = (): string => {
    const selectedFindings = caseFindings.filter(f => model.selected.includes(f.id));
    const recipient =
      model.recipient === 'Other / Custom Recipient' && customRecipient
        ? customRecipient
        : model.recipient || DEFAULT_RECIPIENTS[0];
    const reason =
      model.reason === 'Other / Custom Dispute Reason' && customReason
        ? customReason
        : model.reason || DEFAULT_REASONS[0];

    if (isAff) {
      return `${isDemo ? 'DEMO DATA — NOT A REAL PATIENT RECORD\n' : ''}DRAFT FOR REVIEW — FACTUAL AFFIDAVIT TEMPLATE
Local factual declaration template; no AI model or legal validation was used.
This document is a draft requiring appropriate professional legal review. Do not submit as a sworn affidavit without notary or magistrate verification.

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
${model.account || '[Insert a dated, chronological account of admission, procedures performed, billing discussions, and payment dates.]'}

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
    }

    return `${isDemo ? 'DEMO DATA — NOT A REAL PATIENT RECORD\n' : ''}FORMAL BILLING CLARIFICATION & RESOLUTION NOTICE
Prepared via Bill Saathi AI Complaint & Resolution Assistant.
Draft for patient review — no automatic submission has occurred.

Date: ${new Date().toLocaleDateString('en-GB')}
Case Reference: ${currentCase.id}
Patient / Account: ${currentCase.name}

TO:
${recipient}
${currentCase.hospital}

SUBJECT: Request for billing clarification, itemized reconciliation, and grievance redressal regarding Invoice dated ${date(currentCase.date)} (Total: ${money(currentCase.amount)})

PRIMARY GRIEVANCE:
${reason}

1. ADMISSION & BILLING DETAILS:
The case information records a hospital bill dated ${date(currentCase.date)} with a billed total of ${money(
      currentCase.amount
    )} issued by ${currentCase.hospital}.

2. PATIENT FACTUAL ACCOUNT & CHRONOLOGY:
${model.account || 'The patient / complainant received the itemized invoice and identified specific line items and calculations requiring review and written clarification.'}

3. SPECIFIC FINDINGS & DISCREPANCIES REQUIRING CLARIFICATION:
${
  selectedFindings.length
    ? selectedFindings
        .map(
          (f, i) =>
            `3.${i + 1} Finding #${f.id}: ${f.name}
   - Details: ${f.why}
   - Suspected Variance: ${f.amount ? money(f.amount) : 'To be determined upon itemized review'}
   - Document Reference: Document ${f.doc}, Page ${f.page}
   - Finding Category: ${f.type.toUpperCase()}`
        )
        .join('\n\n')
    : 'No specific findings selected. Please review itemized entries with provider.'
}

4. SUPPORTING DOCUMENT CHECKLIST:
${
  caseDocs
    .map(
      d =>
        `- [${d.confirmed ? 'VERIFIED' : 'ATTACHED'}] ${d.name} (${d.category}, ID: ${d.id}${
          d.sample ? '; synthetic sample' : ''
        })`
    )
    .join('\n') || '- No supporting documents added.'
}

5. REQUESTED RESOLUTIONS:
a. Provide a complete, itemized billing reconciliation ledger with individual rates and units.
b. Reconcile any arithmetic variance between line item sums and the final billed total.
c. Credit or refund any duplicate charges or items covered under standard package tariff inclusions.
d. Issue a revised, itemized final bill and updated payment receipt.

6. RECOMMENDED RESOLUTION TIMELINE:
We respectfully request a written response and reconciled statement within 10 to 14 business days from receipt of this notice. If unresolved, the patient reserves the right to escalate this matter along with the official Bill Saathi Review Dossier to the Consumer Disputes Redressal Commission or appropriate regulatory authorities.

Place: [Place]
Date: [Date]
Complainant Name: [Complainant Name]
Signature: ___________________________
(To be signed only after careful review)

DISCLAIMER: This is an unsigned draft prepared for patient dispute resolution. No legal representation, court filing, or formal accusation of fraud is asserted.`;
  };

  const handleAdvance = () => {
    let nextText = model.text;
    if (model.step === 2 && !model.text) {
      nextText = generateDraftTemplate();
    }
    updateModel({ step: model.step + 1, text: nextText });
  };

  const handleStepBack = () => {
    updateModel({ step: model.step - 1 });
  };

  const checkFinalCheckboxes = (): boolean => {
    const checkboxes = document.querySelectorAll('.final-check') as NodeListOf<HTMLInputElement>;
    const allChecked = Array.from(checkboxes).every(c => c.checked);
    if (!allChecked) {
      showToast('Complete each final review item before exporting.');
      return false;
    }
    return true;
  };

  const handleExportDraft = () => {
    if (!checkFinalCheckboxes()) return;
    const blob = new Blob([model.text], { type: 'text/plain' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `${currentCase.id}-${type}-draft.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
    showToast('Draft exported as plain text. Nothing has been submitted.');
  };

  const handlePrintDraft = () => {
    if (!checkFinalCheckboxes()) return;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.width = '800px';
    iframe.style.height = '600px';
    document.body.appendChild(iframe);
    iframe.contentDocument?.open();
    iframe.contentDocument?.write(
      `<!doctype html><html><head><title>Bill Saathi · Report Preview</title><style>body{font:13px/1.8 Georgia,serif;padding:35px;color:#0f172a}pre{white-space:pre-wrap;font:inherit}</style></head><body><pre>${model.text.replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c)
      )}</pre></body></html>`
    );
    iframe.contentDocument?.close();
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 60000);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          {isAff && (
            <div style={{ marginBottom: 6 }}>
              <Link
                to="/reports"
                style={{
                  color: 'var(--brand, #0d9488)',
                  textDecoration: 'none',
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Icon name="left" style={{ width: 12, height: 12 }} />
                <span>Reports & Evidence</span>
              </Link>
            </div>
          )}
          <h1>{title}</h1>
          <p>
            {isAff
              ? 'Prepare an optional factual declaration draft under Reports & Evidence. Requires independent legal review.'
              : 'Build a structured billing clarification or dispute draft with recipient selection, reason, and recommended next steps.'}
          </p>
        </div>
        <CaseSelector />
      </div>

      <div className="notice warning">
        <Icon name="warning" />
        <span>
          {isAff
            ? 'This is an AI-assisted draft, not a sworn or legally validated affidavit. Review it carefully and obtain appropriate legal guidance about execution, attestation, or notarization requirements.'
            : 'Draft for Review — no complaint is automatically submitted. Formulate factual, evidence-backed inquiries for the healthcare provider or authority.'}
        </span>
      </div>

      <div className="card padded">
        <div className="wizard-top">
          {['Select concerns', 'Factual summary', 'Edit draft', 'Review & export'].map((s, i) => (
            <span
              key={s}
              className={
                model.step === i + 1
                  ? 'active'
                  : model.step > i + 1
                  ? 'complete'
                  : undefined
              }
            >
              {i + 1}. {s}
            </span>
          ))}
        </div>

        {model.step === 1 && (
          <div>
            <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>
              {isAff ? 'Choose what to include in declaration' : 'Select findings and complaint details'}
            </h3>
            <p className="note-text" style={{ marginBottom: '14px' }}>
              Findings from your bill audit are linked below. Check the items you wish to include in your draft.
            </p>

            {/* Recipient & Reason Selection for Complaint */}
            {!isAff && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '20px'
                }}
              >
                <h4 style={{ margin: '0 0 12px', fontSize: '13.5px', fontWeight: 700 }}>
                  Complaint Recipient & Primary Reason
                </h4>
                <div className="two-col" style={{ gap: '16px' }}>
                  <div>
                    <label htmlFor="complaint-recipient" style={{ fontWeight: 600, fontSize: 12 }}>
                      Complaint Recipient
                    </label>
                    <select
                      id="complaint-recipient"
                      value={model.recipient || DEFAULT_RECIPIENTS[0]}
                      onChange={e => updateModel({ recipient: e.target.value })}
                      style={{ width: '100%', marginTop: 4 }}
                    >
                      {DEFAULT_RECIPIENTS.map(r => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    {model.recipient === 'Other / Custom Recipient' && (
                      <input
                        type="text"
                        placeholder="Enter recipient name, authority, or email…"
                        value={customRecipient}
                        onChange={e => setCustomRecipient(e.target.value)}
                        style={{ marginTop: 8, width: '100%' }}
                      />
                    )}
                  </div>

                  <div>
                    <label htmlFor="complaint-reason" style={{ fontWeight: 600, fontSize: 12 }}>
                      Primary Reason / Grounds
                    </label>
                    <select
                      id="complaint-reason"
                      value={model.reason || DEFAULT_REASONS[0]}
                      onChange={e => updateModel({ reason: e.target.value })}
                      style={{ width: '100%', marginTop: 4 }}
                    >
                      {DEFAULT_REASONS.map(r => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    {model.reason === 'Other / Custom Dispute Reason' && (
                      <input
                        type="text"
                        placeholder="Describe specific grounds for dispute…"
                        value={customReason}
                        onChange={e => setCustomReason(e.target.value)}
                        style={{ marginTop: 8, width: '100%' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {caseFindings.length ? (
              caseFindings.map(f => (
                <label key={f.id} className="check">
                  <input
                    type="checkbox"
                    checked={model.selected.includes(f.id)}
                    onChange={e => handleToggleFinding(f.id, e.target.checked)}
                  />
                  <span>
                    <strong>{f.name}</strong>{' '}
                    {f.amount && (
                      <span className="badge amber" style={{ marginLeft: 6 }}>
                        {money(f.amount)}
                      </span>
                    )}
                    <span className="source-pill" style={{ marginLeft: 8 }}>
                      {f.id} · {f.doc}, p.{f.page}
                    </span>
                  </span>
                </label>
              ))
            ) : (
              <p className="note-text">
                No audit findings recorded yet. You can still prepare a factual draft based on your account.
              </p>
            )}

            <label htmlFor="draft-account" style={{ marginTop: '20px' }}>
              Your factual account (optional)
            </label>
            <textarea
              id="draft-account"
              placeholder="Only describe facts you can support with records (dates, communications, admissions). Avoid unnecessary sensitive personal data in prototypes."
              value={model.account || ''}
              onChange={e => updateModel({ account: e.target.value })}
            ></textarea>
          </div>
        )}

        {model.step === 2 && (
          <div>
            <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>
              Check the factual summary
            </h3>
            <p className="note-text">
              <strong>Case:</strong> {currentCase.name} · {currentCase.id}
            </p>
            <p className="note-text">
              <strong>Provider:</strong> {currentCase.hospital}
            </p>
            <p className="note-text">
              <strong>Bill date:</strong> {date(currentCase.date)} ·{' '}
              <strong>Amount:</strong> {money(currentCase.amount)}
            </p>
            {!isAff && (
              <>
                <p className="note-text">
                  <strong>Addressed to:</strong>{' '}
                  {model.recipient === 'Other / Custom Recipient' && customRecipient
                    ? customRecipient
                    : model.recipient || DEFAULT_RECIPIENTS[0]}
                </p>
                <p className="note-text">
                  <strong>Dispute reason:</strong>{' '}
                  {model.reason === 'Other / Custom Dispute Reason' && customReason
                    ? customReason
                    : model.reason || DEFAULT_REASONS[0]}
                </p>
              </>
            )}
            <p className="note-text">
              <strong>User-provided account:</strong>{' '}
              {model.account || 'Not supplied. Standard factual placeholder will be included.'}
            </p>
            <div style={{ marginTop: '12px' }}>
              <strong>Selected findings ({model.selected.length}):</strong>
              {model.selected.length === 0 && (
                <p className="note-text" style={{ fontStyle: 'italic' }}>
                  No individual findings checked.
                </p>
              )}
              {model.selected.map(id => {
                const f = caseFindings.find(x => x.id === id);
                return f ? (
                  <p key={id} className="note-text">
                    • <strong>{f.name}</strong> — {f.doc}, page {f.page}
                    {f.amount && <span> ({money(f.amount)})</span>}
                  </p>
                ) : null;
              })}
            </div>
            <div className="notice" style={{ marginTop: '16px' }}>
              <Icon name="info" />
              <span>
                Draft generation compiles your selected findings and account into a structured, courteous request for itemized clarification.
              </span>
            </div>
          </div>
        )}

        {model.step === 3 && (
          <div>
            <div
              className="row"
              style={{ justifyContent: 'space-between', marginBottom: '12px' }}
            >
              <h3 style={{ fontSize: '15px' }}>Draft for Review</h3>
              <span className="badge gray">
                {isAff ? 'Draft Declaration' : 'Structured Complaint'} · {isDemo ? 'Demo Data' : 'Review Required'}
              </span>
            </div>
            <label className="sr-only" htmlFor="draft-editor">
              Editable draft
            </label>
            <textarea
              className="draft"
              id="draft-editor"
              value={model.text}
              onChange={e => updateModel({ text: e.target.value })}
            ></textarea>
            <p className="inline-note">
              You maintain complete control over every word. Edits are retained locally in your session.
            </p>
          </div>
        )}

        {model.step === 4 && (
          <div>
            <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>
              Final review checklist
            </h3>
            {[
              'I checked every factual statement against the original documents.',
              'I understand unresolved flags are not proven errors or findings of fraud.',
              'I will verify the recipient, procedure and any execution requirements independently.',
              'I understand this is an unsigned draft and is not automatically submitted.'
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
              {model.text}
            </pre>

            {/* Recommended Next Steps & Supporting Document Checklist */}
            {!isAff && (
              <div className="resolution-guide">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Icon name="shield" style={{ color: 'var(--brand, #0d9488)' }} />
                  <strong style={{ fontSize: '13.5px' }}>
                    Recommended Next Steps & Resolution Checklist
                  </strong>
                </div>
                <div className="resolution-step-list">
                  <div className="resolution-step-item">
                    <span className="resolution-step-num">1</span>
                    <div>
                      <strong>Formal Notice Delivery:</strong> Export or print this notice and submit it to the hospital billing grievance desk or via registered email.
                    </div>
                  </div>
                  <div className="resolution-step-item">
                    <span className="resolution-step-num">2</span>
                    <div>
                      <strong>Documentary Acknowledgment:</strong> Secure a dated receiving stamp, grievance token number, or email acknowledgment from the provider.
                    </div>
                  </div>
                  <div className="resolution-step-item">
                    <span className="resolution-step-num">3</span>
                    <div>
                      <strong>Reconciliation Window:</strong> Allow 7 to 15 business days for internal medical audit and ledger reconciliation by the accounts department.
                    </div>
                  </div>
                  <div className="resolution-step-item">
                    <span className="resolution-step-num">4</span>
                    <div>
                      <strong>Escalation Ready:</strong> If the hospital fails to provide itemized justification, compile the Bill Saathi Review Dossier (PDF) and approach the District Consumer Disputes Redressal Commission or Insurance Ombudsman.
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  <strong style={{ fontSize: 12 }}>Attached Supporting Documents:</strong>
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    {caseDocs.length
                      ? caseDocs.map(d => `${d.id}: ${d.name} (${d.category})`).join(' · ')
                      : 'No documents attached yet.'}
                  </div>
                </div>
              </div>
            )}

            <div className="actions">
              <Button
                variant="primary"
                icon="download"
                onClick={handleExportDraft}
              >
                Export draft (.txt)
              </Button>
              <Button icon="file" onClick={handlePrintDraft}>
                Print / Save as PDF
              </Button>
            </div>
            <p className="inline-note">
              Print opens the browser print dialog; PDF availability depends on your browser.
            </p>
          </div>
        )}

        <div
          className="actions"
          style={{ justifyContent: 'space-between', marginTop: '24px' }}
        >
          {model.step > 1 ? (
            <Button onClick={handleStepBack}>Back</Button>
          ) : (
            <span></span>
          )}

          {model.step < 4 ? (
            <Button variant="primary" icon="arrow" onClick={handleAdvance}>
              {model.step === 2 ? 'Prepare local template' : 'Continue'}
            </Button>
          ) : (
            <Button onClick={() => navigate('/reports')}>
              Reports & Evidence
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

