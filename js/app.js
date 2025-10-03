// js/app.js
const STORAGE_KEY = 'handz_accounts_v1';
let accounts = [];
let selectedId = null;

const DENOMS = [
  {label:'1¢', value:0.01, img:'1c.png'},
  {label:'2¢', value:0.02, img:'2c.png'},
  {label:'5¢', value:0.05, img:'5c.png'},
  {label:'10¢', value:0.1, img:'10c.png'},
  {label:'20¢', value:0.2, img:'20c.png'},
  {label:'50¢', value:0.5, img:'50c.png'},
  {label:'1€', value:1, img:'1e.png'},
  {label:'2€', value:2, img:'2e.png'},
  {label:'5€', value:5, img:'5e.png'},
  {label:'10€', value:10, img:'0e.png'},
  {label:'20€', value:20, img:'20e.png'},
  {label:'50€', value:50, img:'50e.png'},
  {label:'100€', value:100, img:'100e.png'},
  {label:'200€', value:200, img:'200e.png'},
  {label:'500€', value:500, img:'500e.png'}
];

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    accounts = raw ? JSON.parse(raw) : [];
  }catch(e){accounts=[]}
}
function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function fmt(euro){
  return euro.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' €';
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}

const accountsList = document.getElementById('accountsList');
const totalAmountEl = document.getElementById('totalAmount');
const emptyHint = document.getElementById('emptyHint');

function renderList(){
  accountsList.innerHTML='';
  if(accounts.length===0){ emptyHint.style.display='block'; }
  else{ emptyHint.style.display='none'; }
  accounts.forEach(acc=>{
    const el = document.createElement('div'); el.className='acct'; el.dataset.id=acc.id;
    el.innerHTML = `
      <div class="left">
        <div class="avatar">${(acc.name||'K').slice(0,2).toUpperCase()}</div>
        <div class="meta">
          <div class="name">${escapeHtml(acc.name)}</div>
          <div class="goal">Ziel: ${acc.goal? fmt(acc.goal) : '–'}</div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:800">${fmt(acc.amount)}</div>
        <div class="small">${new Date(acc.lastEdited).toLocaleString('de-DE') || '–'}</div>
      </div>
    `;
    el.addEventListener('click',()=>selectAccount(acc.id));
    accountsList.appendChild(el);
  });
  updateTotal();
}

function updateTotal(){
  const total = accounts.reduce((s,a)=>s + Number(a.amount||0),0);
  totalAmountEl.textContent = fmt(total);
}

const detailEmpty = document.getElementById('detailEmpty');
const detailView = document.getElementById('detailView');
const detailName = document.getElementById('detailName');
const detailGoal = document.getElementById('detailGoal');
const detailAmount = document.getElementById('detailAmount');
const progressBar = document.getElementById('progressBar');
const lastEdited = document.getElementById('lastEdited');

function selectAccount(id){
  selectedId = id;
  const acc = accounts.find(a=>a.id===id);
  if(!acc) return;
  detailEmpty.style.display='none';
  detailView.style.display='block';
  detailName.textContent = acc.name;
  detailGoal.textContent = 'Ziel: ' + (acc.goal? fmt(acc.goal) : '–');
  detailAmount.textContent = fmt(acc.amount||0);
  lastEdited.textContent = acc.lastEdited ? new Date(acc.lastEdited).toLocaleString('de-DE') : '–';
  if(acc.goal){
    const pct = Math.min(100, Math.round((acc.amount/acc.goal)*100));
    progressBar.style.width = pct + '%';
  } else { progressBar.style.width = '0%'; }
}

// Modal Handling
const modal = document.getElementById('modal');
const openCreate = document.getElementById('openCreate');
const cancelCreate = document.getElementById('cancelCreate');
const createAcct = document.getElementById('createAcct');

