import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { DocumentRecord } from '../types';
import { categories } from '../utils/constants';
import { date } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { Icon } from '../components/common/Icon';
import { Button } from '../components/common/Button';
import { CaseSelector } from '../components/navigation/CaseSelector';

export const EvidencePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentCase,
    caseDocs,
    caseFindings,
    notes,
    saveNotes,
    updateFinding,
    docBlobUrls,
    isDemo,
    showToast,
    showModal,
    closeModal
  } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [evidenceNotes, setEvidenceNotes] = useState(
    currentCase ? notes[currentCase.id] || '' : ''
  );

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

  const filteredDocs = caseDocs.filter(
    d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === 'all' || d.category === selectedCategory)
  );

  const handleSaveNotes = () => {
    saveNotes(currentCase.id, evidenceNotes);
    showToast('Notes saved in this tab.');
  };

  const handleLinkFindingClick = (docId: string) => {
    if (!caseFindings.length) {
      showToast('No findings exist for this case yet.');
      return;
    }

    let selectedFindingId = caseFindings[0].id;

    showModal(
      'Link a document to a finding',
      <div>
        <label htmlFor="link-finding">Select finding</label>
        <select
          id="link-finding"
          defaultValue={caseFindings[0].id}
          onChange={e => {
            selectedFindingId = e.target.value;
          }}
        >
          {caseFindings.map(f => (
            <option key={f.id} value={f.id}>
              {f.id} · {f.name}
            </option>
          ))}
        </select>
        <p className="note-text" style={{ marginTop: '10px' }}>
          This records your association, not independent verification.
        </p>
      </div>,
      <Button
        variant="primary"
        onClick={() => {
          const selEl = document.getElementById('link-finding') as HTMLSelectElement;
          const targetId = selEl?.value || selectedFindingId;
          updateFinding(targetId, { extraDoc: docId });
          closeModal();
          showToast('Evidence link saved locally.');
        }}
      >
        Save link
      </Button>
    );
  };

  const handleDownloadDoc = (d: DocumentRecord) => {
    if (d.sample) {
      const text = `SYNTHETIC DOCUMENT — DEMO DATA\n${d.name}\n${currentCase.hospital}\nCase: ${currentCase.id}\nThis is a fictional demonstration document, not a patient record.\n${
        d.category.includes('invoices')
          ? 'Room & nursing 30000\nProcedure & services 42000\nCBC panel 2500\nCBC panel 2500\nMedicines & supplies 7000\nLine-item total 84000\nBilled total 84500\nSource page: 1'
          : ''
      }`;
      const blob = new Blob([text], { type: 'text/plain' });
      const u = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = u;
      a.download = `sample-document-${d.id}.txt`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
      return;
    }

    const u = docBlobUrls.get(d.id);
    if (u) {
      const a = document.createElement('a');
      a.href = u;
      a.download = d.name;
      a.click();
    } else {
      showToast('Original file is unavailable. Select it again.');
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Evidence center</h1>
          <p>Keep every claim connected to its source.</p>
        </div>
        <CaseSelector />
      </div>

      <div className="two-col">
        <section className="card padded">
          <h3 style={{ fontSize: '14px', marginTop: 0, fontWeight: 700 }}>
            Evidence summary
          </h3>
          <p className="note-text">
            <strong>Verified document facts:</strong>{' '}
            {caseDocs.filter(d => d.confirmed).length} document(s) reviewed by you locally.
            Independent verification is unavailable.
          </p>
          <p className="note-text">
            <strong>User-provided statement:</strong>{' '}
            {currentCase.description || 'None recorded.'}
          </p>
          <p className="note-text">
            <strong>AI-generated observations:</strong>{' '}
            {isDemo ? 'Sample findings only; no live AI generation.' : 'No AI service connected.'}
          </p>
          <p className="note-text">
            <strong>Unresolved questions:</strong>{' '}
            {caseFindings.filter(f => f.status !== 'Resolved by User').length} finding(s)
            requiring review.
          </p>
          <p className="note-text">
            <strong>Missing supporting documents:</strong>{' '}
            {caseDocs.some(d => d.category === 'Hospital package or estimate documents')
              ? 'Package document selected; applicability not verified.'
              : 'No package / estimate document has been added.'}
          </p>
        </section>

        <section className="card padded">
          <h3 style={{ fontSize: '14px', marginTop: 0, fontWeight: 700 }}>
            Your evidence notes
          </h3>
          <label htmlFor="evidence-notes">
            Questions, context and document references
          </label>
          <textarea
            id="evidence-notes"
            placeholder="Record what you know and what needs clarification…"
            value={evidenceNotes}
            onChange={e => setEvidenceNotes(e.target.value)}
          ></textarea>
          <div className="actions" style={{ marginTop: '12px' }}>
            <Button variant="primary" onClick={handleSaveNotes}>
              Save notes
            </Button>
            <Button onClick={() => navigate('/upload')}>Add documents</Button>
          </div>
        </section>
      </div>

      <div className="space"></div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Document library & finding links</h2>
            <p>Original source pages and user-added associations.</p>
          </div>
        </div>
        <div className="table-tools">
          <input
            id="evidence-search"
            aria-label="Search evidence"
            placeholder="Search documents…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select
            id="evidence-category"
            aria-label="Filter document category"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div id="evidence-table">
          {filteredDocs.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>EVIDENCE ID / DOCUMENT</th>
                    <th>RELATED FINDING</th>
                    <th>SOURCE PAGE</th>
                    <th>DATE</th>
                    <th>REVIEW STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map(d => (
                    <tr key={d.id}>
                      <td>
                        <strong>{d.name}</strong>
                        <small>
                          {d.id} {d.sample && '· Demo Data'}
                        </small>
                      </td>
                      <td>
                        {caseFindings
                          .filter(f => f.doc === d.id || f.extraDoc === d.id)
                          .map(f => f.id)
                          .join(', ') || 'Not linked'}
                      </td>
                      <td>{d.sample ? '1' : 'Not supplied'}</td>
                      <td>{d.sample ? `Sample · ${date(currentCase.date)}` : 'This session'}</td>
                      <td>
                        <Badge>{d.status}</Badge>
                      </td>
                      <td>
                        <div className="row">
                          <Button
                            variant="text-link"
                            onClick={() => navigate(`/upload`)}
                          >
                            Preview
                          </Button>
                          <Button
                            variant="text-link"
                            onClick={() => handleLinkFindingClick(d.id)}
                          >
                            Link finding
                          </Button>
                          <Button
                            variant="text-link"
                            onClick={() => handleDownloadDoc(d)}
                          >
                            Download
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
              <h3>No matching evidence</h3>
              <p>Add documents or change your filters.</p>
            </div>
          )}
        </div>
      </section>

      <div className="space"></div>

      <section className="card padded">
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
          Evidence timeline
        </h3>
        {caseDocs.length ? (
          caseDocs.map(d => (
            <p key={d.id} className="note-text">
              <span className="source-pill">
                {d.sample ? 'Sample timeline' : date(new Date().toISOString().slice(0, 10))}
              </span>{' '}
              {d.name} — {d.status}
            </p>
          ))
        ) : (
          <p className="note-text">Your documents will appear here.</p>
        )}
      </section>
    </>
  );
};
