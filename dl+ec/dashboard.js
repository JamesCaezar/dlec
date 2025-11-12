// Simple attendance timer backed by localStorage (same keys as home.js)
const pad = n => String(n).padStart(2,'0');
const h = document.getElementById('h');
const m = document.getElementById('m');
const s = document.getElementById('s');
const attStatus = document.getElementById('attStatus');
const inBtn = document.getElementById('checkIn');
const outBtn = document.getElementById('checkOut');
const breakBtn = document.getElementById('breakBtn');

const STORE_KEY = 'dlec_time_entries';
const todayISO = (d=new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,10);
const hhmmss = d => pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
const hhmm = d => pad(d.getHours())+':'+pad(d.getMinutes());

function load(){ try{ return JSON.parse(localStorage.getItem(STORE_KEY)||'[]'); }catch{return [];} }
function save(x){ localStorage.setItem(STORE_KEY, JSON.stringify(x)); }

let timer = null;
function startTimer(from){
  stopTimer();
  const start = from || new Date();
  timer = setInterval(()=>{
    const now = new Date();
    const diff = Math.floor((now - start)/1000);
    const H = Math.floor(diff/3600);
    const M = Math.floor((diff%3600)/60);
    const S = diff%60;
    h.textContent = pad(H); m.textContent = pad(M); s.textContent = pad(S);
  }, 1000);
}
function stopTimer(){ if(timer) clearInterval(timer); timer=null; }

function render(){
  const items = load();
  const today = items.find(x=>x.date===todayISO());
  if(today?.in && !today?.out){
    attStatus.textContent = 'In';
    inBtn.disabled = true; outBtn.disabled = false;
    // resume timer from in time
    const [hh,mm] = today.in.split(':').map(Number);
    const start = new Date(); start.setHours(hh, mm, 0, 0);
    startTimer(start);
  }else{
    attStatus.textContent = 'Out';
    inBtn.disabled = false; outBtn.disabled = true;
    stopTimer(); h.textContent=m.textContent=s.textContent='00';
  }
}

inBtn.addEventListener('click', ()=>{
  const items = load();
  const d = todayISO();
  let row = items.find(x=>x.date===d);
  if(row?.in){ alert('Already checked in.'); return; }
  if(!row){ row={date:d}; items.push(row); }
  row.in = hhmm(new Date());
  save(items);
  render();
});

outBtn.addEventListener('click', ()=>{
  const items = load();
  const d = todayISO();
  let row = items.find(x=>x.date===d);
  if(!row?.in){ alert('You need to check in first.'); return; }
  if(row.out){ alert('Already checked out.'); return; }
  row.out = hhmm(new Date());
  // compute total
  const [ih, im] = row.in.split(':').map(Number);
  const [oh, om] = row.out.split(':').map(Number);
  let mins = (oh*60+om) - (ih*60+im);
  if(mins<0) mins += 24*60;
  row.total = pad(Math.floor(mins/60))+':'+pad(mins%60);
  save(items);
  render();
});

breakBtn.addEventListener('click', ()=> alert('Break timer can be added next.'));

render();
