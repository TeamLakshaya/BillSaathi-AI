import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Sidebar } from '../navigation/Sidebar';
import { Topbar } from '../navigation/Topbar';
import { DialogModal } from '../modals/DialogModal';
import { Toast } from '../common/Toast';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const {
    isDemo,
    showModal,
    switchWorkspaceMode,
    setIsMobileNavOpen
  } = useWorkspace();

  const handleSwitchWorkspaceClick = () => {
    showModal(
      'Switch workspace',
      <p>
        {isDemo
          ? 'Open an empty, session-only workspace. No real data is sent to a server.'
          : 'Return to fictional demonstration records.'}{' '}
        Your current session is retained separately until you reload the page.
      </p>,
      <Button
        variant="primary"
        onClick={() => {
          switchWorkspaceMode();
          navigate('/overview');
        }}
      >
        Switch workspace
      </Button>
    );
  };

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
    document.body.classList.remove('mobile-open');
  };

  return (
    <>
      <div className="overlay" onClick={closeMobileNav}></div>
      <Sidebar />
      <div className="shell">
        <Topbar />
        <main className="main" id="main">
          <div className="demo-banner">
            <Icon name={isDemo ? 'info' : 'lock'} />
            <span>
              <strong>
                {isDemo
                  ? 'Demo Data — Not a Real Patient Record'
                  : 'Local workspace — No backend connected'}
              </strong>{' '}
              {isDemo
                ? 'Fictional records and illustrative audit results.'
                : 'Files stay in this browser tab. OCR, server upload and AI auditing are unavailable.'}
            </span>
            <Button onClick={handleSwitchWorkspaceClick}>
              {isDemo ? 'Use empty workspace' : 'Explore demo'}
            </Button>
          </div>

          <Outlet />

          <footer className="footer">
            <div className="footer-brand">
              <img
                src="assets/logo-mark-transparent.png"
                alt="Bill Saathi AI"
                className="footer-logo-mark"
              />
              <span>
                <strong>Bill Saathi AI</strong> — <em>Aapka Bill, Aapka Adhikaar.</em>
              </span>
            </div>
            <span>
              <Icon name="shield" /> Designed around clarity, evidence and your privacy.
            </span>
          </footer>
        </main>
      </div>

      <DialogModal />
      <Toast />
    </>
  );
};
