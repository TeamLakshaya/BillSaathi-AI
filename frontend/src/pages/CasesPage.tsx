import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icon';
import { Button } from '../components/common/Button';
import { money, date } from '../utils/formatters';

export const CasesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cases, isDemo, setActiveCaseId, deleteCase, showModal } = useWorkspace();

  const [caseView, setCaseView] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOption, setSortOption] = useState<'updated' | 'amount' | 'name'>('updated');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  const filteredCases = cases
    .filter(
      c =>
        (c.name + ' ' + c.id + ' ' + c.hospital).toLowerCase().includes(searchQuery.toLowerCase()) &&
        (filterStatus === 'all' || c.stage === filterStatus)
    )
    .sort((a, b) =>
      sortOption === 'amount'
        ? b.amount - a.amount
        : sortOption === 'name'
        ? a.name.localeCompare(b.name)
        : b.updated.localeCompare(a.updated)
    );

  const totalCases = filteredCases.length;
  const start = (currentPage - 1) * pageSize;
  const shownCases = filteredCases.slice(start, start + pageSize);

  const handleDeleteClick = (id: string) => {
    showModal(
      'Delete this case?',
      <p>
        This removes the case and its documents from this {isDemo ? 'demo' : 'local'} session. It
        does not delete anything from a server.
      </p>,
      <Button variant="danger" onClick={() => deleteCase(id)}>
        Delete case
      </Button>
    );
  };

  const handleOpenCase = (id: string) => {
    setActiveCaseId(id);
    navigate('/detail');
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>My cases</h1>
          <p>A clear view of every bill review in your workspace.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => navigate('/new')}>
          Create New Case
        </Button>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="row">
            <span className="badge gray">{cases.length} cases</span>
            {isDemo && <span className="badge teal">Demo Data</span>}
          </div>
          <div className="row">
            <Button
              variant="small"
              className={caseView === 'table' ? 'active' : ''}
              aria-label="Table view"
              onClick={() => setCaseView('table')}
            >
              <Icon name="list" />
            </Button>
            <Button
              variant="small"
              className={caseView === 'grid' ? 'active' : ''}
              aria-label="Grid view"
              onClick={() => setCaseView('grid')}
            >
              <Icon name="grid" />
            </Button>
          </div>
        </div>

        <div className="table-tools">
          <input
            id="case-search"
            aria-label="Search cases"
            placeholder="Search case name, ID or hospital…"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          <select
            aria-label="Filter by case stage"
            value={filterStatus}
            onChange={e => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All statuses</option>
            {[
              'Draft',
              'Awaiting Documents',
              'Processing',
              'Needs Review',
              'Audit Completed',
              'Draft Prepared',
              'Ready for Export'
            ].map(x => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort cases"
            value={sortOption}
            onChange={e => {
              setSortOption(e.target.value as any);
              setCurrentPage(1);
            }}
          >
            <option value="updated">Recently updated</option>
            <option value="amount">Highest amount</option>
            <option value="name">Case name A–Z</option>
          </select>
        </div>

        <div id="cases-result">
          {caseView === 'table' ? (
            shownCases.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>CASE / PROVIDER</th>
                      <th>BILL AMOUNT</th>
                      <th>LAST UPDATED</th>
                      <th>CURRENT STAGE</th>
                      <th>ACTION</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shownCases.map(c => (
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
                            onClick={() => handleOpenCase(c.id)}
                          >
                            View case
                          </Button>
                        </td>
                        <td>
                          <Button
                            variant="ghost small danger"
                            aria-label="Delete case"
                            onClick={() => handleDeleteClick(c.id)}
                          >
                            <Icon name="trash" />
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
            )
          ) : shownCases.length ? (
            <div className="case-grid padded">
              {shownCases.map(c => (
                <div key={c.id} className="card padded">
                  <Badge>{c.stage}</Badge>
                  <h3>{c.name}</h3>
                  <p className="muted">
                    {c.id} · {c.hospital}
                  </p>
                  <strong>{money(c.amount)}</strong>
                  <div className="progressbar">
                    <i style={{ width: `${(c.progress / 7) * 100}%` }}></i>
                  </div>
                  <p className="muted">
                    {c.progress} of 7 stages {isDemo && '· Demo Data'}
                  </p>
                  <div className="actions">
                    <Button variant="primary" onClick={() => handleOpenCase(c.id)}>
                      Open case
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteClick(c.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <Icon name="file" />
              <h3>No matching cases</h3>
              <p>Adjust your search or status filter.</p>
            </div>
          )}
        </div>

        <div className="table-footer">
          <span>
            {totalCases ? start + 1 : 0}–{Math.min(start + pageSize, totalCases)} of {totalCases}{' '}
            cases
          </span>
          <div className="row">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Previous
            </button>
            <span>Page {currentPage}</span>
            <button
              disabled={start + pageSize >= totalCases}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
