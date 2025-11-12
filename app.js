/* ==========
  Storage helpers
========== */
const LS_KEYS = {
  PROJECTS: 'tcb_projects',
  PROGRESS: 'tcb_progress_reports',
};

function loadProjects(){
  try { return JSON.parse(localStorage.getItem(LS_KEYS.PROJECTS)) || []; }
  catch{ return []; }
}

function saveProjects(projects){
  localStorage.setItem(LS_KEYS.PROJECTS, JSON.stringify(projects));
}

function loadProgressReports(){
  try { return JSON.parse(localStorage.getItem(LS_KEYS.PROGRESS)) || []; }
  catch{ return []; }
}

function saveProgressReports(reports){
  localStorage.setItem(LS_KEYS.PROGRESS, JSON.stringify(reports));
}

function uid(){ return Math.random().toString(36).slice(2,10); }

function setYear(){
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ==========
  Page router
========== */
document.addEventListener('DOMContentLoaded', () => {
  setYear();
  const page = document.body.dataset.page;
  if (page === 'create-boq') initCreateBOQ();
  if (page === 'list-boq') initListBOQ();
  if (page === 'progress') initProgress();
});

/* ==========
  Create BOQ
========== */
function initCreateBOQ(){
  const tbody = document.getElementById('boqTbody');
  const addRowBtn = document.getElementById('addRowBtn');
  const clearRowsBtn = document.getElementById('clearRowsBtn');
  const saveBtn = document.getElementById('saveProjectBtn');

  function addRow(item = { description:'', qty:'', unit:'' }){
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td><input class="table-input desc" placeholder="e.g., Excavation works" value="${escapeAttr(item.description)}"></td>
      <td><input type="number" min="0" step="any" class="table-input qty" placeholder="0" value="${escapeAttr(item.qty)}"></td>
      <td><input class="table-input unit" placeholder="e.g., m³" value="${escapeAttr(item.unit)}"></td>
      <td class="right">
        <button class="icon-btn remove">Remove</button>
      </td>
    `;

    tr.querySelector('.remove').addEventListener('click', () => {
      tr.remove();
    });

    tbody.appendChild(tr);
  }

  addRowBtn.addEventListener('click', () => addRow());
  clearRowsBtn.addEventListener('click', () => { tbody.innerHTML = ''; });

  // Start with one empty row
  addRow();

  saveBtn.addEventListener('click', () => {
    const name = document.getElementById('projectName').value.trim();
    const location = document.getElementById('projectLocation').value.trim();
    const owner = document.getElementById('projectOwner').value.trim();

    if (!name){
      alert('Project Name is required.');
      return;
    }

    const items = [...tbody.querySelectorAll('tr')].map(tr => {
      const d = tr.querySelector('.desc').value.trim();
      const q = parseNumber(tr.querySelector('.qty').value);
      const u = tr.querySelector('.unit').value.trim();
      return d || q || u ? { description: d, qty: q, unit: u } : null;
    }).filter(Boolean);

    if (items.length === 0){
      if (!confirm('No BOQ items added. Save project without items?')) return;
    }

    const projects = loadProjects();
    const project = { id: uid(), name, location, owner, items };
    projects.push(project);
    saveProjects(projects);

    alert('Project saved.');
    window.location.href = 'list-boq.html';
  });
}

/* ==========
  List BOQ
========== */
function initListBOQ(){
  const tbody = document.getElementById('projectsTbody');
  const emptyState = document.getElementById('emptyState');
  const detailCard = document.getElementById('boqDetailCard');
  const detailTitle = document.getElementById('detailTitle');
  const detailBody = document.getElementById('boqDetailBody');
  const closeDetail = document.getElementById('closeDetail');

  function render(){
    const projects = loadProjects();
    tbody.innerHTML = '';
    if (projects.length === 0){
      emptyState.hidden = false;
      document.getElementById('projectsWrap').style.display = 'none';
      return;
    }
    emptyState.hidden = true;
    document.getElementById('projectsWrap').style.display = '';

    projects.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHTML(p.name)}</td>
        <td>${escapeHTML(p.location || '')}</td>
        <td>${escapeHTML(p.owner || '')}</td>
        <td>
          <button class="icon-btn view" data-id="${p.id}">View</button>
          <button class="icon-btn danger delete" data-id="${p.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.view').forEach(btn => {
      btn.addEventListener('click', () => showDetail(btn.dataset.id));
    });
    tbody.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', () => delProject(btn.dataset.id));
    });
  }

  function showDetail(id){
    const projects = loadProjects();
    const p = projects.find(x => x.id === id);
    if (!p) return;
    detailTitle.textContent = `BOQ Details — ${p.name}`;
    detailBody.innerHTML = '';
    if ((p.items || []).length === 0){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="3"><em>No BOQ items.</em></td>`;
      detailBody.appendChild(tr);
    } else {
      p.items.forEach(it => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHTML(it.description || '')}</td>
          <td>${formatNumber(it.qty)}</td>
          <td>${escapeHTML(it.unit || '')}</td>
        `;
        detailBody.appendChild(tr);
      });
    }
    detailCard.hidden = false;
    detailCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function delProject(id){
    if (!confirm('Delete this project? This cannot be undone.')) return;
    const projects = loadProjects().filter(p => p.id !== id);
    saveProjects(projects);
    detailCard.hidden = true;
    render();
  }

  closeDetail.addEventListener('click', () => { detailCard.hidden = true; });
  render();
}

/* ==========
  Progress
========== */
function initProgress(){
  const select = document.getElementById('progressProjectSelect');
  const dateInput = document.getElementById('reportDate');
  const tbody = document.getElementById('progressTbody');
  const totalProgressQtyEl = document.getElementById('totalProgressQty');
  const overallPctEl = document.getElementById('overallProgressPct');
  const addRowBtn = document.getElementById('addProgRowBtn');
  const clearRowsBtn = document.getElementById('clearProgRowsBtn');
  const saveBtn = document.getElementById('saveProgressBtn');
  const printBtn = document.getElementById('printPdfBtn');

  // Print elements
  const printArea = document.getElementById('printArea');
  const printProjectName = document.getElementById('printProjectName');
  const printProjectLocation = document.getElementById('printProjectLocation');
  const printProjectOwner = document.getElementById('printProjectOwner');
  const printReportDate = document.getElementById('printReportDate');
  const printTbody = document.getElementById('printTbody');
  const printTotalProgressQty = document.getElementById('printTotalProgressQty');
  const printOverallProgressPct = document.getElementById('printOverallProgressPct');

  // Populate projects
  const projects = loadProjects();
  select.innerHTML = '';
  if (projects.length === 0){
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No projects found — create a BOQ first';
    select.appendChild(opt);
    select.disabled = true;
  } else {
    projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      select.appendChild(opt);
    });
  }

  // Default date = today
  dateInput.valueAsNumber = Date.now() - (new Date().getTimezoneOffset() * 60000);

  function addRow(item = { description:'', boqQty:'', unit:'', progQty:'' }){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="table-input desc" placeholder="Description" value="${escapeAttr(item.description)}"></td>
      <td><input type="number" min="0" step="any" class="table-input boq" placeholder="0" value="${escapeAttr(item.boqQty)}"></td>
      <td><input class="table-input unit" placeholder="Unit" value="${escapeAttr(item.unit)}"></td>
      <td><input type="number" min="0" step="any" class="table-input prog" placeholder="0" value="${escapeAttr(item.progQty)}"></td>
      <td class="pct right">0%</td>
      <td class="remarks"><span class="badge warn">Ongoing</span></td>
      <td class="right"><button class="icon-btn remove">Remove</button></td>
    `;
    tr.querySelector('.remove').addEventListener('click', () => {
      tr.remove(); recalc();
    });
    tr.querySelectorAll('.boq, .prog').forEach(inp => {
      inp.addEventListener('input', recalc);
    });
    tbody.appendChild(tr);
    recalc();
  }

  function loadSelectedProjectRows(){
    tbody.innerHTML = '';
    const id = select.value;
    const project = projects.find(p => p.id === id);
    if (!project){ return; }
    if ((project.items || []).length === 0){
      addRow();
      return;
    }
    project.items.forEach(it => {
      addRow({
        description: it.description || '',
        boqQty: it.qty || '',
        unit: it.unit || '',
        progQty: ''
      });
    });
  }

  function recalc(){
    let totalProg = 0;
    let totalBoq = 0;

    [...tbody.querySelectorAll('tr')].forEach(tr => {
      const boq = parseNumber(tr.querySelector('.boq').value);
      const prog = parseNumber(tr.querySelector('.prog').value);
      totalProg += prog;
      totalBoq += boq;
      const pctCell = tr.querySelector('.pct');
      const remarksCell = tr.querySelector('.remarks');
      const pct = boq > 0 ? Math.min((prog/boq)*100, 100) : 0;
      pctCell.textContent = `${formatNumber(pct)}%`;
      const done = pct >= 100;
      remarksCell.innerHTML = done ? '<span class="badge ok">Completed</span>' : '<span class="badge warn">Ongoing</span>';
    });

    totalProgressQtyEl.textContent = formatNumber(totalProg);
    const overall = totalBoq > 0 ? Math.min((totalProg/totalBoq)*100, 100) : 0;
    overallPctEl.textContent = `${formatNumber(overall)}%`;
  }

  function gatherRows(){
    return [...tbody.querySelectorAll('tr')].map(tr => {
      const boq = parseNumber(tr.querySelector('.boq').value);
      const prog = parseNumber(tr.querySelector('.prog').value);
      const pct = boq > 0 ? Math.min((prog/boq)*100, 100) : 0;
      const done = pct >= 100;
      return {
        description: tr.querySelector('.desc').value.trim(),
        boqQty: boq,
        unit: tr.querySelector('.unit').value.trim(),
        progQty: prog,
        pct,
        remarks: done ? 'Completed' : 'Ongoing'
      };
    }).filter(row => row.description || row.boqQty || row.unit || row.progQty);
  }

  function populatePrintArea(project, rows, totals){
    printProjectName.textContent = project?.name || '';
    printProjectLocation.textContent = project?.location || '';
    printProjectOwner.textContent = project?.owner || '';
    printReportDate.textContent = dateInput.value || new Date().toISOString().slice(0,10);

    printTbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHTML(r.description)}</td>
        <td>${formatNumber(r.boqQty)}</td>
        <td>${escapeHTML(r.unit)}</td>
        <td>${formatNumber(r.progQty)}</td>
        <td>${formatNumber(r.pct)}%</td>
        <td>${escapeHTML(r.remarks)}</td>
      `;
      printTbody.appendChild(tr);
    });
    printTotalProgressQty.textContent = formatNumber(totals.totalProg);
    printOverallProgressPct.textContent = `${formatNumber(totals.overall)}%`;
  }

  addRowBtn.addEventListener('click', () => addRow());
  clearRowsBtn.addEventListener('click', () => { tbody.innerHTML=''; recalc(); });

  select.addEventListener('change', loadSelectedProjectRows);

  // Load initial project (if any)
  if (!select.disabled) loadSelectedProjectRows();

  saveBtn.addEventListener('click', () => {
    const pid = select.value;
    if (!pid){ alert('Select a project.'); return; }
    const project = projects.find(p => p.id === pid);
    const rows = gatherRows();

    const totals = {
      totalProg: rows.reduce((a,b)=>a + (b.progQty||0), 0),
      totalBoq: rows.reduce((a,b)=>a + (b.boqQty||0), 0),
    };
    totals.overall = totals.totalBoq > 0 ? Math.min((totals.totalProg / totals.totalBoq) * 100, 100) : 0;

    const reports = loadProgressReports();
    reports.push({
      id: uid(),
      projectId: pid,
      date: (document.getElementById('reportDate').value || new Date().toISOString().slice(0,10)),
      rows,
      totals
    });
    saveProgressReports(reports);
    alert('Progress report saved.');
  });

  printBtn.addEventListener('click', () => {
    const pid = select.value;
    const project = projects.find(p => p.id === pid);
    const rows = gatherRows();

    const totals = {
      totalProg: rows.reduce((a,b)=>a + (b.progQty||0), 0),
      totalBoq: rows.reduce((a,b)=>a + (b.boqQty||0), 0),
    };
    totals.overall = totals.totalBoq > 0 ? Math.min((totals.totalProg / totals.totalBoq) * 100, 100) : 0;

    populatePrintArea(project, rows, totals);

    printArea.setAttribute('aria-hidden','false');
    window.print();
    printArea.setAttribute('aria-hidden','true');
  });
}

/* ==========
  Utils
========== */
function parseNumber(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatNumber(n){
  if (!Number.isFinite(n)) return '0';
  const s = (Math.round(n*1000)/1000).toString();
  return s;
}

function escapeHTML(str=''){
  return str.replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]));
}

function escapeAttr(str=''){
  return escapeHTML(String(str)).replace(/"/g, '&quot;');
}
