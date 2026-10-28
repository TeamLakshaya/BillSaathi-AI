import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { navs } from '../../utils/constants';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDemo, isSidebarCollapsed, setIsSidebarCollapsed, setIsMobileNavOpen } = useWorkspace();

  const currentRoute = location.pathname.replace(/^\//, '') || 'overview';

  const handleNavClick = (route: string) => {
    setIsMobileNavOpen(false);
    navigate(`/${route}`);
  };

  return (
    <aside className="sidebar" id="sidebar">
      <div className="brand">
        <Link to="/overview" className="brand-link" onClick={() => setIsMobileNavOpen(false)}>
          <img
            src="assets/logo-transparent.png"
            alt="Bill Saathi AI - Aapka Bill, Aapka Adhikaar"
            className="brand-logo-img"
          />
          <img
            src="assets/logo-mark-transparent.png"
            alt="Bill Saathi AI"
            className="brand-mark-img"
          />
        </Link>
      </div>

      <div style={{ padding: '0 18px 8px' }}>
        <Link
          to="/"
          onClick={() => setIsMobileNavOpen(false)}
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 500,
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            transition: 'all 0.15s ease',
          }}
          className="sidebar-home-link"
        >
          <Icon name="left" style={{ width: 13, height: 13 }} />
          <span>Landing Page</span>
        </Link>
      </div>

      <div className="nav-label">WORKSPACE</div>

      <nav className="nav" aria-label="Main navigation">
        {navs.map(([r, label, iconName]) => {
          const isReportsActive = currentRoute === 'reports' || currentRoute === 'affidavit';
          const isActive =
            currentRoute === r ||
            (r === 'cases' && currentRoute === 'detail') ||
            (r === 'reports' && isReportsActive) ||
            (r === 'complaint' && currentRoute === 'complaint');

          return (
            <div key={r} className={r === 'help' ? 'separate' : undefined}>
              <button
                className={isActive ? 'active' : ''}
                onClick={() => handleNavClick(r)}
              >
                <Icon name={iconName} />
                <span>{label}</span>
              </button>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="profile">
          <span className="avatar">{isDemo ? 'DP' : 'LW'}</span>
          <div className="profile-copy">
            <strong>{isDemo ? 'Demo patient' : 'Local workspace'}</strong>
            <small>{isDemo ? 'Sample account' : 'Session only · not signed in'}</small>
          </div>
        </div>
        <Button
          className="collapse-btn"
          onClick={() => {
            setIsSidebarCollapsed(prev => !prev);
            document.body.classList.toggle('collapsed');
          }}
        >
          <Icon name="left" />
          <span className="collapse-label">Collapse sidebar</span>
        </Button>
      </div>
    </aside>
  );
};
