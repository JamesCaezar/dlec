const $ = (id)=>document.getElementById(id);
const fmt2 = (n)=>String(n).padStart(2,'0');

const inBtn = $('timeInBtn');
const outBtn = $('timeOutBtn');
const dateStr = $('dateStr');
const timeStr = $('timeStr');
const statusEl = $('status').querySelector('span');
const todayList = $('todayList');
const tbody = $('historyTable').querySelector('tbody');
const exportBtn = $('exportBtn');
const logoutBtn = $('logoutBtn');

$('year').textContent = new Date().getFullYear();

// Live clock
setInterval(()=>{
  const now = new Date();
  dateStr.textContent = now.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  timeStr.textContent = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}, 250);

// LocalStorage keys
const STORE_KEY = 'dlec_time_entries';

function loadEntries(){
  try{ return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
  catch{ return []; }
}
function saveEntries(items){
  localStorage.setItem(STORE_KEY, JSON.stringify(items));
}
function todayISO(d=new Date()){
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return t.toISOString().slice(0,10);
}
function hhmm(d){ return fmt2(d.getHours()) + ':' + fmt2(d.getMinutes()); }

function render(){
  const items = loadEntries();
  // Populate history
  tbody.innerHTML = '';
  items.sort((a,b)=> (a.date < b.date ? 1 : -1)).forEach(it=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${it.date}</td><td>${it.in||''}</td><td>${it.out||''}</td><td>${it.total||''}</td>`;
    tbody.appendChild(tr);
  });

  // Today section
  const today = items.find(x=>x.date === todayISO());
  todayList.innerHTML = '';
  if(today?.in){ todayList.appendChild(li('Time in: ' + today.in)); }
  if(today?.out){ todayList.appendChild(li('Time out: ' + today.out)); }

  // Button states + status
  if(today?.in && !today?.out){
    statusEl.textContent = 'Timed in';
    inBtn.disabled = true;
    outBtn.disabled = false;
  }else if(today?.in && today?.out){
    statusEl.textContent = 'Completed';
    inBtn.disabled = true;
    outBtn.disabled = true;
  }else{
    statusEl.textContent = 'Not timed in';
    inBtn.disabled = false;
    outBtn.disabled = true;
  }
}

function li(text){ const el=document.createElement('li'); el.textContent=text; return el; }

function totalBetween(inStr, outStr){
  if(!inStr || !outStr) return '';
  const [ih, im] = inStr.split(':').map(Number);
  const [oh, om] = outStr.split(':').map(Number);
  let mins = (oh*60 + om) - (ih*60 + im);
  if(mins < 0) mins += 24*60;
  const h = Math.floor(mins/60), m = mins%60;
  return `${fmt2(h)}:${fmt2(m)}`;
}

inBtn.addEventListener('click', ()=>{
  const now = new Date();
  const items = loadEntries();
  const d = todayISO(now);
  let row = items.find(x=>x.date===d);
  if(row?.in){ alert('Already timed in for today.'); return; }
  if(!row){ row = {date:d}; items.push(row); }
  row.in = hhmm(now);
  saveEntries(items);
  render();
});

outBtn.addEventListener('click', ()=>{
  const now = new Date();
  const items = loadEntries();
  const d = todayISO(now);
  let row = items.find(x=>x.date===d);
  if(!row?.in){ alert('You need to time in first.'); return; }
  if(row.out){ alert('Already timed out for today.'); return; }
  row.out = hhmm(now);
  row.total = totalBetween(row.in, row.out);
  saveEntries(items);
  render();
});

exportBtn.addEventListener('click', ()=>{
  const items = loadEntries();
  const header = 'Date,Time In,Time Out,Total\n';
  const csv = header + items.map(i=>[i.date,i.in||'',i.out||'',i.total||''].join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'dlec-time-history.csv'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
});

logoutBtn.addEventListener('click', ()=>{
  window.location.href = 'index.html';
});

render();
