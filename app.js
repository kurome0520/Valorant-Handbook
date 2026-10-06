const STORAGE_KEY = 'valorantHubDataV1';
const AUTH_KEY = 'valorantHubAdminV1';

const defaultData = {
  training: [
    { id: crypto.randomUUID(), name: '靶場暖身 Range Warm-up', desc: '機器人 / 移動射擊 / 微調準心', done: false },
    { id: crypto.randomUUID(), name: '爆頭練習 Headshot Practice', desc: 'Guardian / Sheriff 爆頭專注', done: false },
    { id: crypto.randomUUID(), name: '死鬥 Deathmatch', desc: '只專注準心預瞄 Crosshair Placement', done: false },
    { id: crypto.randomUUID(), name: '移動＋點射 Movement + Burst', desc: '練習停下再射的節奏', done: false },
    { id: crypto.randomUUID(), name: '點位複習 Lineup Review', desc: '複習今天可能會玩的地圖', done: false }
  ],
  maps: [
    {
      id: crypto.randomUUID(), map: 'Ascent', agent: 'Sova',
      lineups: [
        { id: crypto.randomUUID(), name: 'A Main Recon', side: 'Attack', skill: 'Recon Bolt', status: '熟練', note: '從 A Main 外側對準屋頂邊角，二格蓄力。', url: '' },
        { id: crypto.randomUUID(), name: 'B Site Recon', side: 'Attack', skill: 'Recon Bolt', status: '練習中', note: '進點前先清後點視野。', url: '' }
      ]
    },
    { id: crypto.randomUUID(), map: 'Bind', agent: 'Viper', lineups: [] },
    { id: crypto.randomUUID(), map: 'Haven', agent: 'Cypher', lineups: [] }
  ],
  notes: [
    { id: crypto.randomUUID(), title: '今天要改的習慣', body: '進點不要急著先拿技能，先確認隊友位置。', updatedAt: new Date().toISOString() }
  ]
};

