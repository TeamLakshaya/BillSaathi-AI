import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { navs } from '../../utils/constants';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';

export const Topbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isDemo,
    cases,
    userPrefs,
    showModal,
    closeModal,
    switchWorkspaceMode,
    setIsMobileNavOpen
  } = useWorkspace();

  const currentRoute = location.pathname.replace(/^\//, '') || 'overview';

  let title =
    currentRoute === 'review'
      ? 'Document Review'
      : currentRoute === 'detail'
      ? 'Case Workspace'
      : currentRoute === 'affidavit'
      ? 'Affidavit Draft Assistant'
      : currentRoute === 'reports'
      ? 'Reports & Evidence'
      : currentRoute === 'complaint'
      ? 'Complaint & Resolution Assistant'
      : navs.find(x => x[0] === currentRoute)?.[1] || 'Overview';

  const handleGlobalSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = String(formData.get('q') || '').trim();
    navigate(`/cases?q=${encodeURIComponent(q)}`);
  };

  const handleNotificationsClick = () => {
    const list = userPrefs.notifications
      ? cases.filter(c => c.stage === 'Needs Review' || c.stage === 'Awaiting Documents')
      : [];

    showModal(
      'Your next steps',
      list.length ? (
        <div>
          {list.map(c => (
            <p key={c.id}>
              <strong>{c.id}</strong> · {c.stage}
              <br />
              <span className="muted">
                {c.stage === 'Needs Review'
                  ? 'Confirm extracted details before continuing.'
                  : 'Add the documents needed for this case.'}
              </span>
            </p>
          ))}
        </div>
      ) : (
        <p>No pending case notifications.</p>
      )
    );
  };

  const handleProfileMenuClick = () => {
    showModal(
      'Your workspace',
      <p>
        {isDemo
          ? 'You are exploring a fictional demonstration account.'
          : 'This is an unsigned local browser session.'}{' '}
        Authentication and cloud storage are not connected.
      </p>,
      <Button
        variant="primary"
        onClick={() => {
          closeModal();
          navigate('/settings');
        }}
      >
        Open settings
      </Button>
    );
  };

  const toggleMobileNav = () => {
    setIsMobileNavOpen(prev => {
      const next = !prev;
      if (next) document.body.classList.add('mobile-open');
      else document.body.classList.remove('mobile-open');
      return next;
    });
  };

  return (
    <header className="topbar" id="topbar">
      <Button
        variant="icon-btn mobile-toggle"
        aria-label="Open navigation"
        onClick={toggleMobileNav}
      >
        <Icon name="menu" />
      </Button>

      <div className="crumb">
        <strong>{title}</strong>
        Workspace <span style={{ margin: '0 4px', color: '#bcc6d2' }}>/</span> {title}
      </div>

      <form className="top-search" onSubmit={handleGlobalSearch}>
        <Icon name="search" />
        <input
          name="q"
          aria-label="Search cases or documents"
          placeholder="Search cases or documents…"
        />
      </form>

      <div className="top-actions">
        <Button
          variant="ghost icon-btn"
          aria-label="Notifications"
          onClick={handleNotificationsClick}
        >
          <Icon name="bell" />
        </Button>

        <Button
          variant="ghost icon-btn help-top"
          aria-label="Help"
          onClick={() => navigate('/help')}
        >
          <Icon name="help" />
        </Button>

        <button
          className="avatar"
          onClick={handleProfileMenuClick}
          aria-label="Profile menu"
        >
          {isDemo ? 'DP' : 'LW'}
        </button>

        <Button
          variant="primary"
          icon="plus"
          onClick={() => navigate('/new')}
        >
          New Case
        </Button>
      </div>
    </header>
  );
};
