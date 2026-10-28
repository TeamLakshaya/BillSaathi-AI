/**
 * Bill Saathi AI - Settings & Privacy View
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Views = window.BillSaathi.Views || {};

(function () {
  const { esc, btn } = window.BillSaathi.Config;
  const State = window.BillSaathi.State;

  function render() {
    return `
      <div class="page-heading">
        <div>
          <h1>Settings & privacy</h1>
          <p>You should always know what is stored, and where.</p>
        </div>
      </div>

      <div class="two-col">
        <section class="card padded">
          <h3 style="margin-top:0;font-size:15px;font-weight:700">Workspace preferences</h3>
          <form onsubmit="event.preventDefault();BillSaathi.Views.saveSettings(this)">
            <div class="form-grid">
              <div>
                <label for="pref-name">Display name</label>
                <input name="name" id="pref-name" value="${esc(State.prefs.name)}" placeholder="Optional">
              </div>
              <div>
                <label for="pref-contact">Contact information</label>
                <input type="email" name="contact" id="pref-contact" value="${esc(State.prefs.contact)}" placeholder="Optional · not used to send email">
              </div>
              <div class="wide">
                <label for="pref-lang">Language preference</label>
                <select name="language" id="pref-lang">
                  <option>English</option>
                  <option disabled>Hindi · translation not implemented</option>
                </select>
              </div>
              <div class="wide">
                <label class="check">
                  <input type="checkbox" name="notifications" ${State.prefs.notifications ? 'checked' : ''}>
                  Show in-app case reminders
                </label>
              </div>
            </div>
            <button class="primary" type="submit" style="margin-top:16px">Save session preferences</button>
            <p class="inline-note">Preferences are session-only. No profile server or email delivery is connected.</p>
          </form>
        </section>

        <section class="card padded">
          <h3 style="margin-top:0;font-size:15px;font-weight:700">Privacy & account security</h3>
          <p class="note-text">No account is signed in. Authentication, role-based access and encrypted server storage have not been implemented.</p>
          <p class="note-text" style="margin-top:8px">Selected files are held as temporary browser object URLs. No medical data is written to localStorage or sent by this application to a server. Closing or reloading the tab clears it.</p>
          <div class="actions" style="margin-top:16px">
            ${btn('Account security', "BillSaathi.Components.Modal.unavailable('Account security','GET /api/account/security')")}
            ${btn('Export session data', 'BillSaathi.Views.exportSession()', '', 'download')}
            ${btn('Clear workspace', 'BillSaathi.Views.clearWorkspace()', 'danger', 'trash')}
          </div>
          <p class="inline-note">Export includes case metadata, findings and notes, but not document binaries. Treat exported data as sensitive.</p>
        </section>
      </div>

      <div class="space"></div>

      <div class="notice warning">
        ${window.BillSaathi.Icons.get('warning')}
        <span>Production use requires security and privacy review, consent handling, access controls, retention policies and backend integration. This is a frontend prototype, not a secure patient-record service.</span>
      </div>
    `;
  }

  function saveSettings(form) {
    let f = new FormData(form);
    State.prefs = { ...Object.fromEntries(f), notifications: f.has('notifications') };
    window.BillSaathi.Components.Toast.show('Preferences saved in this tab only.');
  }

  function exportSession() {
    const isDemo = State.isDemo;
    BillSaathi.Views.downloadFile(`bill-saathi-${isDemo ? 'demo' : 'local'}-session.json`, JSON.stringify({
      mode: isDemo ? 'demo' : 'local',
      exportedAt: new Date().toISOString(),
      data: State.getStore(),
      drafts: Object.fromEntries(Object.entries(State.drafts).filter(([k]) => k.startsWith(isDemo ? 'demo:' : 'local:')))
    }, null, 2), 'application/json');
  }

  function clearWorkspace() {
    window.BillSaathi.Components.Modal.show('Clear this workspace?', `
      <p>This clears cases, findings, notes, local files and drafts for the current ${State.isDemo ? 'demo' : 'local'} workspace. It does not delete exported copies or server data.</p>
    `, btn('Clear workspace', "BillSaathi.Views.doClearWorkspace()", 'danger'));
  }

  function doClearWorkspace() {
    let s = State.getStore();
    s.docs.forEach(d => {
      if (State.docUrls.has(d.id)) {
        URL.revokeObjectURL(State.docUrls.get(d.id));
        State.docUrls.delete(d.id);
      }
      delete State.ocrEdits[d.id];
    });
    for (let k of Object.keys(State.drafts)) {
      if (k.startsWith(State.isDemo ? 'demo:' : 'local:')) delete State.drafts[k];
    }
    Object.assign(s, { cases: [], docs: [], findings: [], notes: {}, activity: [] });
    State.pending = [];
    window.BillSaathi.Components.Modal.close();
    BillSaathi.Router.go('overview');
    window.BillSaathi.Components.Toast.show('Workspace cleared from this tab.');
  }

  window.BillSaathi.Views.settingsPage = render;
  window.BillSaathi.Views.saveSettings = saveSettings;
  window.BillSaathi.Views.exportSession = exportSession;
  window.BillSaathi.Views.clearWorkspace = clearWorkspace;
  window.BillSaathi.Views.doClearWorkspace = doClearWorkspace;
})();
