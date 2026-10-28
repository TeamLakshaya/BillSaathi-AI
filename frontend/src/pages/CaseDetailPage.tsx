import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { ProgressStepper } from '../components/stepper/ProgressStepper';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icon';
import { Button } from '../components/common/Button';
import { money, date, getNextAction } from '../utils/formatters';

export const CaseDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentCase, caseDocs, caseFindings, isDemo } = useWorkspace();

  if (!currentCase) {
    return (
      <div className="empty">
        <Icon name="file" />
        <h3>No case selected</h3>
        <p>Create a case to begin.</p>
        <Button variant="primary" onClick={() => navigate('/new')}>
          Create a case
        </Button>
      </div>
    );
  }

  const nextAction = getNextAction(currentCase);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{currentCase.name}</h1>
          <p>
            {currentCase.id} · {currentCase.hospital} {isDemo && '· Demo Data'}
          </p>
        </div>
        <Button
          icon="edit"
          onClick={() => navigate(`/new?edit=${currentCase.id}`)}
        >
          Edit case
        </Button>
      </div>

      <div className="stats">
        {[
          { label: 'Bill amount', val: money(currentCase.amount) },
          { label: 'Documents', val: String(caseDocs.length) },
          { label: 'Findings', val: String(caseFindings.length) },
          { label: 'Current stage', val: currentCase.stage }
        ].map(item => (
          <div key={item.label} className="card stat">
            <div className="stat-head">{item.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '12px' }}>
              {item.val}
            </div>
          </div>
        ))}
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Case progress</h2>
            <p>Hover over a stage to see what it involves.</p>
          </div>
          <Badge>{currentCase.stage}</Badge>
        </div>
        <ProgressStepper caseObj={currentCase} />
        <div className="next-step">
          <Icon name="info" />
          <span>{nextAction[0]}</span>
          <Button
            variant="primary"
            onClick={() => navigate(`/${nextAction[2]}`)}
          >
            {nextAction[1]}
          </Button>
        </div>
      </section>

      <div className="space"></div>

      <div className="two-col">
        <section className="card padded">
          <h3>Case information</h3>
          <p className="note-text" style={{ marginTop: '8px' }}>
            {currentCase.description || 'No description provided.'}
          </p>
          <p className="note-text" style={{ marginTop: '12px' }}>
            Hospital city: {currentCase.city || 'Not provided'}
            <br />
            Bill date: {date(currentCase.date)}
            <br />
            Admission: {date(currentCase.admission)}
            <br />
            Discharge: {date(currentCase.discharge)}
            <br />
            Insurance: {currentCase.insurance}
          </p>
          <h4 style={{ marginTop: '18px' }}>Review objectives</h4>
          <div style={{ marginTop: '8px' }}>
            {(currentCase.objectives || []).map(o => (
              <p key={o} className="note-text" style={{ marginBottom: '6px' }}>
                <Icon name="check" /> {o}
              </p>
            ))}
          </div>
        </section>

        <section className="card padded">
          <h3>Your next actions</h3>
          <div className="stack" style={{ marginTop: '16px' }}>
            {[
              ['upload', 'Upload supporting documents'],
              ['audit', 'Inspect audit findings'],
              ['price', 'Check price references'],
              ['evidence', 'Organize evidence'],
              ['complaint', 'Prepare a complaint draft'],
              ['reports', 'Review available exports']
            ].map(([r, label]) => (
              <Button
                key={r}
                icon="arrow"
                onClick={() => navigate(`/${r}`)}
              >
                {label}
              </Button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};