let data = loadData();
let isAdmin = sessionStorage.getItem(AUTH_KEY) === '1';
let selectedMapId = null;
let formHandler = null;

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultData);
  try {
    const parsed = JSON.parse(saved);
    const trainingNameMap = {
      'Range Warm-up': '靶場暖身 Range Warm-up',
      'Headshot Practice': '爆頭練習 Headshot Practice',
      'Deathmatch': '死鬥 Deathmatch',
      'Movement + Burst': '移動＋點射 Movement + Burst',
      'Lineup Review': '點位複習 Lineup Review'
    };
    const trainingDescMap = {
      'Bots / strafing / micro adjustment': '機器人 / 移動射擊 / 微調準心',
      'Guardian / Sheriff focus': 'Guardian / Sheriff 爆頭專注',
      'Crosshair placement only': '只專注準心預瞄 Crosshair Placement',
      'Stop-shoot timing': '練習停下再射的節奏'
    };
    (parsed.training || []).forEach(item => {
      if (trainingNameMap[item.name]) item.name = trainingNameMap[item.name];
      if (trainingDescMap[item.desc]) item.desc = trainingDescMap[item.desc];
    });
    return parsed;
  } catch { return structuredClone(defaultData); }
}
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); renderAll(); }

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function escapeHtml(value='') {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function renderAll() {
  renderMode();
  renderProgress();
  renderTraining();
  renderMaps();
  renderNotes();
  renderDashboard();
  if (selectedMapId) renderLineups(selectedMapId);
}

function renderMode() {
  $('#modeBadge').textContent = isAdmin ? '編輯模式 EDIT MODE' : '瀏覽模式 VIEW MODE';
  $('#modeBadge').classList.toggle('admin', isAdmin);
  $('#adminToggle').textContent = isAdmin ? '登出管理 Logout' : '管理登入 Admin';
  $$('.admin-only').forEach(el => el.classList.toggle('hidden', !isAdmin));
}

function progressStats() {
  const total = data.training.length;
  const done = data.training.filter(x => x.done).length;
  return { total, done, pct: total ? Math.round(done / total * 100) : 0 };
}
function renderProgress() {
  const { total, done, pct } = progressStats();
  $('#sidebarProgress').textContent = `${done} / ${total}`;
  $('#sidebarProgressBar').style.width = `${pct}%`;
  $('#heroProgressText').textContent = `${done} / ${total}`;
  $('#heroProgressBar').style.width = `${pct}%`;
  $('#heroMessage').textContent = done === total && total ? '今日練槍完成。' : done ? `已完成 ${done} 項，還剩 ${total-done} 項。` : '今天還沒開始，先完成一項吧。';
}

function renderTraining() {
  const root = $('#trainingList');
  root.innerHTML = data.training.map(item => `
    <div class="training-item ${item.done ? 'done' : ''}">
      <input class="training-check" type="checkbox" ${item.done ? 'checked' : ''} data-training-check="${item.id}" ${!isAdmin ? 'disabled' : ''}/>
      <div>
        <div class="training-name">${escapeHtml(item.name)}</div>
        <div class="training-desc">${escapeHtml(item.desc || '')}</div>
      </div>
      ${isAdmin ? `<div class="item-actions"><button class="mini-btn" data-edit-training="${item.id}">編輯 Edit</button><button class="mini-btn danger" data-delete-training="${item.id}">刪除 Delete</button></div>` : ''}
    </div>`).join('') || '<div class="empty-state">還沒有練槍項目。</div>';
}

function mapCard(m) {
  return `<div class="map-card" data-map="${m.id}">
    <div class="map-name">${escapeHtml(m.map)}</div>
    <div class="agent">${escapeHtml(m.agent || '未設定角色 NO AGENT')}</div>
    <div class="map-meta"><span>${m.lineups?.length || 0} 個點位 Lineups</span><span>開啟 Open →</span></div>
  </div>`;
}
function renderMaps() {
  const html = data.maps.map(mapCard).join('') || '<div class="empty-state">還沒有地圖。</div>';
  $('#mapsGrid').innerHTML = html;
  $('#dashboardMaps').innerHTML = html;
}

function renderLineups(mapId) {
  const map = data.maps.find(m => m.id === mapId);
  if (!map) return;
  selectedMapId = mapId;
  $('#lineupPanel').innerHTML = `
    <div class="lineup-head">
      <div><div class="card-kicker">${escapeHtml(map.agent || '角色 AGENT')}</div><h3>${escapeHtml(map.map)}</h3></div>
      <div class="item-actions">
        ${isAdmin ? `<button class="mini-btn" data-edit-map="${map.id}">編輯地圖 Edit Map</button><button class="mini-btn danger" data-delete-map="${map.id}" >刪除 Delete</button><button class="primary-btn" data-add-lineup="${map.id}">+ 新增點位 Add Lineup</button>` : ''}
      </div>
    </div>
    <div class="lineup-list">
      ${(map.lineups || []).map(l => `
        <div class="lineup-card">
          <div class="lineup-card-top">
            <div>
              <div class="lineup-title">${escapeHtml(l.name)}</div>
              <div class="tags"><span class="tag">${escapeHtml(l.side || '')}</span><span class="tag">${escapeHtml(l.skill || '')}</span><span class="tag">${escapeHtml(l.status || '')}</span></div>
            </div>
            ${isAdmin ? `<div class="item-actions"><button class="mini-btn" data-edit-lineup="${l.id}" data-mapid="${map.id}" >編輯 Edit</button><button class="mini-btn danger" data-delete-lineup="${l.id}" data-mapid="${map.id}">刪除 Delete</button></div>` : ''}
          </div>
          <div class="lineup-note">${escapeHtml(l.note || '')}</div>
          ${l.url ? `<div style="margin-top:9px"><a class="lineup-link" href="${escapeHtml(l.url)}" target="_blank" rel="noreferrer">開啟參考連結 Reference ↗</a></div>` : ''}
        </div>`).join('') || '<div class="empty-state">這張地圖還沒有 Lineup。</div>'}
    </div>`;
}

function renderNotes() {
  const root = $('#notesGrid');
  root.innerHTML = data.notes.map(noteCard).join('') || '<div class="empty-state">還沒有筆記。</div>';
}
function noteCard(n) {
  const date = new Date(n.updatedAt || Date.now()).toLocaleDateString('zh-TW');
  return `<div class="note-card">
    <div class="note-title">${escapeHtml(n.title)}</div>
    <div class="note-body">${escapeHtml(n.body)}</div>
    <div class="note-foot">更新於 Updated ${date}</div>
    ${isAdmin ? `<div class="item-actions"><button class="mini-btn" data-edit-note="${n.id}">編輯 Edit</button><button class="mini-btn danger" data-delete-note="${n.id}">刪除 Delete</button></div>` : ''}
  </div>`;
}
function renderDashboard() {
  $('#recentNotes').innerHTML = data.notes.slice().sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)).slice(0,3).map(noteCard).join('') || '<div class="empty-state">還沒有筆記。</div>';
}