openCreate.addEventListener('click',()=>{ modal.style.display='block'; });
cancelCreate.addEventListener('click',()=>{ modal.style.display='none'; });
createAcct.addEventListener('click',()=>{
  const name = document.getElementById('acctName').value.trim() || 'Neues Konto';
  const goal = Number(document.getElementById('acctGoal').value) || null;
  const start = Number(document.getElementById('acctStart').value) || 0;
  const a = {id:uid(),name,goal,amount:parseFloat(start.toFixed(2)),lastEdited: new Date().toISOString()};
  accounts.push(a); save(); renderList(); modal.style.display='none';
  document.getElementById('acctName').value='';document.getElementById('acctGoal').value='';document.getElementById('acctStart').value='';
});

// Denom Inputs
const denomsGrid = document.getElementById('denomsGrid');
function buildDenomInputs(){
  denomsGrid.innerHTML='';
  const sorted = [...DENOMS].sort((a,b)=>b.value - a.value);
  sorted.forEach(d=>{
    const wrap = document.createElement('div'); wrap.className='denom';
    wrap.innerHTML = `
      <img src="data/img/${d.img}" alt="${d.label}">
      <div style="flex:1">
        <label>${d.label}</label>
        <div class="small">Wert: ${d.value>=1 ? d.value + ' €' : Math.round(d.value*100) + ' Cent'}</div>
      </div>
      <div>
        <input type="number" min="0" step="1" value="0" data-value="${d.value}" />
      </div>
    `;
    denomsGrid.appendChild(wrap);
  });
}

buildDenomInputs();

const applyBtn = document.getElementById('applyBtn');
const resetBtn = document.getElementById('resetBtn');
applyBtn.addEventListener('click',()=>{
  if(!selectedId){ alert('Bitte wähle zuerst ein Konto aus.'); return; }
  const inputs = denomsGrid.querySelectorAll('input[type=number]');
  let added = 0;
  inputs.forEach(inp=>{
    const cnt = Math.max(0, Math.floor(Number(inp.value) || 0));
    const v = Number(inp.dataset.value);
    added += cnt * v;
  });
  if(added===0){ alert('Bitte mindestens eine Zahl > 0 eingeben.'); return; }
  const acc = accounts.find(a=>a.id===selectedId);
  acc.amount = parseFloat((Number(acc.amount||0) + added).toFixed(2));
  acc.lastEdited = new Date().toISOString();
  save(); renderList(); selectAccount(acc.id);
  inputs.forEach(i=>i.value=0);
});
resetBtn.addEventListener('click',()=>{ denomsGrid.querySelectorAll('input').forEach(i=>i.value=0); });

// Edit & Delete
const editAccountBtn = document.getElementById('editAccount');
const deleteAccountBtn = document.getElementById('deleteAccount');
const editModal = document.getElementById('editModal');
const cancelEdit = document.getElementById('cancelEdit');
const saveEdit = document.getElementById('saveEdit');

editAccountBtn.addEventListener('click',()=>{
  if(!selectedId) return; const acc = accounts.find(a=>a.id===selectedId);
  document.getElementById('editName').value = acc.name;
  document.getElementById('editGoal').value = acc.goal || '';
  editModal.style.display='block';
});
cancelEdit.addEventListener('click',()=>{ editModal.style.display='none'; });
saveEdit.addEventListener('click',()=>{
  const acc = accounts.find(a=>a.id===selectedId); if(!acc) return;
  acc.name = document.getElementById('editName').value.trim() || acc.name;
  const g = Number(document.getElementById('editGoal').value);
  acc.goal = g>0 ? parseFloat(g.toFixed(2)) : null;
  acc.lastEdited = new Date().toISOString();
  save(); renderList(); selectAccount(acc.id); editModal.style.display='none';
});

deleteAccountBtn.addEventListener('click',()=>{
  if(!selectedId) return; if(!confirm('Konto wirklich löschen? Diese Aktion ist permanent.')) return;
  accounts = accounts.filter(a=>a.id!==selectedId); selectedId=null; save(); renderList(); detailView.style.display='none'; detailEmpty.style.display='block';
});

function escapeHtml(s){ return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

load(); renderList();

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    modal.style.display='none'; editModal.style.display='none';
  }
});
