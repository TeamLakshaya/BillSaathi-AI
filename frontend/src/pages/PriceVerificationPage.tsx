import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icon';
import { Button } from '../components/common/Button';
import { CaseSelector } from '../components/navigation/CaseSelector';
import { money } from '../utils/formatters';

export const PriceVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentCase, showUnavailable } = useWorkspace();

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

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Price verification</h1>
          <p>Compare only against documented, applicable references.</p>
        </div>
        <CaseSelector />
      </div>

      <div className="notice warning">
        <Icon name="warning" />
        <span>
          A price difference does not automatically establish overcharging. Applicability can depend
          on the location, date, procedure, room category, insurance contract and other conditions.
        </span>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Reference comparisons</h2>
            <p>No official rates or source links have been fabricated.</p>
          </div>
          <Button
            onClick={() =>
              showUnavailable(
                'Reference lookup',
                'GET /api/cases/:id/price-references'
              )
            }
          >
            Connect reference lookup
          </Button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  'BILLED ITEM',
                  'BILLED AMOUNT',
                  'REFERENCE / DIFFERENCE',
                  'SOURCE / EFFECTIVE DATE',
                  'APPLICABILITY',
                  'STATUS'
                ].map(t => (
                  <th key={t}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Case bill total</td>
                <td className="money">{money(currentCase.amount)}</td>
                <td>Not available</td>
                <td>No verified source</td>
                <td>Not established</td>
                <td>
                  <Badge>Reference Check Needed</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="empty">
          <Icon name="file" />
          <h3>No applicable verified reference found.</h3>
          <p>
            Upload package documents, policy terms or a documented contractual price schedule. A
            suitable reference must be checked for applicability.
          </p>
          <Button variant="primary" onClick={() => navigate('/upload')}>
            Add reference documents
          </Button>
        </div>
      </section>

      <div className="space"></div>

      <div className="card padded">
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
          What makes a useful reference?
        </h3>
        <div className="two-col">
          <p className="note-text">
            An applicable government notification or official rate with a verifiable source and
            effective date.
            <br />
            <br />
            Uploaded hospital package terms or contractual price schedules.
          </p>
          <p className="note-text">
            Insurance policy and settlement conditions matching your specific case.
            <br />
            <br />
            Do not substitute a generic internet price for a verified applicable reference.
          </p>
        </div>
      </div>
    </>
  );
};
