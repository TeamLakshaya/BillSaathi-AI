import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Icon } from '../components/common/Icon';
import { Button } from '../components/common/Button';

export const SettingsPage: React.FC = () => {
  const {
    userPrefs,
    setUserPrefs,
    cases,
    docs,
    findings,
    notes,
    drafts,
    isDemo,
    clearWorkspace,
    showToast,
    showModal,
    showUnavailable
  } = useWorkspace();

  const [formState, setFormState] = useState(userPrefs);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPrefs(formState);
    showToast('Preferences saved in this tab only.');
  };

  const handleExportSession = () => {
    const sessionData = {
      mode: isDemo ? 'demo' : 'local',
      exportedAt: new Date().toISOString(),
      data: {
        cases,
        docs,
        findings,
        notes
      },
      drafts: Object.fromEntries(
        Object.entries(drafts).filter(([k]) =>
          k.startsWith(isDemo ? 'demo:' : 'local:')
        )
      )
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], {
      type: 'application/json'
    });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `bill-saathi-${isDemo ? 'demo' : 'local'}-session.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  };

  const handleClearWorkspaceModal = () => {
    showModal(
      'Clear this workspace?',
      <p>
        This clears cases, findings, notes, local files and drafts for the current{' '}
        {isDemo ? 'demo' : 'local'} workspace. It does not delete exported copies or server data.
      </p>,
      <Button variant="danger" onClick={clearWorkspace}>
        Clear workspace
      </Button>
    );
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Settings & privacy</h1>
          <p>You should always know what is stored, and where.</p>
        </div>
      </div>

      <div className="two-col">
        <section className="card padded">
          <h3 style={{ marginTop: 0, fontSize: '15px', fontWeight: 700 }}>
            Workspace preferences
          </h3>
          <form onSubmit={handleSavePreferences}>
            <div className="form-grid">
              <div>
                <label htmlFor="pref-name">Display name</label>
                <input
                  name="name"
                  id="pref-name"
                  value={formState.name}
                  onChange={e => setFormState(p => ({ ...p, name: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label htmlFor="pref-contact">Contact information</label>
                <input
                  type="email"
                  name="contact"
                  id="pref-contact"
                  value={formState.contact}
                  onChange={e => setFormState(p => ({ ...p, contact: e.target.value }))}
                  placeholder="Optional · not used to send email"
                />
              </div>
              <div className="wide">
                <label htmlFor="pref-lang">Language preference</label>
                <select
                  name="language"
                  id="pref-lang"
                  value={formState.language}
                  onChange={e => setFormState(p => ({ ...p, language: e.target.value }))}
                >
                  <option value="English">English</option>
                  <option value="Hindi" disabled>
                    Hindi · translation not implemented
                  </option>
                </select>
              </div>
              <div className="wide">
                <label className="check">
                  <input
                    type="checkbox"
                    name="notifications"
                    checked={formState.notifications}
                    onChange={e =>
                      setFormState(p => ({ ...p, notifications: e.target.checked }))
                    }
                  />
                  Show in-app case reminders
                </label>
              </div>
            </div>
            <button className="primary" type="submit" style={{ marginTop: '16px' }}>
              Save session preferences
            </button>
            <p className="inline-note">
              Preferences are session-only. No profile server or email delivery is connected.
            </p>
          </form>
        </section>

        <section className="card padded">
          <h3 style={{ marginTop: 0, fontSize: '15px', fontWeight: 700 }}>
            Privacy & account security
          </h3>
          <p className="note-text">
            No account is signed in. Authentication, role-based access and encrypted server storage
            have not been implemented.
          </p>
          <p className="note-text" style={{ marginTop: '8px' }}>
            Selected files are held as temporary browser object URLs. No medical data is written to
            localStorage or sent by this application to a server. Closing or reloading the tab clears
            it.
          </p>
          <div className="actions" style={{ marginTop: '16px' }}>
            <Button
              onClick={() =>
                showUnavailable(
                  'Account security',
                  'GET /api/account/security'
                )
              }
            >
              Account security
            </Button>
            <Button
              icon="download"
              onClick={handleExportSession}
            >
              Export session data
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={handleClearWorkspaceModal}
            >
              Clear workspace
            </Button>
          </div>
          <p className="inline-note">
            Export includes case metadata, findings and notes, but not document binaries. Treat
            exported data as sensitive.
          </p>
        </section>
      </div>

      <div className="space"></div>

      <div className="notice warning">
        <Icon name="warning" />
        <span>
          Production use requires security and privacy review, consent handling, access controls,
          retention policies and backend integration. This is a frontend prototype, not a secure
          patient-record service.
        </span>
      </div>
    </>
  );
};
