import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const CaseSelector: React.FC = () => {
  const { cases, activeCaseId, setActiveCaseId } = useWorkspace();

  if (!cases.length) return null;

  return (
    <>
      <label className="sr-only" htmlFor="active-case">Active case</label>
      <select
        id="active-case"
        className="page-selector"
        value={activeCaseId}
        onChange={e => setActiveCaseId(e.target.value)}
      >
        {cases.map(c => (
          <option key={c.id} value={c.id}>
            {c.id} · {c.name}
          </option>
        ))}
      </select>
    </>
  );
};
