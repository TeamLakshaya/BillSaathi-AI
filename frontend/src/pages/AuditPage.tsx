import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { AuditFinding } from '../types';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icon';
import { Button } from '../components/common/Button';
import { CaseSelector } from '../components/navigation/CaseSelector';
import { money } from '../utils/formatters';

export const AuditPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentCase,
    caseFindings,
    updateFinding,
    isDemo,
    showModal,
    closeModal,
    showToast,
    addActivity,
    showUnavailable,
    activeLiveBill,
    liveVerification,
    runLiveAudit,
    isLiveLoading
  } = useWorkspace();

  const [auditFilter, setAuditFilter] = useState('all');

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

  const filteredFindings = caseFindings.filter(f => {
    if (auditFilter === 'all') return true;
    if (auditFilter === 'unresolved') return f.status !== 'Resolved by User';
    return f.type === auditFilter;
  });

  const handleViewEvidence = (f: AuditFinding) => {
    showModal(
      `Finding ${f.id}`,
      <div>
        <p>
          <strong>{f.name}</strong>
        </p>
        <p style={{ margin: '8px 0' }}>{f.why}</p>
        <p>
          Source: {f.doc} · page {f.page} · <strong>Demo Data</strong>
        </p>
        <p className="note-text">
          This is an illustrative observation, not a verified allegation.
        </p>
      </div>,
      <Button
        variant="primary"
        onClick={() => {
          closeModal();
          navigate(`/upload`);
        }}
      >
        Open source
      </Button>
    );
  };

  const handleResolveClick = (f: AuditFinding) => {
    let noteValue = '';

    showModal(
      'Record your review',
      <div>
        <p>
          Mark this observation as reviewed by you. This records your action; it does not establish
          that the charge is valid or invalid.
        </p>
        <label htmlFor="resolution-note" style={{ marginTop: '14px' }}>
          Review note (required)
        </label>
        <textarea
          id="resolution-note"
          placeholder="What did you check, and what remains uncertain?"
          onChange={e => {
            noteValue = e.target.value;
          }}
        />
      </div>,
      <Button
        variant="primary"
        onClick={() => {
          const noteEl = document.getElementById('resolution-note') as HTMLTextAreaElement;
          const note = (noteEl?.value ?? noteValue).trim();
          if (!note) {
            showToast('Add a review note first.');
            return;
          }
          updateFinding(f.id, {
            status: 'Resolved by User',
            note
          });
          addActivity('Finding review recorded locally');
          closeModal();
          showToast(
            'User review recorded locally; no automated verification was performed.'
          );
        }}
      >
        Save review
      </Button>
    );
  };

  const handleRunAudit = async () => {
    if (!activeLiveBill) {
      showToast('No active bill selected to audit.');
      return;
    }
    await runLiveAudit(activeLiveBill.id);
  };

  const miniCards = !isDemo && liveVerification
    ? [
        { label: 'Total bill amount', val: money(liveVerification.total_billed) },
        { label: 'Line items calculated', val: money(liveVerification.calculated_items_total) },
        { label: 'Arithmetic check', val: liveVerification.arithmetic_valid ? 'Valid (✓)' : 'Discrepancy (❌)' },
        { label: 'Verified discrepancies', val: String(liveVerification.total_verified_discrepancies) },
        { label: 'Items needing review', val: String(liveVerification.total_review_items) },
        { label: 'Tax & discount audit', val: `Tax: ${money(liveVerification.tax_amount || 0)} | Disc: ${money(liveVerification.discount_amount || 0)}` }
      ]
    : [
        { label: 'Total bill amount', val: money(currentCase.amount) },
        {
          label: 'Total of itemized entries',
          val: currentCase.id === 'BS-1024' ? '₹84,000' : 'Not available'
        },
        {
          label: 'Arithmetic differences',
          val: String(caseFindings.filter(f => f.type === 'arithmetic').length)
        },
        {
          label: 'Potential duplicate entries',
          val: String(caseFindings.filter(f => f.type === 'duplicate').length)
        },
        {
          label: 'Medical-record review',
          val: String(caseFindings.filter(f => f.type === 'medical').length)
        },
        { label: 'Price-reference review', val: 'Not performed' }
      ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Bill audit</h1>
          <p>Understand the questions. Inspect the evidence. Decide the next step.</p>
        </div>
        <CaseSelector />
      </div>

      {!isDemo && activeLiveBill && (activeLiveBill.is_audit_outdated || (activeLiveBill.version > activeLiveBill.audit_version && activeLiveBill.audit_version > 0)) ? (
        <div className="notice warning">
          <Icon name="warning" />
          <span>
            ⚠️ Audit Outdated: Bill items were modified (Bill v{activeLiveBill.version} vs Audit v{activeLiveBill.audit_version}). Click "Run bill audit" to recalculate deterministic findings.
          </span>
        </div>
      ) : !isDemo && liveVerification ? (
        <div className="notice success">
          <Icon name="shield" />
          <span>
            Deterministic Audit Complete · Bill v{liveVerification.bill_version} · Rule v2.0 · Status: {liveVerification.overall_status.toUpperCase()}
          </span>
        </div>
      ) : !isDemo ? (
        <div className="notice">
          <Icon name="info" />
          <span>
            Deterministic Verification Ready · Verify line arithmetic, GST/discounts, DPCO statutory ceilings, and clinical duplicates.
          </span>
        </div>
      ) : (
        <div className={`notice ${caseFindings.length ? '' : 'warning'}`.trim()}>
          <Icon name={caseFindings.length ? 'info' : 'warning'} />
          <span>
            {caseFindings.length
              ? 'Illustrative sample findings — not produced by a live audit service. A flag is not proof of an invalid charge, fraud or overcharging.'
              : 'No audit has been run. The backend audit service is not connected. Local document review does not produce automated findings.'}
          </span>
        </div>
      )}

      <div className="audit-mini">
        {miniCards.map(item => (
          <div key={item.label} className="card">
            <small>{item.label}</small>
            <strong>{item.val}</strong>
            {isDemo && <span className="badge gray">Sample data</span>}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Findings requiring a closer look</h2>
            <p>Review dates, quantities, descriptions and source pages.</p>
          </div>
          <Button
            variant="primary"
            icon="audit"
            disabled={isLiveLoading}
            onClick={
              isDemo
                ? () => showUnavailable('Bill audit', 'POST /api/cases/:id/audits')
                : handleRunAudit
            }
          >
            {isLiveLoading ? 'Auditing...' : 'Run bill audit'}
          </Button>
        </div>

        <div className="table-tools">
          <select
            aria-label="Filter audit findings"
            value={auditFilter}
            onChange={e => setAuditFilter(e.target.value)}
          >
            <option value="all">All findings</option>
            <option value="unresolved">Unresolved</option>
            <option value="arithmetic">Arithmetic verification</option>
            <option value="duplicate">Potential duplicates</option>
            <option value="medical">Medical-record cross-check</option>
            <option value="package">Package / insurance review</option>
          </select>
        </div>

        {!isDemo ? (
          liveVerification && liveVerification.results.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>FINDING</th>
                    <th>AMOUNT INVOLVED</th>
                    <th>WHY IT WAS FLAGGED</th>
                    <th>SOURCE & EVIDENCE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {liveVerification.results.map(res => (
                    <tr key={res.id}>
                      <td>
                        <strong>{res.bill_item?.description || 'Bill Arithmetic Check'}</strong>
                        <small>Bill v{res.bill_version} · Rule v{res.rule_version}</small>
                      </td>
                      <td className="money">
                        {money(res.billed_amount)}
                        {res.difference_amount != null && res.difference_amount > 0 && (
                          <small style={{ display: 'block', color: 'var(--red, #dc2626)' }}>
                            Diff: {money(res.difference_amount)}
                          </small>
                        )}
                      </td>
                      <td className="item-note">{res.reason}</td>
                      <td>
                        {res.evidence || 'Deterministic engine validation'}
                      </td>
                      <td>
                        <Badge
                          color={
                            res.status === 'verified_discrepancy'
                              ? 'red'
                              : res.status === 'needs_review'
                              ? 'amber'
                              : res.status === 'insufficient_evidence'
                              ? 'gray'
                              : 'teal'
                          }
                        >
                          {res.status === 'verified_discrepancy'
                            ? 'Discrepancy Found'
                            : res.status === 'needs_review'
                            ? 'Needs Review'
                            : res.status === 'insufficient_evidence'
                            ? 'Insufficient Evidence'
                            : 'Verified'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <Icon name="file" />
              <h3>No findings to display</h3>
              <p>Click "Run bill audit" above to run deterministic verification on this bill.</p>
            </div>
          )
        ) : filteredFindings.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>FINDING</th>
                  <th>AMOUNT INVOLVED</th>
                  <th>WHY IT WAS FLAGGED</th>
                  <th>SOURCE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.map(f => (
                  <tr key={f.id}>
                    <td>
                      <strong>{f.name}</strong>
                      <small>{f.id} · Demo Data</small>
                    </td>
                    <td className="money">
                      {f.amount === null ? 'Not determined' : money(f.amount)}
                    </td>
                    <td className="item-note">{f.why}</td>
                    <td>
                      {f.doc}
                      <small>Page {f.page}</small>
                    </td>
                    <td>
                      <Badge>{f.status}</Badge>
                    </td>
                    <td>
                      <div className="stack" style={{ gap: '6px' }}>
                        <Button
                          variant="text-link"
                          onClick={() => handleViewEvidence(f)}
                        >
                          View Evidence
                        </Button>
                        <Button
                          variant="text-link"
                          onClick={() => handleResolveClick(f)}
                        >
                          Mark as Reviewed
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <Icon name="file" />
            <h3>No findings to display</h3>
            <p>Run a connected audit service when available, or change the filter.</p>
          </div>
        )}

        <div className="padded" style={{ borderTop: '1px solid #f1f5f9' }}>
          <p className="note-text">
            Missing documentation does not prove that a service was not provided. Similar entries
            may represent separate services. Check uploaded package and insurance terms before
            drawing conclusions.
          </p>
        </div>
      </div>
    </>
  );
};
