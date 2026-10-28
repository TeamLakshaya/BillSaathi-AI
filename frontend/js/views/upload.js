/**
 * Bill Saathi AI - Document Upload & Preview Center
 */
window.BillSaathi = window.BillSaathi || {};
window.BillSaathi.Views = window.BillSaathi.Views || {};

(function () {
  const { esc, btn, badge, categories, money, date } = window.BillSaathi.Config;
  const State = window.BillSaathi.State;

  function render() {
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

    const docs = State.getDocs();

    return `
      <div class="page-heading">
        <div>
          <h1>Your document center</h1>
          <p>Bring the bill and supporting records together.</p>
        </div>
        ${BillSaathi.Components.Navigation.caseSelector()}
      </div>

      <div class="notice">
        ${window.BillSaathi.Icons.get('lock')}
        <span>Select documents only if you are authorized to use them. In this prototype, files remain in memory in this tab and are not uploaded to a server.</span>
      </div>

      <div class="two-col">
        <section class="card padded">
          <div class="dropzone" id="dropzone">
            ${window.BillSaathi.Icons.get('upload')}
            <h3>Drop your documents here</h3>
            <p>PDF, JPG or PNG · Up to 10 MB per file</p>
            <input type="file" id="file-input" accept="application/pdf,image/jpeg,image/png" multiple hidden onchange="BillSaathi.Views.selectFiles(this.files);this.value=''">
            ${btn('Browse files', "document.getElementById('file-input').click()", 'primary', 'plus')}
            <p style="margin-top:12px;margin-bottom:0">Files are selected locally, not sent to a server.</p>
          </div>
          <div id="pending-files">${pendingHtml()}</div>
          <div class="actions" style="margin-top:20px">
            ${btn('Add selected files locally', 'BillSaathi.Views.commitFiles()', 'primary', 'file')}
            ${btn('Continue to review', "BillSaathi.Router.go('review')")}
          </div>
        </section>

        <section class="card padded">
          <h3 style="margin-top:0;font-size:15px;font-weight:700">Case documents <span class="badge gray">${docs.length}</span></h3>
          ${docs.length ? docs.map(documentRow).join('') : `
            <div class="empty">
              ${window.BillSaathi.Icons.get('file')}
              <h3>No documents yet</h3>
              <p>Select a bill and any supporting records to begin.</p>
            </div>
          `}
          <p class="inline-note">Sample documents are generated illustrations, not actual uploaded patient files.</p>
        </section>
      </div>
    `;
  }

  function pendingHtml() {
    return State.pending.map((p, i) => `
      <div class="document">
        ${window.BillSaathi.Icons.get(p.error ? 'warning' : 'file')}
        <div class="details">
          <strong>${esc(p.file.name)}</strong>
          <small>${(p.file.size / 1024 / 1024).toFixed(2)} MB · ${p.error ? `<span class="error">${esc(p.error)}</span>` : 'Selected locally'}</small>
        </div>
        ${!p.error ? `
          <select aria-label="Category for ${esc(p.file.name)}" onchange="BillSaathi.State.pending[${i}].category=this.value">
            ${categories.map(c => `<option ${p.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
          </select>
        ` : ''}
        ${btn('Remove', `BillSaathi.Views.removePendingFile(${i})`, 'small')}
      </div>
    `).join('');
  }

  function refreshPending() {
    const el = document.getElementById('pending-files');
    if (el) el.innerHTML = pendingHtml();
  }

  function selectFiles(files) {
    for (let f of files) {
      let error = !['application/pdf', 'image/jpeg', 'image/png'].includes(f.type) ? 'Unsupported file type' :
                  f.size > 10 * 1024 * 1024 ? 'File exceeds 10 MB' :
                  f.size === 0 ? 'File is empty' : '';
      State.pending.push({ file: f, error, category: categories[0] });
    }
    refreshPending();
  }

  function wireDrop() {
    let z = document.getElementById('dropzone');
    if (!z) return;
    z.ondragover = e => { e.preventDefault(); z.classList.add('drag'); };
    z.ondragleave = () => z.classList.remove('drag');
    z.ondrop = e => { e.preventDefault(); z.classList.remove('drag'); selectFiles(e.dataTransfer.files); };
  }

  function commitFiles() {
    let valid = State.pending.filter(p => !p.error);
    if (!valid.length) {
      window.BillSaathi.Components.Toast.show('Choose at least one valid PDF, JPG or PNG first.');
      return;
    }
    const cur = State.getCurrentCase();
    for (let p of valid) {
      let id = 'DOC-' + Date.now() + '-' + Math.random().toString(16).slice(2, 6);
      State.getStore().docs.push({
        id,
        caseId: cur.id,
        name: p.file.name,
        category: p.category,
        status: 'Selected locally',
        size: p.file.size,
        type: p.file.type,
        sample: false
      });
      State.docUrls.set(id, URL.createObjectURL(p.file));
    }
    State.pending = State.pending.filter(p => p.error);
    State.addActivity(`${valid.length} document(s) selected locally`);
    BillSaathi.Router.render();
    window.BillSaathi.Components.Toast.show('Files added to this tab only. Server upload and OCR are unavailable.');
  }

  function documentRow(d) {
    return `
      <div class="document">
        ${window.BillSaathi.Icons.get('file')}
        <div class="details">
          <strong>${esc(d.name)}</strong>
          <small>${esc(d.category)} · ${d.sample ? 'Demo Data' : (d.size / 1024).toFixed(0) + ' KB'}</small>
          <div style="margin-top:5px">${badge(d.status)}</div>
        </div>
        ${btn('Preview', `BillSaathi.Views.previewDoc('${d.id}')`, 'small', 'eye')}
        ${btn('Review', `BillSaathi.Views.reviewDoc('${d.id}')`, 'small')}
      </div>
    `;
  }

  function previewDoc(id) {
    let d = State.getStore().docs.find(doc => doc.id === id);
    if (!d) return;
    window.BillSaathi.Components.Modal.show(d.name, `<div class="doc-preview" style="min-height:300px">${documentPreview(d)}</div>`);
  }

  function documentPreview(d) {
    if (d.sample) return samplePaper(d);
    let u = State.docUrls.get(d.id);
    if (!u) return '<p>Preview unavailable in this session. Select the file again.</p>';
    return d.type === 'application/pdf' ?
      `<iframe title="Document preview" src="${u}" style="border:0;width:100%;height:520px"></iframe>` :
      `<img src="${u}" alt="Selected document preview" style="max-width:100%;height:auto">`;
  }

  function samplePaper(d) {
    const cur = State.getCurrentCase();
    let bill = d.category.includes('invoices');
    return `
      <div class="paper">
        <div class="eyebrow">SYNTHETIC DOCUMENT · DEMO DATA</div>
        <h3>${esc(cur?.hospital || 'Sample provider')}</h3>
        <p style="font-size:11px;color:var(--text-muted);margin:8px 0 14px">
          ${bill ? 'ITEMIZED HOSPITAL BILL' : 'SUPPORTING DOCUMENT'}<br>
          Sample patient · ${esc(cur?.id)}<br>
          Invoice: SAMPLE-2026-01<br>
          Bill date: ${date(cur?.date)}
        </p>
        <hr style="border:0;border-top:1px solid #dce2ea;margin-bottom:14px">
        ${bill && cur?.id !== 'BS-1024' ? `
          <p class="note-text">Sample discharge invoice total: ${money(cur?.amount)}. Detailed line items are not supplied in this illustration.</p>
        ` : bill ? `
          <table>
            <tbody>
              ${[
                ['Room & nursing', 30000],
                ['Procedure & services', 42000],
                ['CBC panel', 2500],
                ['CBC panel', 2500],
                ['Medicines & supplies', 7000]
              ].map(([l, a]) => `<tr><td>${l}</td><td style="font-weight:600">${money(a)}</td></tr>`).join('')}
              <tr style="border-top:2px solid #e2e8f0">
                <td><strong>Line-item total</strong></td>
                <td><strong>₹84,000</strong></td>
              </tr>
              <tr>
                <td><strong>Billed total</strong></td>
                <td><strong>₹84,500</strong></td>
              </tr>
            </tbody>
          </table>
        ` : '<p class="note-text">This fictional supporting document is a preview placeholder. No clinical narrative or patient identity is provided.</p>'}
        <p style="font-size:9.5px;color:#94a3b8;margin-top:30px">
          Page 1 · Generated illustration, not an actual patient record.<br>Amounts are synthetic and do not represent official rates.
        </p>
      </div>
    `;
  }

  function reviewDoc(id) {
    BillSaathi.Views.selectedDoc = id;
    BillSaathi.Router.go('review');
  }

  window.BillSaathi.Views.uploadPage = render;
  window.BillSaathi.Views.wireDrop = wireDrop;
  window.BillSaathi.Views.selectFiles = selectFiles;
  window.BillSaathi.Views.commitFiles = commitFiles;
  window.BillSaathi.Views.removePendingFile = i => { State.pending.splice(i, 1); refreshPending(); };
  window.BillSaathi.Views.previewDoc = previewDoc;
  window.BillSaathi.Views.reviewDoc = reviewDoc;
  window.BillSaathi.Views.documentPreview = documentPreview;
  window.BillSaathi.Views.samplePaper = samplePaper;
})();
