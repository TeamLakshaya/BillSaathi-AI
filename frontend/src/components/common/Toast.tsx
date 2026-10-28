import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const Toast: React.FC = () => {
  const { toast } = useWorkspace();

  return (
    <div id="toast-root" role="status" aria-live="polite">
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};