function setView(name) {
  const map = {dashboard:['首頁 Dashboard','個人 VALORANT 系統 / PERSONAL SYSTEM'],training:['練槍菜單 Training','每日訓練 / DAILY ROUTINE'],maps:['地圖 / 點位 Lineups','點位資料庫 / LINEUP DATABASE'],notes:['筆記 Notes','個人筆記 / PERSONAL NOTES']};
  $$('.view').forEach(v => v.classList.remove('active'));
  $(`#${name}View`).classList.add('active');
  $$('.nav-item[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  $('#pageTitle').textContent = map[name][0]; $('#pageEyebrow').textContent = map[name][1];
}

function openForm({title,kicker='EDIT',fields,values={},onSave}) {
  $('#modalTitle').textContent = title; $('#modalKicker').textContent = kicker;
  $('#formFields').innerHTML = fields.map(f => {
    const val = values[f.name] ?? '';
    if (f.type === 'textarea') return `<label class="field-label">${f.label}</label><textarea class="input" name="${f.name}" rows="4" placeholder="${f.placeholder||''}">${escapeHtml(val)}</textarea>`;
    if (f.type === 'select') return `<label class="field-label">${f.label}</label><select class="input" name="${f.name}">${f.options.map(o=>`<option ${o===val?'selected':''}>${escapeHtml(o)}</option>`).join('')}</select>`;
    return `<label class="field-label">${f.label}</label><input class="input" name="${f.name}" type="${f.type||'text'}" value="${escapeHtml(val)}" placeholder="${f.placeholder||''}" />`;
  }).join('');
  formHandler = onSave;
  $('#formDialog').showModal();
}

function addMap(existing) {
  openForm({title: existing?'編輯地圖 Edit Map':'新增地圖 Add Map',kicker:'地圖 / MAP',fields:[{name:'map',label:'地圖名稱 Map Name'},{name:'agent',label:'主要角色 Main Agent'}],values:existing||{},onSave:v=>{
    if(existing){ existing.map=v.map; existing.agent=v.agent; }
    else data.maps.push({id:crypto.randomUUID(),map:v.map,agent:v.agent,lineups:[]}); saveData();
  }});
}
function addTraining(existing) {
  openForm({title: existing?'編輯練槍項目 Edit Training':'新增練槍項目 Add Training',kicker:'練槍 / TRAINING',fields:[{name:'name',label:'名稱 Name'},{name:'desc',label:'說明 Description'}],values:existing||{},onSave:v=>{
    if(existing){ existing.name=v.name; existing.desc=v.desc; }
    else data.training.push({id:crypto.randomUUID(),name:v.name,desc:v.desc,done:false}); saveData();
  }});
}
function addNote(existing) {
  openForm({title: existing?'編輯筆記 Edit Note':'新增筆記 Add Note',kicker:'筆記 / NOTE',fields:[{name:'title',label:'標題 Title'},{name:'body',label:'筆記 Note',type:'textarea'}],values:existing||{},onSave:v=>{
    if(existing){ existing.title=v.title; existing.body=v.body; existing.updatedAt=new Date().toISOString(); }
    else data.notes.unshift({id:crypto.randomUUID(),title:v.title,body:v.body,updatedAt:new Date().toISOString()}); saveData();
  }});
}
function addLineup(map, existing) {
  openForm({title: existing?'編輯點位 Edit Lineup':'新增點位 Add Lineup',kicker:`${map.map} / ${map.agent}`,fields:[
    {name:'name',label:'點位名稱 Lineup Name'},{name:'side',label:'攻守方 Side',type:'select',options:['進攻 Attack','防守 Defense','皆可 Both']},{name:'skill',label:'技能 Skill'},{name:'status',label:'熟練狀態 Status',type:'select',options:['練習中','熟練','收藏']},{name:'note',label:'筆記 Note',type:'textarea'},{name:'url',label:'參考連結 Reference URL',type:'url'}
  ],values:existing||{},onSave:v=>{
    if(existing) Object.assign(existing,v); else map.lineups.push({id:crypto.randomUUID(),...v}); saveData(); renderLineups(map.id);
  }});
}

$('#dynamicForm').addEventListener('submit', e => {
  if (e.submitter?.value === 'cancel') return;
  e.preventDefault();
  const obj = Object.fromEntries(new FormData(e.currentTarget));
  if (formHandler) formHandler(obj);
  $('#formDialog').close();
});

$('#adminForm').addEventListener('submit', e => {
  if (e.submitter?.value === 'cancel') return;
  e.preventDefault();
  if ($('#adminPassword').value === 'valorant') {
    isAdmin = true; sessionStorage.setItem(AUTH_KEY,'1'); $('#adminDialog').close(); $('#adminPassword').value=''; renderAll();
  } else alert('密碼錯誤 Password incorrect.');
});

$('#adminToggle').addEventListener('click',()=>{
  if(isAdmin){isAdmin=false;sessionStorage.removeItem(AUTH_KEY);renderAll();}
  else $('#adminDialog').showModal();
});
$('#addMapBtn').addEventListener('click',()=>addMap());
$('#addMapBtn2').addEventListener('click',()=>addMap());
$('#addTrainingBtn').addEventListener('click',()=>addTraining());
$('#addNoteBtn').addEventListener('click',()=>addNote());

$('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)setView(b.dataset.view);});
document.body.addEventListener('click',e=>{
  const j=e.target.closest('[data-jump]'); if(j) setView(j.dataset.jump);
  const m=e.target.closest('[data-map]'); if(m){setView('maps');renderLineups(m.dataset.map);}
  const addL=e.target.closest('[data-add-lineup]'); if(addL){const map=data.maps.find(x=>x.id===addL.dataset.addLineup);addLineup(map);}
  const et=e.target.closest('[data-edit-training]'); if(et)addTraining(data.training.find(x=>x.id===et.dataset.editTraining));
  const dt=e.target.closest('[data-delete-training]'); if(dt&&confirm('確定要刪除這個練槍項目嗎？')){data.training=data.training.filter(x=>x.id!==dt.dataset.deleteTraining);saveData();}
  const em=e.target.closest('[data-edit-map]'); if(em)addMap(data.maps.find(x=>x.id===em.dataset.editMap));
  const dm=e.target.closest('[data-delete-map]'); if(dm&&confirm('確定要刪除這張地圖與裡面的所有點位嗎？')){data.maps=data.maps.filter(x=>x.id!==dm.dataset.deleteMap);selectedMapId=null;$('#lineupPanel').innerHTML='<div class="empty-state">選一張地圖查看 Lineup。</div>';saveData();}
  const en=e.target.closest('[data-edit-note]'); if(en)addNote(data.notes.find(x=>x.id===en.dataset.editNote));
  const dn=e.target.closest('[data-delete-note]'); if(dn&&confirm('確定要刪除這則筆記嗎？')){data.notes=data.notes.filter(x=>x.id!==dn.dataset.deleteNote);saveData();}
  const el=e.target.closest('[data-edit-lineup]'); if(el){const map=data.maps.find(x=>x.id===el.dataset.mapid);addLineup(map,map.lineups.find(x=>x.id===el.dataset.editLineup));}
  const dl=e.target.closest('[data-delete-lineup]'); if(dl&&confirm('確定要刪除這個點位嗎？')){const map=data.maps.find(x=>x.id===dl.dataset.mapid);map.lineups=map.lineups.filter(x=>x.id!==dl.dataset.deleteLineup);saveData();renderLineups(map.id);}
});
document.body.addEventListener('change',e=>{
  if(e.target.matches('[data-training-check]')){const item=data.training.find(x=>x.id===e.target.dataset.trainingCheck);item.done=e.target.checked;saveData();}
});

$('#exportBtn').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`valorant-hub-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);
});
$('#importInput').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;try{const imported=JSON.parse(await file.text());data=imported;saveData();alert('匯入完成 Import complete.');}catch{alert('檔案格式不正確 Invalid JSON file.');}e.target.value='';
});

renderAll();
