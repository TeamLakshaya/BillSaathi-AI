import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { ProgressStepper } from '../components/stepper/ProgressStepper';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icon';
import { Button } from '../components/common/Button';
import { money, date, getNextAction } from '../utils/formatters';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { cases, docs, findings, currentCase, activity, isDemo } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const unresolved = findings.filter(f => f.status !== 'Resolved by User').length;

  const filteredRecentCases = cases
    .filter(
      c =>
        (c.name + ' ' + c.id + ' ' + c.hospital).toLowerCase().includes(searchQuery.toLowerCase()) &&
        (filterStatus === 'all' || c.stage === filterStatus)
    )
    .slice(0, 3);

  const displayActivity = [...activity];
  if (isDemo && displayActivity.length === 0) {
    displayActivity.push(
      { text: 'Possible duplicate charge flagged', time: 'Sample · 27 Oct 2026' },
      { text: 'Bill details ready for review', time: 'Sample · 27 Oct 2026' },
      { text: 'Sample documents added', time: 'Sample · 26 Oct 2026' }
    );
  }

  const nextAction = getNextAction(currentCase);

  return (
    <>
      <section className="welcome">
        <div>
          <div className="eyebrow">YOUR MEDICAL BILL WORKSPACE</div>
          <h1>Welcome back!</h1>
          <p>
            Manage your medical bills, review possible discrepancies, and organize your supporting
            documents in one place.
          </p>
        </div>
        <div className="actions">
          <Button variant="primary" icon="plus" onClick={() => navigate('/new')}>
            Start New Bill Review
          </Button>
          <Button onClick={() => navigate('/cases')}>View My Cases</Button>
        </div>
      </section>

      <div className="stats">
        {[
          {
            title: 'Total Cases',
            num: cases.length,
            icon: 'cases',
            foot: 'All your reviews, in one place',
            iconClass: ''
          },
          {
            title: 'Documents Uploaded',
            num: docs.length,
            icon: 'file',
            foot: isDemo ? 'Fictional sample documents' : 'Local selections · not server uploads',
            iconClass: ''
          },
          {
            title: 'Bills Reviewed',
            num: cases.filter(x => x.progress >= 4).length,
            icon: 'audit',
            foot: isDemo ? 'Illustrative completed audit' : 'Confirmed completed audits',
            iconClass: 'teal'
          },
          {
            title: 'Potential Issues Flagged',
            num: unresolved,
            icon: 'warning',
            foot: 'Findings that need a closer look',
            iconClass: 'amber'
          }
        ].map(item => (
          <div key={item.title} className="card stat">
            <div className="stat-head">
              {item.title}
              <span className={`icon-box ${item.iconClass}`.trim()}>
                <Icon name={item.icon} />
              </span>
            </div>
            <div className="stat-number">{String(item.num).padStart(2, '0')}</div>
            <div className="stat-foot">
              {item.foot} {isDemo && <span>· Sample</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-main">
        <div className="stack">
          {/* Stepper Card */}
          <section className="card">
            <div className="card-head">
              <div>
                <h2>Your case, one step at a time</h2>
                <p>A clear path from your first bill to an informed next step.</p>
              </div>
              {currentCase && <Badge color="blue">In progress</Badge>}
            </div>
            {currentCase ? (
              <>
                <div className="case-strip">
                  <div>
                    <strong>{currentCase.name}</strong>
                    <small>
                      {currentCase.id} <span style={{ margin: '0 5px' }}>·</span>{' '}
                      {currentCase.hospital} {isDemo && '· Demo Data'}
                    </small>
                  </div>
                  <Button
                    variant="text-link"
                    icon="chevron"
                    onClick={() => navigate('/detail')}
                  >
                    View case
                  </Button>
                </div>
                <ProgressStepper caseObj={currentCase} />
                <div className="next-step">
                  <Icon name="info" />
                  <span>
                    <strong>Next step:</strong> {nextAction[0]}
                  </span>
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/${nextAction[2]}`)}
                  >
                    {nextAction[1]}
                  </Button>
                </div>
              </>
            ) : (
              <div className="empty">
                <Icon name="file" />
                <h3>No cases yet</h3>
                <p>Start with a case to organize your bill review.</p>
                <Button variant="primary" onClick={() => navigate('/new')}>
                  Create a case
                </Button>
              </div>
            )}
          </section>

          {/* Recent Cases Table Card */}
          <section className="card">
            <div className="card-head">
              <div>
                <h2>Recent cases</h2>
                <p>Your latest medical bill reviews.</p>
              </div>
              <Button
                variant="text-link"
                icon="arrow"
                onClick={() => navigate('/cases')}
              >
                View all cases
              </Button>
            </div>
            <div className="table-tools">
              <input
                aria-label="Search recent cases"
                placeholder="Search by case name or ID…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <select
                aria-label="Filter recent cases"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="Needs Review">Needs Review</option>
                <option value="Audit Completed">Audit Completed</option>
                <option value="Awaiting Documents">Awaiting Documents</option>
              </select>
            </div>
            <div id="overview-table">
              {filteredRecentCases.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>CASE / PROVIDER</th>
                        <th>BILL AMOUNT</th>
                        <th>LAST UPDATED</th>
                        <th>CURRENT STAGE</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecentCases.map(c => (
                        <tr key={c.id}>
                          <td>
                            <strong>{c.name}</strong>
                            <small>
                              {c.id} · {c.hospital} {isDemo && '· Demo Data'}
                            </small>
                          </td>
                          <td className="money">{money(c.amount)}</td>
                          <td>{date(c.updated)}</td>
                          <td>
                            <Badge>{c.stage}</Badge>
                          </td>
                          <td>
                            <Button
                              variant="text-link"
                              onClick={() => navigate(`/detail`)}
                            >
                              View case
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty">
                  <Icon name="file" />
                  <h3>No cases found</h3>
                  <p>Create a case or adjust your search and filters.</p>
                  <Button variant="primary" onClick={() => navigate('/new')}>
                    Create a case
                  </Button>
                </div>
              )}
            </div>
            <div className="table-footer">
              <span>
                {cases.length} {isDemo ? 'sample ' : ''}cases in your workspace
              </span>
              <Button variant="text-link" onClick={() => navigate('/cases')}>
                Manage cases
              </Button>
            </div>
          </section>
        </div>

        <div className="stack">
          {/* Attention Widget */}
          <section className="card aside-card">
            <div className="card-head">
              <h2>Needs your attention</h2>
              <Icon name="bell" />
            </div>
            <div className="aside-content">
              {currentCase && docs.some(d => d.status === 'Review Required') && (
                <div className="alert-item">
                  <Icon name="warning" />
                  <div>
                    <strong>Bill details need confirmation</strong>
                    <p>Review extracted information before continuing with your audit.</p>
                    <Button
                      variant="text-link"
                      icon="arrow"
                      onClick={() => navigate('/review')}
                    >
                      Review documents
                    </Button>
                  </div>
                </div>
              )}
              {unresolved ? (
                <div className="alert-item">
                  <Icon name="search" />
                  <div>
                    <strong>{unresolved} findings to review</strong>
                    <p>Check the source documents. A flag is a question, not a conclusion.</p>
                    <Button
                      variant="text-link"
                      icon="arrow"
                      onClick={() => navigate('/audit')}
                    >
                      Explore findings
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="note-text">No unresolved findings in this workspace.</p>
              )}
            </div>
          </section>

          {/* Recent Activity Feed */}
          <section className="card aside-card">
            <div className="card-head">
              <h2>Recent activity</h2>
              {isDemo && <span className="badge gray">Sample</span>}
            </div>
            <div className="aside-content">
              {displayActivity.length ? (
                displayActivity.slice(0, 4).map((x, i) => (
                  <div key={i} className="activity">
                    <div className="activity-icon">
                      <Icon name={i ? 'file' : 'audit'} />
                    </div>
                    <div>
                      <strong>{x.text}</strong>
                      <small>{x.time}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="note-text">Activity will appear as you work on your cases.</p>
              )}
            </div>
          </section>

          {/* Guidance Tip Card */}
          <section className="card tip">
            <h3>
              <Icon name="shield" /> A little clarity goes a long way.
            </h3>
            <p>
              A flagged charge doesn't always mean an error. Review the supporting documents and ask
              your provider for clarification.
            </p>
            <Button
              variant="text-link"
              icon="arrow"
              onClick={() => navigate('/help')}
            >
              Understand your bill
            </Button>
          </section>
        </div>
      </div>

      <div className="privacy-footer">
        Understand Your Bill. Verify the Charges. Know Your Next Step.
      </div>
    </>
  );
};
