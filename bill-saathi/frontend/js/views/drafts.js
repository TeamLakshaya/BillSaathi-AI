/**
 * Bill Saathi AI - Complaint & Affidavit Drafting Assistant Views
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Views = window.BillSaathi.Views || {};

(function () {
  const { esc, btn, badge, money, date } = window.BillSaathi.Config;
  const State = window.BillSaathi.State;

  function draftKey(type) {
    return `${State.isDemo ? 'demo' : 'local'}:${State.getCurrentCase()?.id}:${type}`;
  }

  function render(type) {
    const cur = State.getCurrentCase();
    if (!cur) {
      return `
        <div class="empty">
          ${window.BillSaathi.Icons.get('file')}
          <h3>Create a case first</h3>
          <p>Documents, findings and drafts need a case to stay organized.</p>
          ${btn('Create a case', "BillSaathi.Views.resetWizard();BillSaathi.Router.go('new')", 'primary')}
        </div>
      `;
    }

    let aff = type === 'affidavit';
    let title = aff ? 'Affidavit draft assistant' : 'Complaint & Resolution Assistant';
    let key = draftKey(type);
    let model = State.drafts[key] || { step: 1, selected: [], text: '' };
    State.drafts[key] = model;

    const findings = State.getFindings();

    return `
      <div class="page-heading">
        <div>
          <h1>${title}</h1>
          <p>Build a factual draft. Keep control of every word.</p>
        </div>
        ${BillSaathi.Components.Navigation.caseSelector()}
      </div>

      <div class="notice warning">
        ${window.BillSaathi.Icons.get('warning')}
        <span>${aff ? 'This is an AI-assisted draft, not a sworn or legally validated affidavit. Review it carefully and obtain appropriate legal guidance about execution, attestation, or notarization requirements.' : 'Draft for Review — no complaint is automatically submitted. No legal provisions, authorities or case numbers are inferred.'}</span>
      </div>

      <div class="card padded">
        <div class="wizard-top">
          ${['Select concerns', 'Factual summary', 'Edit draft', 'Review & export'].map((s, i) => `
            <span class="${model.step === i + 1 ? 'active' : model.step > i + 1 ? 'complete' : ''}">${i + 1}. ${s}</span>
          `).join('')}
        </div>

        ${model.step === 1 ? `
          <h3 style="font-size:15px;margin-bottom:6px">Choose what to include</h3>
          <p class="note-text" style="margin-bottom:14px">Sample findings are illustrative, not verified allegations. Documents for this case are included in the draft checklist.</p>
          ${findings.length ? findings.map(f => `
            <label class="check">
              <input type="checkbox" onchange="BillSaathi.Views.toggleDraftFinding('${type}','${f.id}',this.checked)" ${model.selected.includes(f.id) ? 'checked' : ''}>
              ${esc(f.name)} <span class="source-pill">${f.id} · ${f.doc}, p.${f.page}</span>
            </label>
          `).join('') : '<p class="note-text">No audit findings. A blank factual template can still be prepared.</p>'}
          <label for="draft-account" style="margin-top:20px">Your factual account (optional)</label>
          <textarea id="draft-account" placeholder="Only describe facts you can support. Avoid patient identifiers in this prototype." oninput="BillSaathi.State.drafts[BillSaathi.Views.getDraftKey('${type}')].account=this.value">${esc(model.account || '')}</textarea>
        ` : model.step === 2 ? `
          <h3 style="font-size:15px;margin-bottom:6px">Check the factual summary</h3>
          <p class="note-text"><strong>Case:</strong> ${esc(cur.name)} · ${esc(cur.id)}</p>
          <p class="note-text"><strong>Provider:</strong> ${esc(cur.hospital)}</p>
          <p class="note-text"><strong>Bill date:</strong> ${date(cur.date)} · <strong>Amount:</strong> ${money(cur.amount)}</p>
          <p class="note-text"><strong>User-provided account:</strong> ${esc(model.account || 'Not supplied. Placeholder will be included.')}</p>
          ${model.selected.map(id => {
            let f = findings.find(x => x.id === id);
            return f ? `<p class="note-text">${esc(f.name)} — ${esc(f.doc)}, page ${f.page} <span class="badge amber">Sample observation</span></p>` : '';
          }).join('')}
          <div class="notice" style="margin-top:16px">
            ${window.BillSaathi.Icons.get('info')}
            <span>Draft generation here uses a local template, not an AI model. Every unresolved concern is phrased as a request for clarification.</span>
          </div>
        ` : model.step === 3 ? `
          <div class="row" style="justify-content:space-between;margin-bottom:12px">
            <h3 style="font-size:15px">Draft for Review</h3>
            <span class="badge gray">Local template · ${State.isDemo ? 'Demo Data' : 'Not legal advice'}</span>
          </div>
          <label class="sr-only" for="draft-editor">Editable draft</label>
          <textarea class="draft" id="draft-editor" oninput="BillSaathi.State.drafts[BillSaathi.Views.getDraftKey('${type}')].text=this.value">${esc(model.text)}</textarea>
          <p class="inline-note">Edits are kept in this tab. No external AI service has been used.</p>
        ` : `
          <h3 style="font-size:15px;margin-bottom:12px">Final review checklist</h3>
          ${[
            'I checked every factual statement against the original documents.',
            'I understand unresolved flags are not proven errors.',
            'I will verify the recipient, procedure and any execution requirements independently.',
            'I understand this is an unsigned draft and is not automatically submitted.'
          ].map(t => `<label class="check"><input type="checkbox" class="final-check">${t}</label>`).join('')}
          <pre style="white-space:pre-wrap;font:12px/1.8 Georgia,serif;background:#f8fafc;padding:20px;border:1px solid var(--line);border-radius:var(--radius-md);max-height:360px;overflow:auto;margin:16px 0">${esc(model.text)}</pre>
          <div class="actions">
            ${btn('Export draft (.txt)', `BillSaathi.Views.exportDraft('${type}')`, 'primary', 'download')}
            ${btn('Print / Save as PDF', `BillSaathi.Views.printDraft('${type}')`, '', 'file')}
          </div>
          <p class="inline-note">Print opens the browser print dialog; PDF availability depends on your browser.</p>
        `}

        <div class="actions" style="justify-content:space-between;margin-top:24px">
          ${model.step > 1 ? btn('Back', `BillSaathi.State.drafts[BillSaathi.Views.getDraftKey('${type}')].step--;BillSaathi.Router.render()`) : '<span></span>'}
          ${model.step < 4 ? btn(model.step === 2 ? 'Prepare local template' : 'Continue', `BillSaathi.Views.advanceDraft('${type}')`, 'primary', 'arrow') : btn('Reports & Exports', "BillSaathi.Router.go('reports')")}
        </div>
      </div>
    `;
  }

  function toggleDraftFinding(type, id, on) {
    let m = State.drafts[draftKey(type)];
    m.selected = on ? [...new Set([...m.selected, id])] : m.selected.filter(x => x !== id);
  }

  function advanceDraft(type) {
    let m = State.drafts[draftKey(type)];
    if (m.step === 2 && !m.text) m.text = makeDraft(type, m);
    m.step++;
    BillSaathi.Router.render();
  }

  function makeDraft(type, m) {
    const cur = State.getCurrentCase();
    const findings = State.getFindings().filter(f => m.selected.includes(f.id));
    const docs = State.getDocs();

    return `${State.isDemo ? 'DEMO DATA — NOT A REAL PATIENT RECORD\n' : ''}DRAFT FOR REVIEW — ${type === 'affidavit' ? 'FACTUAL AFFIDAVIT TEMPLATE' : 'BILLING CLARIFICATION / COMPLAINT TEMPLATE'}
Local template; no AI model or legal validation was used.

Case reference: ${cur.id}
Prepared: ${new Date().toLocaleDateString('en-GB')}

To: [Recipient / appropriate authority — verify before use]
From: [Complainant name, address and contact details]
Provider: ${cur.hospital}

1. The case information supplied records a bill dated ${date(cur.date)} with a total of ${money(cur.amount)}. These details require confirmation against the original.

2. User-provided chronology / factual account:
${m.account || '[Insert a dated factual account, with a source reference for each statement.]'}

3. Questions for clarification:
${findings.length ? findings.map((f, i) => `3.${i + 1} Please clarify: ${f.name}. ${f.why} Source: ${f.doc}, page ${f.page}. ${State.isDemo ? 'This is a fictional sample observation.' : ''}`).join('\n\n') : '[Insert specific concerns and the supporting document/page references.]'}

4. Supporting document checklist:
${docs.map(d => `- ${d.id}: ${d.name} (${d.confirmed ? 'reviewed locally' : 'not confirmed'}${d.sample ? '; synthetic sample' : ''}).`).join('\n') || '[No supporting documents added.]'}

5. Requested resolution:
[Specify the clarification, itemized explanation, correction or other resolution requested without assuming wrongdoing.]

6. Unresolved questions:
[Confirm the facts, applicability of any pricing references and missing records.]

${type === 'affidavit' ? `7. Verification placeholder:
[Verify the appropriate wording and execution requirements with qualified legal guidance.]

This is an AI-assisted draft, not a sworn or legally validated affidavit. Review it carefully and obtain appropriate legal guidance about execution, attestation, or notarization requirements.\n\n` : ''}Place: [Place]
Date: [Date]
Signature: [To be signed only after review]

This is an unsigned draft, not a filed complaint, sworn statement, legal opinion or verified finding of overcharging. No automatic submission has occurred.`;
  }

  function checkedFinal() {
    if ([...document.querySelectorAll('.final-check')].some(c => !c.checked)) {
      window.BillSaathi.Components.Toast.show('Complete each final review item before exporting.');
      return false;
    }
    return true;
  }

  function exportDraft(type) {
    if (!checkedFinal()) return;
    const cur = State.getCurrentCase();
    BillSaathi.Views.downloadFile(`${cur.id}-${type}-draft.txt`, State.drafts[draftKey(type)].text);
    window.BillSaathi.Components.Toast.show('Draft exported as plain text. Nothing has been submitted.');
  }

  function printDraft(type) {
    if (!checkedFinal()) return;
    BillSaathi.Views.printText(State.drafts[draftKey(type)].text);
  }

  window.BillSaathi.Views.draftPage = render;
  window.BillSaathi.Views.getDraftKey = draftKey;
  window.BillSaathi.Views.toggleDraftFinding = toggleDraftFinding;
  window.BillSaathi.Views.advanceDraft = advanceDraft;
  window.BillSaathi.Views.exportDraft = exportDraft;
  window.BillSaathi.Views.printDraft = printDraft;
})();
