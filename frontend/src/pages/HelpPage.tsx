import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Icon } from '../components/common/Icon';
import { Button } from '../components/common/Button';

export const HelpPage: React.FC = () => {
  const { showModal } = useWorkspace();

  const handleIntegrationInfoClick = () => {
    showModal(
      'Backend integration requirements',
      <div>
        <p>
          A production deployment needs authenticated APIs, authorization, secure document
          storage, OCR, audit orchestration and verified reference lookup.
        </p>
        <div className="notice" style={{ margin: '12px 0' }}>
          <strong>Proposed integration endpoints</strong>
          <br />
          <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap', marginTop: '6px' }}>
            {`GET/POST /api/cases
PATCH/DELETE /api/cases/:id
POST /api/cases/:id/documents
GET/PATCH /api/documents/:id
POST /api/documents/:id/reprocess
POST /api/cases/:id/audits
GET /api/cases/:id/price-references
GET/POST /api/cases/:id/evidence
POST /api/cases/:id/drafts
GET /api/cases/:id/reports`}
          </pre>
        </div>
        <p className="note-text">
          The source bundle includes a proposed typed client and integration notes. No existing
          backend was supplied.
        </p>
      </div>
    );
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>A little guidance, every step of the way</h1>
          <p>Medical billing can feel complex. Start with one document and one question.</p>
        </div>
      </div>

      <div className="card padded" style={{ marginBottom: '20px' }}>
        <div className="eyebrow">HOW BILL SAATHI AI WORKS</div>
        <h3 style={{ fontSize: '18px', marginTop: '6px', fontWeight: 750 }}>
          From a confusing bill to an informed next step.
        </h3>
        <div className="help-steps" style={{ marginTop: '16px' }}>
          {[
            'Create a case',
            'Add your documents',
            'Review extracted details',
            'Inspect the bill audit',
            'Verify relevant references',
            'Organize your evidence',
            'Prepare an optional draft',
            'Review and export'
          ].map(t => (
            <div key={t}>{t}</div>
          ))}
        </div>
      </div>

      <div className="two-col">
        <section className="card padded">
          <h3 style={{ fontSize: '15px', marginTop: 0, fontWeight: 700 }}>
            Billing terms, in plain language
          </h3>
          {[
            ['Itemized bill', 'A bill that lists individual services, medicines and charges.'],
            [
              'Potential duplicate',
              'Two entries that may refer to the same charge and need review. Similar descriptions do not establish that a charge is invalid.'
            ],
            [
              'Reference price',
              'A documented price that may apply to a particular service or situation. Check the effective date and applicability.'
            ],
            ['Evidence', 'Documents or information supporting a statement.'],
            [
              'Complaint draft',
              'A document prepared for your review before submission. A draft is not a filed complaint.'
            ]
          ].map(([t, d]) => (
            <details key={t}>
              <summary>{t}</summary>
              <p>{d}</p>
            </details>
          ))}
        </section>

        <section className="card padded">
          <h3 style={{ fontSize: '15px', marginTop: 0, fontWeight: 700 }}>
            What is available in this prototype?
          </h3>
          <p className="note-text">
            You can create cases locally, select and preview files, edit information, explore sample
            findings, link evidence, prepare templates, and export text reports.
          </p>
          <p className="note-text" style={{ marginTop: '8px' }}>
            Cloud storage, authentication, OCR, automated AI audits, verified price lookup,
            notifications by email and online complaint submission are not connected.
          </p>
          <div className="notice warning" style={{ marginTop: '14px' }}>
            <Icon name="warning" />
            <span>
              Do not use this prototype as a secure medical-record system. Files and case
              information are cleared on reload. Use fictional data when demonstrating it.
            </span>
          </div>
          <Button
            icon="file"
            onClick={handleIntegrationInfoClick}
          >
            View integration requirements
          </Button>
        </section>
      </div>
    </>
  );
};
