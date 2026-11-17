/* ─── ACCESS GATE ─── */
const GATE_HASH='73e2822498c988475f994d5cbc7348677198694cb01830ef3182527acd0f6d0e';
async function sha256Hex(str){
  const buf=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function checkGateCode(){
  const val=document.getElementById('gate-input').value;
  const hash=await sha256Hex(val);
  const err=document.getElementById('gate-error');
  if(hash===GATE_HASH){
    localStorage.setItem('fcab_gate_ok','1');
    document.getElementById('gate').style.display='none';
    document.getElementById('app').style.display='';
    err.classList.remove('on');
  }else{
    err.classList.add('on');
  }
}
document.getElementById('gate-input').addEventListener('keydown',function(e){
  if(e.key==='Enter')checkGateCode();
});
if(localStorage.getItem('fcab_gate_ok')==='1'){
  document.getElementById('gate').style.display='none';
  document.getElementById('app').style.display='';
}

const PG={home:'page-home',process:'page-process',omgevingsscore:'page-omgevingsscore',gebouwscore:'page-gebouwscore',hitte:'page-hitte',droogte:'page-droogte',wateroverlast:'page-wateroverlast',overstroming:'page-overstroming',hagelstorm:'page-hagelstorm',strategie:'page-strategie',maatregelen:'page-strategie',faq:'page-faq',archief:'page-archief',changelog:'page-changelog',overons:'page-overons'};
const THEME_KEYS=['hitte','droogte','wateroverlast','overstroming','hagelstorm'];
let cur='home';
/* De pagina als geheel scrolt niet meer - alleen .canvas heeft een eigen scrollbalk
   (zie de .canvas/.shell/.topbar CSS-toelichtingen), dus elke reset-naar-boven
   gebeurt voortaan op .canvas in plaats van op window. */
function scrollCanvasToTop(){
  const c=document.querySelector('.canvas');
  if(c) c.scrollTop=0;
}
function nav(k,el){
  if(!PG[k])return;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.getElementById(PG[k]).classList.add('on');
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('on'));
  if(el)el.classList.add('on');
  document.querySelectorAll(`[data-key="${k}"]`).forEach(n=>n.classList.add('on'));
  cur=k;scrollCanvasToTop();
  if(THEME_KEYS.includes(k)) tsub(k,'introductie');
  updateStickyHead();
  updateReadingGuide();
}

/* ── READING GUIDE ("Op deze pagina") - alleen op de FCAB-onderdeelpagina's,
   niet bij Veelgestelde vragen (uitklapbare vragen, geen doorlopende
   hoofdstukken) en niet bij de klimaatthema's of overige pagina's. Bouwt de
   lijst op basis van de h2's die direct in de actieve pagina staan. ── */
const READING_GUIDE_PAGES=['process','omgevingsscore','gebouwscore','strategie'];
function h2Label(h){
  const clone=h.cloneNode(true);
  const num=clone.querySelector('.h2-num');
  if(num) num.remove();
  return clone.textContent.trim();
}
function updateReadingGuide(){
  const guide=document.getElementById('reading-guide');
  const list=document.getElementById('rg-list');
  if(!guide||!list) return;
  const page=document.querySelector('.page.on');
  const heads=(READING_GUIDE_PAGES.includes(cur)&&page) ? Array.from(page.querySelectorAll(':scope > h2[id]')) : [];
  if(!heads.length){
    guide.classList.remove('show');
    list.innerHTML='';
    return;
  }
  list.innerHTML=heads.map(h=>`<a class="rg-item" data-target="${h.id}" href="#" onclick="scrollToSection(this,'${h.id}');return false;">${escapeHtml(h2Label(h))}</a>`).join('');
  guide.classList.add('show');
  updateReadingGuideActive();
}
function scrollToSection(el,id){
  document.querySelectorAll('.rg-item').forEach(i=>i.classList.remove('on'));
  if(el) el.classList.add('on');
  const target=document.getElementById(id);
  if(target) target.scrollIntoView({behavior:'smooth',block:'start'});
}
function updateReadingGuideActive(){
  const guide=document.getElementById('reading-guide');
  if(!guide||!guide.classList.contains('show')) return;
  const page=document.querySelector('.page.on');
  if(!page) return;
  const heads=Array.from(page.querySelectorAll(':scope > h2[id]'));
  if(!heads.length) return;
  let activeId=heads[0].id;
  for(const h of heads){
    if(h.getBoundingClientRect().top<=160) activeId=h.id;
    else break;
  }
  document.querySelectorAll('.rg-item').forEach(i=>{
    i.classList.toggle('on', i.dataset.target===activeId);
  });
}

/* ── Sticky theme-head: de kop is al vanaf de natuurlijke rustpositie exact
   gelijk aan zijn vastgeplakte positie (zie de .theme-head CSS-toelichting),
   dus er is niets te forceren - dit voegt alleen de .stuck-scheidingslijn toe
   zodra er daadwerkelijk inhoud onder de kop is weggescrolld. Omdat .canvas
   zelf niet meer beweegt in de viewport (alleen zijn inhoud scrollt), is
   getBoundingClientRect().top van de kop nu een constante waarde en dus
   ongeschikt om "vastgeplakt" te detecteren - in plaats daarvan kijken we
   naar canvas.scrollTop. ── */
function updateStickyHead(){
  const el=document.querySelector('.page.on .theme-head');
  const c=document.querySelector('.canvas');
  if(!el||!c)return;
  el.classList.toggle('stuck', c.scrollTop>0);
}
/* ── Sticky zoekbalk in de rail: zelfde principe, maar dan voor de rail
   zelf - alleen relevant als de rail-inhoud niet helemaal past en er dus
   binnen de rail gescrolld wordt. ── */
function updateStickySearch(){
  const el=document.querySelector('.sidebar-search');
  const r=document.querySelector('.rail');
  if(!el||!r)return;
  el.classList.toggle('stuck', r.scrollTop>0);
}
document.addEventListener('DOMContentLoaded', ()=>{
  const c=document.querySelector('.canvas');
  if(c){
    c.addEventListener('scroll', updateStickyHead, {passive:true});
    c.addEventListener('scroll', updateReadingGuideActive, {passive:true});
  }
  const r=document.querySelector('.rail');
  if(r) r.addEventListener('scroll', updateStickySearch, {passive:true});
});
window.addEventListener('resize', updateStickyHead);
window.addEventListener('resize', updateStickySearch);

function tsub(theme,key){
  const page=document.getElementById('page-'+theme);
  if(!page)return;
  page.querySelectorAll('.tsub').forEach(s=>s.classList.remove('on'));
  const target=document.getElementById('tsub-'+theme+'-'+key);
  if(target)target.classList.add('on');
  page.querySelectorAll('.ticon-btn').forEach(b=>{
    b.classList.toggle('on', b.getAttribute('data-key')===key);
  });
  scrollCanvasToTop();
  updateStickyHead();
}

function si2(t,v,ind){
  const pf=`ind-${t}-${v}-`;
  document.querySelectorAll(`[id^="${pf}"]`).forEach(e=>e.classList.remove('on'));
  const el=document.getElementById(`${pf}${ind}`);if(el)el.classList.add('on');
  document.querySelectorAll(`.pill[onclick*="si2('${t}','${v}',"]`).forEach(p=>{
    p.classList.toggle('on',p.getAttribute('onclick').includes(`'${ind}'`));
  });
}

function ot(btn,id){
  const parent=btn.closest('.page')||document;
  parent.querySelectorAll('.tb').forEach(b=>b.classList.remove('on'));
  parent.querySelectorAll('.tc2').forEach(c=>c.classList.remove('on'));
  btn.classList.add('on');
  const el=document.getElementById(id);if(el)el.classList.add('on');
}

/* ── RISK MATRICES ── */
/* ── INTERACTIEVE GEBOUWSCORE / KLIMAATRISICOSCORE-CALCULATOR ── */
/* Rekenlogica overgenomen uit het officiële FCAB-rekenmodel (QuickScan tool) */

function gval(id){const el=document.getElementById(id); if(!el)return undefined; return el.value===''?undefined:el.value;}
function gnum(id){const v=gval(id); return v===undefined?undefined:parseFloat(v);}
function normC(c){return (c||'').toLowerCase().replace('kwetsbaarheid','').trim();}
function ccls(cat){
  const m={'':'mcn','geen':'mcn','n.v.t.':'mcn','zeer laag':'mcvl','zeer lage':'mcvl','laag':'mcl','lage':'mcl','middel':'mcm','gemiddelde':'mcm','hoog':'mch','hoge':'mch','zeer hoog':'mcvh','zeer hoge':'mcvh'};
  return m[normC(cat)]||'mcn';
}
function badgeHtml(cat){
  if(!cat) return '<span class="calcbadge mcn">Kies</span>';
  return `<span class="calcbadge ${ccls(cat)}">${cat}</span>`;
}
function bandLookupC(bands,val){ for(const b of bands){ if(val>=b[0]&&val<=b[1]) return b[2]; } return null; }
function showCond(id,show){ const el=document.getElementById(id); if(el) el.classList.toggle('show',show); }

const MX_HITTESTRESS_C=[[-1000,20,'Zeer lage kwetsbaarheid'],[21,40,'Lage kwetsbaarheid'],[41,60,'Gemiddelde kwetsbaarheid'],[61,80,'Hoge kwetsbaarheid'],[81,100000,'Zeer hoge kwetsbaarheid']];
const MX_WATEROVERLAST_C={
  'zeer hoge': [[1,15,'Zeer lage kwetsbaarheid'],[16,30,'Lage kwetsbaarheid'],[31,45,'Gemiddelde kwetsbaarheid'],[46,100,'Zeer hoge kwetsbaarheid']],
  'hoge':      [[1,25,'Zeer lage kwetsbaarheid'],[26,40,'Lage kwetsbaarheid'],[41,60,'Gemiddelde kwetsbaarheid'],[61,85,'Hoge kwetsbaarheid'],[86,100,'Zeer hoge kwetsbaarheid']],
  'gemiddelde':[[1,30,'Zeer lage kwetsbaarheid'],[31,45,'Lage kwetsbaarheid'],[46,85,'Gemiddelde kwetsbaarheid'],[86,100,'Hoge kwetsbaarheid']],
  'lage':      [[1,40,'Zeer lage kwetsbaarheid'],[41,85,'Lage kwetsbaarheid'],[86,100,'Gemiddelde kwetsbaarheid']],
  'zeer lage': [[1,85,'Zeer lage kwetsbaarheid'],[86,100,'Lage kwetsbaarheid']],
};
const MX_HOUTEN_ROWS_C=['LC','LP','LS','MC','MP','MS','HC','HP','HS'];
const MX_HOUTEN_C={
  LC:['Zeer lage','Zeer lage','Zeer lage','Zeer lage','Zeer lage','Zeer lage','Zeer lage'],
  LP:['Zeer lage','Zeer lage','Zeer lage','Zeer lage','Zeer lage','Zeer lage','Zeer lage'],
  LS:['Zeer lage','Zeer lage','Zeer lage','Zeer lage','Zeer lage','Zeer lage','Zeer lage'],
  MC:['Gemiddelde','Gemiddelde','Lage','Lage','Lage','Lage','Zeer lage'],
  MP:['Hoge','Hoge','Gemiddelde','Gemiddelde','Lage','Lage','Lage'],
  MS:['Zeer hoge','Zeer hoge','Hoge','Hoge','Gemiddelde','Gemiddelde','Lage'],
  HC:['Hoge','Hoge','Gemiddelde','Gemiddelde','Lage','Lage','Lage'],
  HP:['Zeer hoge','Zeer hoge','Hoge','Gemiddelde','Gemiddelde','Gemiddelde','Lage'],
  HS:['Zeer hoge','Zeer hoge','Zeer hoge','Zeer hoge','Hoge','Gemiddelde','Gemiddelde'],
};
const MX_STAAL_BS_C={
  '0':{'souterrain':50,'gedeeltelijk':100,'geen':75},
  '1':{'souterrain':25,'gedeeltelijk':75,'geen':50},
  '2':{'souterrain':0,'gedeeltelijk':50,'geen':25},
};
const MX_STAAL_FINAL_C={
  0:['Zeer lage','Zeer lage','Zeer lage','Zeer lage','Zeer lage'],
  1:['Zeer lage','Zeer lage','Zeer lage','Lage','Lage'],
  2:['Zeer lage','Lage','Lage','Gemiddelde','Gemiddelde'],
  3:['Lage','Gemiddelde','Gemiddelde','Hoge','Hoge'],
  4:['Gemiddelde','Hoge','Hoge','Zeer hoge','Zeer hoge'],
  5:['Hoge','Hoge','Zeer hoge','Zeer hoge','Zeer hoge'],
};
const STAAL_COLS_C=[0,25,50,75,100];

/* ---- INTERACTIEVE GEBOUWSCORE-TABELLEN (klik = kies antwoord) ---- */
const gebState = {};

const GEB_OPT = {
  geb_water_ingang: [
    {l:'\u2264 0 cm', s:40},
    {l:'1-15 cm', s:28},
    {l:'Waterkering (schot) aanwezig', s:10},
    {l:'> 15 cm', s:4},
  ],
  geb_water_kelder: [
    {l:'Drempel \u2264 0 cm', s:15},
    {l:'Drempel 1-15 cm', s:10.5},
    {l:'> 15 cm / waterrooster / waterkering', s:6},
    {l:'Geen parkeerkelder', s:0},
  ],
  geb_water_instroom: [
    {l:'Aanwezig \u2264 15 cm boven maaiveld', s:20},
    {l:'Waterkering bij instroompunt', s:8},
    {l:'Niet aanwezig', s:0},
  ],
  geb_water_riool: [
    {l:'Niet aanwezig + gemengd riool', s:5},
    {l:'Aanwezig / gescheiden riool / bouwjaar > 1980', s:0},
  ],
  geb_water_apparatuur: [
    {l:'Onder straatniveau, niet verhoogd', s:20},
    {l:'Op BG, hoogte ingang = 0 cm', s:14},
    {l:'Niet aanwezig op BG / onder straatniveau', s:0},
  ],
  geb_hitte_glas: [
    {l:'> 75%', s:30}, {l:'50-75%', s:21}, {l:'35-50%', s:12}, {l:'< 35%', s:1.5},
  ],
  geb_hitte_massa: [
    {l:'Massaconstructie < 250 kg/m\u00b2 (HSB/SFB-vloeren)', s:10},
    {l:'250-500 kg/m\u00b2 (HSB/SFB + staalbeton)', s:7},
    {l:'500-750 kg/m\u00b2 (kolom-ligger/metselwerk)', s:4},
    {l:'> 750 kg/m\u00b2 (wand-vloer/metselwerk massief)', s:1},
  ],
  geb_hitte_zonwering: [
    {l:'Afwezig', s:20}, {l:'Aanwezig', s:1},
  ],
  geb_hitte_zontoetreding: [
    {l:'g \u2265 0,75 / enkel glas', s:15},
    {l:'g 0,60-0,75 / dubbel glas', s:10.5},
    {l:'g 0,40-0,60 / HR+, HR++, triple', s:6},
    {l:'g \u2264 0,4 / zonwerende folie', s:1.5},
  ],
  geb_hitte_dak: [
    {l:'Donker', s:2.5}, {l:'Zonnepanelen / licht', s:1}, {l:'Groendak / wit', s:0.25},
  ],
  geb_hitte_gevel: [
    {l:'Donker', s:2.5}, {l:'Licht / groen (vegetatie)', s:1},
  ],
  geb_hitte_overstek: [
    {l:'Afwezig / < 0,6 m', s:20}, {l:'\u2265 0,6 m', s:8}, {l:'\u2265 1,2 m', s:1},
  ],
  geb_hitte_koeling: [
    {l:'Niet-condenserend (woning)', s:-15},
    {l:'Condenserend / airco (woning)', s:-30},
    {l:'Niet-condenserend (utiliteit, >50%)', s:-20},
    {l:'Condenserend / airco (utiliteit, >50%)', s:-40},
    {l:'Geen koeling', s:0},
  ],
  geb_hitte_isolatie: [
    {l:'Rc < 1,3 of bouwjaar < 1976', s:-7},
    {l:'Rc < 2,5 of bouwjaar 1976-1992', s:-5},
    {l:'Rc < 3,5 of bouwjaar 1993-2013', s:-3},
    {l:'Rc > 3,5 of bouwjaar > 2013', s:-1},
  ],
  geb_hitte_ramen: [
    {l:'2 of meer gevels', sLow:-20, sHigh:-15},
    {l:'1 gevel', sLow:-10, sHigh:-5},
    {l:'Geen ramen die open kunnen', sLow:0, sHigh:0},
  ],
  geb_overstr_ingang: [
    {l:'< 50 cm', s:40}, {l:'\u2265 50 cm of afsluitmiddel > 50 cm', s:4},
  ],
  geb_overstr_kelder: [
    {l:'Aanwezig, drempel < 50 cm', s:15},
    {l:'\u2265 50 cm of afsluitmiddel > 50 cm', s:6},
    {l:'Geen parkeerkelder', s:0},
  ],
  geb_overstr_instroom: [
    {l:'Aanwezig \u2264 50 cm boven maaiveld', s:20},
    {l:'Afsluitmiddel aanwezig bij instroompunt', s:8},
    {l:'Niet aanwezig', s:0},
  ],
  geb_overstr_riool: [
    {l:'Niet aanwezig + gemengd riool', s:5},
    {l:'Aanwezig of gescheiden riool', s:0},
  ],
  geb_overstr_apparatuur: [
    {l:'Onder straatniveau, niet verhoogd', s:20},
    {l:'Op BG, hoogte ingang = 50 cm', s:14},
    {l:'Niet aanwezig / op poten > 50 cm', s:0},
  ],
};

const GEB_QGROUPS = {
  'qtable-geb-water': [
    {qid:'geb_water_ingang', label:'Hoogte ingang t.o.v. maaiveld'},
    {qid:'geb_water_kelder', label:'Parkeerkelder of andere ondergrondse ruimte'},
    {qid:'geb_water_instroom', label:'Overige instroompunten (kelderraam)'},
    {qid:'geb_water_riool', label:'Ontlastput / terugslagklep'},
    {qid:'geb_water_apparatuur', label:'Vaste apparatuur en installaties'},
  ],
  'qtable-geb-hitte-opwarm': [
    {qid:'geb_hitte_glas', label:'Glasoppervlakte (West/Zuid/Oost)'},
    {qid:'geb_hitte_massa', label:'Thermische massa'},
    {qid:'geb_hitte_zonwering', label:'Buitenzonwering'},
    {qid:'geb_hitte_zontoetreding', label:'Zon-toetredingsfactor (g-waarde)'},
    {qid:'geb_hitte_dak', label:'Kleur dak'},
    {qid:'geb_hitte_gevel', label:'Kleur gevel'},
    {qid:'geb_hitte_overstek', label:'Overstek boven raam'},
  ],
  'qtable-geb-hitte-afkoel': [
    {qid:'geb_hitte_koeling', label:'Koeling'},
    {qid:'geb_hitte_isolatie', label:'Isolatie (Rc-waarde / bouwjaar)'},
    {qid:'geb_hitte_ramen', label:'Spuiventilatie (ramen die open kunnen)'},
  ],
  'qtable-geb-overstr': [
    {qid:'geb_overstr_ingang', label:'Hoogte ingang t.o.v. maaiveld'},
    {qid:'geb_overstr_kelder', label:'Parkeerkelder of andere ondergrondse ruimte'},
    {qid:'geb_overstr_instroom', label:'Overige instroompunten (kelderraam, open stootvoegen)'},
    {qid:'geb_overstr_riool', label:'Terugslagklep'},
    {qid:'geb_overstr_apparatuur', label:'Vaste apparatuur en installaties'},
  ],
};

function formatPts(n){
  const s=(Math.round(n*10)/10).toString().replace('.', ',');
  return (n>0?'+':'')+s;
}
function gebPtsCellHtml(o){
  if(o.s!==undefined) return formatPts(o.s);
  if(o.sLow!==undefined) return `<span title="Bij lage/zeer lage omgevingsscore">${formatPts(o.sLow)}</span> / <span title="Bij gemiddelde/hoge omgevingsscore">${formatPts(o.sHigh)}</span>`;
  return '-';
}
function gebResolvedPoints(qid, idx, envCat){
  if(idx===undefined) return null;
  const o=GEB_OPT[qid][idx];
  if(o.s!==undefined) return o.s;
  if(o.sLow!==undefined){
    if(!envCat) return o.sLow;
    const useHigh=(envCat==='Gemiddelde'||envCat==='Hoge');
    return useHigh ? o.sHigh : o.sLow;
  }
  return null;
}
function buildGebQTable(containerId, questions){
  let rows='';
  questions.forEach((q,qi)=>{
    const opts=GEB_OPT[q.qid];
    opts.forEach((o,i)=>{
      const cls=['qt-row'];
      if(i===0 && qi>0) cls.push('qt-block-start');
      rows+=`<tr class="${cls.join(' ')}" data-qid="${q.qid}" data-idx="${i}" onclick="gebChoose('${q.qid}',${i})">`;
      if(i===0) rows+=`<td class="qt-q" rowspan="${opts.length}">${q.label}</td>`;
      rows+=`<td class="qt-opt">${o.l}</td><td class="qt-pts">${gebPtsCellHtml(o)}</td></tr>`;
    });
  });
  rows+=`<tr class="qt-total-row"><td class="qt-total-label" colspan="2">Totaal punten</td><td class="qt-total-val" id="total-${containerId}">0</td></tr>`;
  return `<div class="qtable-wrap"><table class="qtable"><thead><tr><th style="width:36%;">Vraag</th><th>Antwoord</th><th style="text-align:right;width:90px;">Punten</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function renderGebQTables(){
  for(const [id,qs] of Object.entries(GEB_QGROUPS)){
    const el=document.getElementById(id);
    if(el) el.innerHTML=buildGebQTable(id,qs);
  }
  updateGebQTotals();
}
function updateGebQTotals(){
  const envHitte=gval('c-hitte-omgeving');
  for(const [id,qs] of Object.entries(GEB_QGROUPS)){
    const totalEl=document.getElementById(`total-${id}`);
    if(!totalEl) continue;
    let sum=0;
    qs.forEach(q=>{
      const pts=gebResolvedPoints(q.qid, gebState[q.qid], envHitte);
      if(pts!==null) sum+=pts;
    });
    totalEl.textContent=formatPts(sum);
  }
}
function gebChoose(qid, idx){
  const was=gebState[qid]===idx;
  if(was) delete gebState[qid]; else gebState[qid]=idx;
  document.querySelectorAll(`.qt-row[data-qid="${qid}"]`).forEach(el=>{
    el.classList.toggle('on', !was && Number(el.getAttribute('data-idx'))===idx);
  });
  updateGebQTotals();
  if(qid.indexOf('geb_water_')===0) calcWater();
  else if(qid.indexOf('geb_hitte_')===0) calcHitte();
  else if(qid.indexOf('geb_overstr_')===0) calcOverstr();
}

/* ---- HITTE ---- */
function calcHitte(){
  updateGebQTotals();
  const omg=gval('c-hitte-omgeving');
  const gsEl=document.getElementById('c-hitte-gs'), outEl=document.getElementById('c-hitte-out'), msgEl=document.getElementById('c-hitte-msg');
  const idsOpwarm=['geb_hitte_glas','geb_hitte_massa','geb_hitte_zonwering','geb_hitte_zontoetreding','geb_hitte_dak','geb_hitte_gevel','geb_hitte_overstek'];
  const idsAfkoel=['geb_hitte_koeling','geb_hitte_isolatie'];
  let total=0, allA=true;
  idsOpwarm.concat(idsAfkoel).forEach(qid=>{
    const pts=gebResolvedPoints(qid, gebState[qid]);
    if(pts===null) allA=false; else total+=pts;
  });
  const ramenIdx=gebState['geb_hitte_ramen'];
  if(omg===undefined || ramenIdx===undefined || omg==='n.v.t.'){ allA=false; }
  else total+=gebResolvedPoints('geb_hitte_ramen', ramenIdx, omg);
  if(!allA){ gsEl.textContent='-'; outEl.innerHTML=badgeHtml(null); msgEl.textContent = omg==='n.v.t.' ? 'Bij "niet van toepassing" kan geen klimaatrisicoscore worden berekend.' : 'Vul de gebouwvragen in de tabellen hierboven in en kies de omgevingsscore.'; return; }
  total=Math.ceil(total);
  gsEl.textContent=total;
  outEl.innerHTML=badgeHtml(bandLookupC(MX_HITTESTRESS_C,total));
  msgEl.textContent='';
}

/* ---- WATEROVERLAST ---- */
function calcWater(){
  updateGebQTotals();
  const omg=gval('c-water-omgeving');
  const ids=['geb_water_ingang','geb_water_kelder','geb_water_instroom','geb_water_riool','geb_water_apparatuur'];
  let total=0, allA=true;
  ids.forEach(qid=>{
    const pts=gebResolvedPoints(qid, gebState[qid]);
    if(pts===null) allA=false; else total+=pts;
  });
  const gsEl=document.getElementById('c-water-gs'), outEl=document.getElementById('c-water-out'), msgEl=document.getElementById('c-water-msg');
  if(omg===undefined || !allA){ gsEl.textContent='-'; outEl.innerHTML=badgeHtml(null); msgEl.textContent='Vul de gebouwvragen in de tabel hierboven in en kies de omgevingsscore om de klimaatrisicoscore te berekenen.'; return; }
  const score=Math.max(1,Math.min(100,Math.round(total)));
  gsEl.textContent=score;
  const bands=MX_WATEROVERLAST_C[normC(omg)];
  outEl.innerHTML=badgeHtml(bands?bandLookupC(bands,score):null);
  msgEl.textContent='';
}

/* ---- OVERSTROMING ---- */
function calcOverstr(){
  updateGebQTotals();
  const k20=gval('c-overstr-k20');
  const gsEl=document.getElementById('c-overstr-gs'), outEl=document.getElementById('c-overstr-out'), msgEl=document.getElementById('c-overstr-msg');
  if(k20===undefined){
    showCond('c-overstr-blk50',false); showCond('c-overstr-blkgeb',false);
    gsEl.textContent='-'; outEl.innerHTML=badgeHtml(null); msgEl.textContent='Kies eerst de plaatsgebonden overstromingskans (> 20 cm).';
    return;
  }
  if(k20==='zeerlaag'||k20==='laag'){
    showCond('c-overstr-blk50',false); showCond('c-overstr-blkgeb',false);
    gsEl.textContent='n.v.t.'; outEl.innerHTML=badgeHtml('Lage kwetsbaarheid'); msgEl.textContent='';
    return;
  }
  showCond('c-overstr-blk50',true);
  const k50=gval('c-overstr-k50');
  if(k50===undefined){
    showCond('c-overstr-blkgeb',false);
    gsEl.textContent='-'; outEl.innerHTML=badgeHtml(null); msgEl.textContent='Kies ook de overstromingskans bij > 50 cm.';
    return;
  }
  if(k50==='hoog'){
    showCond('c-overstr-blkgeb',false);
    gsEl.textContent='n.v.t.'; outEl.innerHTML=badgeHtml('Hoge kwetsbaarheid'); msgEl.textContent='';
    return;
  }
  showCond('c-overstr-blkgeb',true);
  updateGebQTotals();
  const ids=['geb_overstr_ingang','geb_overstr_kelder','geb_overstr_instroom','geb_overstr_riool','geb_overstr_apparatuur'];
  let total=0, allA=true;
  ids.forEach(qid=>{
    const pts=gebResolvedPoints(qid, gebState[qid]);
    if(pts===null) allA=false; else total+=pts;
  });
  if(!allA){ gsEl.textContent='-'; outEl.innerHTML=badgeHtml(null); msgEl.textContent='Vul de gebouwvragen in de tabel hierboven in.'; return; }
  gsEl.textContent=total;
  let cat;
  if(total<30) cat='Lage kwetsbaarheid'; else if(total<=60) cat='Gemiddelde kwetsbaarheid'; else cat='Hoge kwetsbaarheid';
  outEl.innerHTML=badgeHtml(cat); msgEl.textContent='';
}

/* ---- DROOGTE ---- */
function calcDroogte(){
  const type=gval('c-droogte-type');
  const gsEl=document.getElementById('c-droogte-gs'), outEl=document.getElementById('c-droogte-out'), msgEl=document.getElementById('c-droogte-msg');
  showCond('c-droogte-hout', type==='hout');
  showCond('c-droogte-staal', type==='staal');
  if(type===undefined){ gsEl.textContent='-'; outEl.innerHTML=badgeHtml(null); msgEl.textContent='Kies eerst het funderingstype.'; return; }
  if(type==='beton'){ gsEl.textContent='n.v.t.'; outEl.innerHTML=badgeHtml('Geen kwetsbaarheid'); msgEl.textContent=''; return; }
  if(type==='onbekend'){ gsEl.textContent='n.v.t.'; outEl.innerHTML=badgeHtml(null); msgEl.textContent='Funderingstype onbekend: eerst funderingsonderzoek nodig (indicatie ca. € 5.000) voordat een risicoscore kan worden berekend.'; return; }
  if(type==='hout'){
    const bj=gval('c-droogte-bj-h'), env=gval('c-droogte-env-h');
    if(bj===undefined||env===undefined){ gsEl.textContent='-'; outEl.innerHTML=badgeHtml(null); msgEl.textContent='Vul bouwjaar en omgevingsscore in.'; return; }
    const row=MX_HOUTEN_ROWS_C[Number(env)];
    const cat=MX_HOUTEN_C[row][Number(bj)]+' kwetsbaarheid';
    gsEl.textContent='bouwjaar-gebaseerd'; outEl.innerHTML=badgeHtml(cat); msgEl.textContent='';
    return;
  }
  if(type==='staal'){
    const bj=gval('c-droogte-bj-s'), keld=gval('c-droogte-kelder-s'), env=gval('c-droogte-env-s');
    if(bj===undefined||keld===undefined||env===undefined){ gsEl.textContent='-'; outEl.innerHTML=badgeHtml(null); msgEl.textContent='Vul bouwjaar, kelder en omgevingsscore in.'; return; }
    const bs=MX_STAAL_BS_C[bj][keld];
    const colIdx=STAAL_COLS_C.indexOf(bs);
    const cat=MX_STAAL_FINAL_C[Number(env)][colIdx]+' kwetsbaarheid';
    gsEl.textContent=bs; outEl.innerHTML=badgeHtml(cat); msgEl.textContent='';
    return;
  }
}

const OM5=['Zeer hoog','Hoog','Middel','Laag','Zeer laag'];
const GB4=['Laag','Middel','Hoog','Zeer hoog'];
const MXG=[['mch','mcvh','mcvh','mcvh'],['mcm','mch','mcvh','mcvh'],['mcl','mcm','mch','mch'],['mcvl','mcl','mcm','mch'],['mcn','mcvl','mcl','mcm']];
const LBG=[['Hoog','Zeer hoog','Zeer hoog','Zeer hoog'],['Middel','Hoog','Zeer hoog','Zeer hoog'],['Laag','Middel','Hoog','Hoog'],['Geen','Laag','Middel','Hoog'],['Geen','Geen','Laag','Middel']];

/* categorie-string → css-kleurklasse / korte label */
function catCls(s){
  s=(s||'').toLowerCase();
  if(s.includes('zeer hoog')||s.includes('zeer hoge')) return 'mcvh';
  if(s.includes('hoog')||s.includes('hoge')) return 'mch';
  if(s.includes('gemiddeld')||s.includes('middel')) return 'mcm';
  if(s.includes('zeer laag')||s.includes('zeer lage')) return 'mcvl';
  if(s.includes('laag')||s.includes('lage')) return 'mcl';
  return 'mcn';
}
function catShortLbl(s){
  const k=(s||'').toLowerCase().replace('kwetsbaarheid','').trim();
  const map={'geen':'Geen','zeer lage':'Zeer laag','lage':'Laag','gemiddelde':'Middel','hoge':'Hoog','zeer hoge':'Zeer hoog'};
  return map[k]||s;
}

function buildMx(id,data,labels,omL,gbL){
  const c=document.getElementById(id);if(!c)return;
  const cols=gbL.length;
  let h=`<div style="overflow-x:auto;"><div style="display:flex;gap:8px;align-items:flex-start;">
    <div style="display:flex;align-items:center;padding-top:50px;"><div class="myl">Omgevingsscore →</div></div>
    <div>
      <div style="display:flex;gap:6px;">
        <div style="width:76px;flex-shrink:0;"></div>
        <div class="mx-colheads" style="grid-template-columns:repeat(${cols},76px);">`;
  gbL.forEach(g=>{h+=`<div class="mlc">${g}</div>`;});
  h+=`</div>
      </div>
      <div style="display:flex;gap:6px;">
        <div class="mx-rowlabels" style="width:76px;flex-shrink:0;">`;
  omL.forEach(om=>{h+=`<div class="mlc">${om}</div>`;});
  h+=`</div>
        <div class="mx-grid" style="grid-template-columns:repeat(${cols},76px);">`;
  omL.forEach((om,ri)=>{
    data[ri].forEach((cls,ci)=>{h+=`<div class="mcell ${cls}">${labels[ri][ci]}</div>`;});
  });
  h+=`</div>
      </div>
      <div style="text-align:center;font-size:10px;color:var(--text3);font-weight:500;margin-top:6px;">Gebouwscore →</div>
    </div>
  </div></div>`;
  c.innerHTML=h;
}

/* ── Hitte: klimaatrisicoscore hangt alleen af van de gebouwscore-totaalpunten ── */
function buildHitteMx(id){
  const c=document.getElementById(id);if(!c)return;
  const rangeLbl=['≤ 20 pt','21-40 pt','41-60 pt','61-80 pt','> 80 pt'];
  let h=`<div style="overflow-x:auto;"><div class="mx-grid" style="grid-template-columns:repeat(${MX_HITTESTRESS_C.length},94px);max-width:600px;">`;
  MX_HITTESTRESS_C.forEach((b,i)=>{
    const cat=b[2].replace(' kwetsbaarheid','');
    h+=`<div class="mcell ${catCls(cat)}" style="height:56px;flex-direction:column;gap:3px;"><div>${cat}</div><div style="font-size:9px;font-weight:500;">${rangeLbl[i]}</div></div>`;
  });
  h+=`</div><div style="text-align:center;font-size:10px;color:var(--text3);font-weight:500;margin-top:6px;max-width:600px;">Gebouwscore (totaalpunten) →</div></div>`;
  c.innerHTML=h;
}

/* ── Wateroverlast: klimaatrisicoscore hangt af van gebouwscore (0-100) én omgevingsscore ── */
function buildWaterMx(id){
  const c=document.getElementById(id);if(!c)return;
  const rows=[['Zeer hoog','zeer hoge'],['Hoog','hoge'],['Middel','gemiddelde'],['Laag','lage'],['Zeer laag','zeer lage']];
  const stripW=500;
  let h=`<div style="overflow-x:auto;"><div style="display:flex;gap:8px;align-items:flex-start;">
    <div style="display:flex;align-items:center;padding-top:34px;"><div class="myl">Omgevingsscore →</div></div>
    <div>
      <div style="display:flex;">
        <div class="mx-rowlabels" style="width:76px;flex-shrink:0;">`;
  rows.forEach(([lbl])=>{h+=`<div class="mlc">${lbl}</div>`;});
  h+=`</div>
        <div style="display:flex;flex-direction:column;gap:2px;width:${stripW}px;border-radius:10px;overflow:hidden;margin-left:6px;">`;
  rows.forEach(([lbl,key])=>{
    const bands=MX_WATEROVERLAST_C[key];
    h+=`<div style="display:flex;gap:2px;height:46px;">`;
    bands.forEach(([lo,hi,cat])=>{
      const span=hi-lo+1;
      h+=`<div class="mcell ${catCls(cat)}" style="flex:${span} 1 0;width:0;font-size:9px;padding:0 2px;">${catShortLbl(cat)}</div>`;
    });
    h+=`</div>`;
  });
  h+=`</div>
      </div>
      <div style="text-align:center;font-size:10px;color:var(--text3);font-weight:500;margin-top:6px;margin-left:82px;width:${stripW}px;">Gebouwscore (0-100 pt) →</div>
    </div>
  </div></div>`;
  c.innerHTML=h;
}

/* ── Overstroming: omgevingsscore bepaalt eerst óf de gebouwscore meetelt ── */
function buildOverstrMx(id){
  const c=document.getElementById(id);if(!c)return;
  let h=`<div style="display:flex;flex-direction:column;gap:14px;max-width:600px;">
    <div>
      <div style="font-size:11.5px;color:var(--text3);margin-bottom:6px;">Overstromingskans (&gt; 20 cm) is <strong>klein</strong> of <strong>zeer klein</strong> → gebouwscore telt niet mee</div>
      <div class="mcell mcl" style="border-radius:10px;height:44px;">Lage kwetsbaarheid</div>
    </div>
    <div>
      <div style="font-size:11.5px;color:var(--text3);margin-bottom:6px;">Overstromingskans (&gt; 20 cm) is <strong>middelgroot</strong> of <strong>groot</strong>, én de kans bij &gt; 50 cm is <strong>gelijk</strong> aan die bij &gt; 20 cm → gebouwscore telt niet mee</div>
      <div class="mcell mch" style="border-radius:10px;height:44px;">Hoge kwetsbaarheid</div>
    </div>
    <div>
      <div style="font-size:11.5px;color:var(--text3);margin-bottom:6px;">Overstromingskans (&gt; 20 cm) is <strong>middelgroot</strong> of <strong>groot</strong>, én de kans bij &gt; 50 cm is <strong>lager</strong> dan die bij &gt; 20 cm → gebouwscore bepaalt:</div>
      <div style="display:flex;gap:2px;border-radius:10px;overflow:hidden;">
        <div class="mcell mcl" style="flex:30 1 0;width:0;height:44px;flex-direction:column;gap:2px;"><div>Laag</div><div style="font-size:9px;">0-29 pt</div></div>
        <div class="mcell mcm" style="flex:31 1 0;width:0;height:44px;flex-direction:column;gap:2px;"><div>Middel</div><div style="font-size:9px;">30-60 pt</div></div>
        <div class="mcell mch" style="flex:40 1 0;width:0;height:44px;flex-direction:column;gap:2px;"><div>Hoog</div><div style="font-size:9px;">&gt; 60 pt</div></div>
      </div>
    </div>
  </div>`;
  c.innerHTML=h;
}

/* ── Droogte: generieke lookup-matrix (hout: Tabel 12, staal: eindtabel) ── */
function buildLookupMx(id,rowLabels,colLabels,dataCats,opts){
  const c=document.getElementById(id);if(!c)return;
  opts=opts||{};
  const cellW=opts.cellW||70, rowLabelW=opts.rowLabelW||110, cellH=opts.cellH||40;
  let h=`<div style="overflow-x:auto;"><div style="display:flex;gap:8px;align-items:flex-start;">`;
  if(opts.rowAxis) h+=`<div style="display:flex;align-items:center;padding-top:${cellH+14}px;"><div class="myl">${opts.rowAxis} →</div></div>`;
  h+=`<div>
    <div style="display:flex;">
      <div style="width:${rowLabelW}px;flex-shrink:0;"></div>
      <div class="mx-colheads" style="grid-template-columns:repeat(${colLabels.length},${cellW}px);">`;
  colLabels.forEach(g=>{h+=`<div class="mlc" style="width:${cellW}px;height:auto;padding-bottom:4px;font-size:9px;">${g}</div>`;});
  h+=`</div>
    </div>
    <div style="display:flex;">
      <div class="mx-rowlabels" style="width:${rowLabelW}px;flex-shrink:0;">`;
  rowLabels.forEach(r=>{h+=`<div class="mlc" style="width:${rowLabelW}px;height:${cellH}px;font-size:9px;justify-content:flex-end;text-align:right;padding-right:6px;">${r}</div>`;});
  h+=`</div>
      <div class="mx-grid" style="grid-template-columns:repeat(${colLabels.length},${cellW}px);">`;
  dataCats.forEach(row=>{
    row.forEach(cat=>{h+=`<div class="mcell ${catCls(cat)}" style="height:${cellH}px;font-size:9px;">${catShortLbl(cat)}</div>`;});
  });
  h+=`</div>
    </div>`;
  if(opts.colAxis) h+=`<div style="text-align:center;font-size:10px;color:var(--text3);font-weight:500;margin-top:6px;">${opts.colAxis} →</div>`;
  h+=`</div></div></div>`;
  c.innerHTML=h;
}

/* ── Adaptatiestrategie per klimaatthema: filtert de FCAB-3 Maatregelentabel (Bijlage 1) ── */
const THEME_MEASURE_TAGS={
  hitte:['Hitte'],
  droogte:['Droogte','Bodemdaling'],
  wateroverlast:['Wateroverlast'],
  overstroming:['Overstroming'],
  hagelstorm:['Storm'],
};
function renderThemeAdaptMeasures(){
  const allRows=Array.from(document.querySelectorAll('#page-strategie .mrow'));
  for(const [theme,tags] of Object.entries(THEME_MEASURE_TAGS)){
    const target=document.getElementById(`adapt-measures-${theme}`);
    if(!target) continue;
    const matches=allRows.filter(row=>{
      const themeEl=row.querySelector('.mrow-theme');
      if(!themeEl) return false;
      const t=themeEl.textContent.trim();
      return tags.includes(t) || t==="Alle klimaatthema's" || t==="Meerdere thema's";
    });
    target.innerHTML='';
    matches.forEach(row=>target.appendChild(row.cloneNode(true)));
    if(!matches.length) target.innerHTML='<p style="color:var(--text3);font-size:13px;">Nog geen maatregelen gekoppeld aan dit thema.</p>';
  }
}

/* Maakt elke .mrow (maatregel) uitklapbaar: kop blijft zichtbaar, meta/body verschijnen pas na klikken */
function initMeasureRows(){
  document.querySelectorAll('.mrow').forEach(row=>{
    const head=row.querySelector('.mrow-head');
    if(head && !head.querySelector('.mrow-chev')){
      const chev=document.createElement('span');
      chev.className='mrow-chev';
      chev.textContent='›';
      head.appendChild(chev);
    }
    if(!row.dataset.mrowInit){
      row.dataset.mrowInit='1';
      row.addEventListener('click',()=>row.classList.toggle('on'));
    }
  });
}

window.addEventListener('DOMContentLoaded',()=>{
  renderGebQTables();
  renderThemeAdaptMeasures();
  initMeasureRows();
  buildMx('mx-generic',MXG,LBG,OM5,GB4);
  buildHitteMx('mx-hitte');
  buildLookupMx('mx-droogte-hout',
    ['Laag / klei','Laag / veen','Laag / zand','Middel / klei','Middel / veen','Middel / zand','Hoog / klei','Hoog / veen','Hoog / zand'],
    ['< 1830','1830-1880','1880-1900','1900-1930','1930-1950','1950-1975','> 1975'],
    MX_HOUTEN_ROWS_C.map(k=>MX_HOUTEN_C[k]),
    {cellW:62,rowLabelW:104,cellH:36,rowAxis:'Omgevingsscore (bodemtype)',colAxis:'Bouwjaar'}
  );
  buildLookupMx('mx-droogte-staal',
    ['0','1','2','3','4','5'],
    ['0','25','50','75','100'],
    [0,1,2,3,4,5].map(i=>MX_STAAL_FINAL_C[i]),
    {cellW:64,rowLabelW:96,cellH:36,rowAxis:'Omgevingsscore',colAxis:'Gebouwscore'}
  );
  buildWaterMx('mx-wateroverlast');
  buildOverstrMx('mx-overstroming');
  buildSearchIndex();

  /* Plain content tables krijgen een afgeronde, omkaderde wrapper (zoals qtable-wrap) */
  document.querySelectorAll('.canvas table').forEach(t=>{
    if(t.closest('.qtable-wrap'))return;
    const wrap=document.createElement('div');
    wrap.className='table-wrap';
    t.parentNode.insertBefore(wrap,t);
    wrap.appendChild(t);
  });

  /* Cmd/Ctrl+K focust de zoekbalk, net als in de Claude-docs */
  document.addEventListener('keydown',(e)=>{
    if((e.metaKey||e.ctrlKey) && (e.key==='k'||e.key==='K')){
      e.preventDefault();
      const input=document.getElementById('site-search');
      if(input)input.focus();
    }
  });

  updateStickyHead();

  /* Na een taalwissel terug naar het Nederlands (zie revertToOriginalLanguage) wordt de
     pagina herladen; hier komen we weer uit op de sectie waar de gebruiker was. */
  try{
    var restorePage = sessionStorage.getItem('fcab-restore-page');
    if(restorePage){
      sessionStorage.removeItem('fcab-restore-page');
      if(PG[restorePage]) nav(restorePage, document.querySelector('[data-key="'+restorePage+'"]'));
    }
  }catch(e){}
});

/* ── VOLLEDIGE-TEKST ZOEKINDEX ── */
let SEARCH_IDX = [];
function buildSearchIndex(){
  SEARCH_IDX = [];
  const selector = 'h1,h2,h3,h4,p,li,td,th,.srn,.srm,.aot,.ib,.wb,.nb,.calclabel,.calchint,.mcell,.crl,.aosr,.qhint';
  document.querySelectorAll('.page').forEach(page=>{
    const pageKey = page.id.replace('page-','');
    const h1 = page.querySelector('h1');
    const pageTitle = h1 ? h1.textContent.trim() : pageKey;
    page.querySelectorAll(selector).forEach(el=>{
      const text = el.textContent.replace(/\s+/g,' ').trim();
      if(text.length < 3) return;
      SEARCH_IDX.push({page:pageKey, pageTitle, el, text});
    });
  });
}

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function runTextSearch(query){
  const q = query.trim().toLowerCase();
  if(q.length < 2) return [];
  const matches = [];
  for(const item of SEARCH_IDX){
    const lower = item.text.toLowerCase();
    const idx = lower.indexOf(q);
    if(idx === -1) continue;
    matches.push(Object.assign({idx}, item));
  }
  return matches;
}

function groupByPage(matches, maxPages, maxPerPage){
  const order = [];
  const byPage = {};
  matches.forEach(m=>{
    if(!byPage[m.page]){ byPage[m.page]=[]; order.push(m.page); }
    if(byPage[m.page].length < maxPerPage) byPage[m.page].push(m);
  });
  return order.slice(0,maxPages).map(p=>({page:p, pageTitle:byPage[p][0].pageTitle, items:byPage[p]}));
}

function snippetHtml(text, idx, qLen){
  const start = Math.max(0, idx-36);
  const end = Math.min(text.length, idx+qLen+50);
  const before = (start>0?'…':'') + escapeHtml(text.slice(start,idx));
  const match = escapeHtml(text.slice(idx, idx+qLen));
  const after = escapeHtml(text.slice(idx+qLen, end)) + (end<text.length?'…':'');
  return before + '<mark>' + match + '</mark>' + after;
}

let ssLastResults = [];
let ssDebounce = null;
function onSearchInput(value){
  clearTimeout(ssDebounce);
  const clearBtn = document.getElementById('ss-clear');
  if(clearBtn) clearBtn.style.display = value ? 'block' : 'none';
  ssDebounce = setTimeout(()=>renderSearchResults(value), 120);
}

function renderSearchResults(query){
  const box = document.getElementById('search-results');
  if(!box) return;
  const q = query.trim();
  if(q.length < 2){ box.classList.remove('open'); box.innerHTML=''; return; }
  const matches = runTextSearch(q);
  const groups = groupByPage(matches, 6, 3);
  ssLastResults = [];
  let html = '';
  if(groups.length === 0){
    html += `<div class="ss-empty">Geen treffers voor "${escapeHtml(q)}" in de tekst.</div>`;
  } else {
    groups.forEach(g=>{
      html += `<div class="ss-group-label">${escapeHtml(g.pageTitle)}</div>`;
      g.items.forEach(m=>{
        const i = ssLastResults.length;
        ssLastResults.push(m);
        html += `<button type="button" class="ss-item" onclick="goToSearchResult(${i})">
          <div class="ss-item-snippet">${snippetHtml(m.text, m.idx, q.length)}</div>
        </button>`;
      });
    });
  }
  box.innerHTML = html;
  box.classList.add('open');
}

function closeSearchDropdown(){
  const box = document.getElementById('search-results');
  if(box) box.classList.remove('open');
}

function clearSearch(){
  const input = document.getElementById('site-search');
  if(!input) return;
  input.value = '';
  const clearBtn = document.getElementById('ss-clear');
  if(clearBtn) clearBtn.style.display = 'none';
  closeSearchDropdown();
  input.focus();
}

function onSearchKeydown(e){
  if(e.key === 'Escape'){ closeSearchDropdown(); e.target.blur(); }
  if(e.key === 'Enter'){ e.preventDefault(); if(ssLastResults.length) goToSearchResult(0); }
}

function revealForSearch(el){
  const ip = el.closest('.ip');
  if(ip){
    const m = ip.id.match(/^ind-([a-z]+)-(omgeving|gebouw)-(.+)$/);
    if(m) si2(m[1], m[2], m[3]);
  }
  const tc2 = el.closest('.tc2');
  if(tc2){
    const parent = tc2.closest('.page') || document;
    const btn = parent.querySelector(`.tb[onclick*="'${tc2.id}'"]`);
    if(btn) ot(btn, tc2.id);
  }
  /* Geldt voor zowel de maatregelenlijst als de veelgestelde vragen - beide
     gebruiken dezelfde uitklapbare .mrow-structuur. */
  const mrow = el.closest('.mrow');
  if(mrow && !mrow.classList.contains('on')) mrow.click();
}

function goToSearchResult(i){
  const m = ssLastResults[i];
  if(!m) return;
  closeSearchDropdown();
  nav(m.page);
  revealForSearch(m.el);
  setTimeout(()=>{
    m.el.scrollIntoView({behavior:'smooth', block:'center'});
    m.el.classList.add('search-hit-flash');
    setTimeout(()=>m.el.classList.remove('search-hit-flash'), 2000);
  }, 80);
}

document.addEventListener('click', (e)=>{
  const wrap = document.querySelector('.sidebar-search');
  if(wrap && !wrap.contains(e.target)) closeSearchDropdown();
});


/* ── SEARCH (curated titel/trefwoord-index, gebruikt als fallback) ── */
const IDX=[
  {t:'Start',p:'home',c:'FCAB Docs',kw:['fcab','dgbc','start','introductie','beta']},
  {t:'Introductie',p:'process',c:'Framework for Climate Adaptive Buildings',kw:['introductie','klimaatverandering','gebouwen','rapportageverplichtingen','tcfd','eu taxonomie','bepalen klimaatrisico','klimaatmodellen','klimaatscenario','tijdshorizons']},
  {t:'Klimaatverandering en gebouwen',p:'process',c:'Introductie',kw:['klimaatverandering','gebouwen','transitierisico','paalrot','schade']},
  {t:'Rapportageverplichtingen over fysiek klimaatrisico',p:'process',c:'Introductie',kw:['rapportageverplichtingen','tcfd','csrd','sfdr','eu taxonomie','dnsh']},
  {t:"Bepalen klimaatrisico's",p:'process',c:'Introductie',kw:['bepalen','klimaatrisico','hazard','blootstelling','kwetsbaarheid','ipcc']},
  {t:'Klimaatmodellen',p:'process',c:'Introductie',kw:['klimaatmodellen','gcm','rcm','cmip','knmi']},
  {t:"Klimaatscenario's",p:'process',c:'Introductie',kw:['klimaatscenario','knmi14','wh','wl','gh','gl','rcp8.5']},
  {t:'Tijdshorizons',p:'process',c:'Introductie',kw:['tijdshorizon','2050','2085','levensduur']},
  {t:'Omgevingsscore',p:'omgevingsscore',c:'FCAB Docs',kw:['omgeving','bruto','hazard','blootstelling','fcab-1','scoringsschaal']},
  {t:'Hittestress',p:'omgevingsscore',c:'Omgevingsscore',kw:['hittestress','tropische nachten','uhi','wenr']},
  {t:'Natuurbrandgevoeligheid',p:'omgevingsscore',c:'Omgevingsscore',kw:['natuurbrand','gevoeligheid','wenr','deltares']},
  {t:'Paalrot',p:'omgevingsscore',c:'Omgevingsscore',kw:['paalrot','houten paalfundering','deltares']},
  {t:'Verschilzetting',p:'omgevingsscore',c:'Omgevingsscore',kw:['verschilzetting','staal fundering','deltares']},
  {t:'Waterdiepte bij hevige bui',p:'omgevingsscore',c:'Omgevingsscore',kw:['waterdiepte','70mm','2uur','bui','ror']},
  {t:'Grondwateroverlast',p:'omgevingsscore',c:'Omgevingsscore',kw:['grondwateroverlast','index','bodemdaling','ghg']},
  {t:'Maximale waterdieptekaart',p:'omgevingsscore',c:'Omgevingsscore',kw:['maximale waterdiepte','overstroomik','rws','ldo']},
  {t:'Plaatsgebonden overstromingskans',p:'omgevingsscore',c:'Omgevingsscore',kw:['overstromingskans','20cm','liwo']},
  {t:'Gebouwscore',p:'gebouwscore',c:'FCAB Docs',kw:['gebouw','kwetsbaarheid','kenmerken','fcab-2','netto','klimaatrisicoscore','risicomatrix']},
  {t:'Gebouwscore Hitte',p:'gebouwscore',c:'Gebouwscore',kw:['hitte','zonwering','isolatie','glasoppervlak']},
  {t:'Gebouwscore Droogte',p:'gebouwscore',c:'Gebouwscore',kw:['droogte','paalrot','verschilzetting','bouwjaar','fundering']},
  {t:'Gebouwscore Wateroverlast',p:'gebouwscore',c:'Gebouwscore',kw:['wateroverlast','dryproofing','wetproofing','drempel']},
  {t:'Gebouwscore Overstroming',p:'gebouwscore',c:'Gebouwscore',kw:['overstroming','dryproofing','terugslagklep']},
  {t:'Hitte',p:'hitte',c:"Thema's",kw:['hitte','warmte','tropisch','nacht','uhi','koeling','zonwering','isolatie','databronnen','versiebeheer']},
  {t:'Droogte',p:'droogte',c:"Thema's",kw:['droogte','paalrot','verschilzetting','natuurbrand','fundering','databronnen','versiebeheer']},
  {t:'Wateroverlast',p:'wateroverlast',c:"Thema's",kw:['wateroverlast','bui','regen','grondwater','riool','kelder','databronnen','versiebeheer']},
  {t:'Overstroming',p:'overstroming',c:"Thema's",kw:['overstroming','dijk','liwo','floodproofing','databronnen','versiebeheer']},
  {t:'Hagel & Storm',p:'hagelstorm',c:"Thema's",kw:['hagel','storm','windstoot','knmi23']},
  {t:'Adaptatiestrategie',p:'strategie',c:'Deel 3',kw:['adaptatie','strategie','risicomanagementcyclus','fysieke klimaatrisico\'s beoordelen','maatregelen','bijlagen','4t','terminate','treat']},
  {t:"Klimaatrisico's in een risicomanagementcyclus",p:'strategie',c:'Adaptatiestrategie',kw:['risicomanagementcyclus','7 stappen','risicobereidheid']},
  {t:"Fysieke klimaatrisico's beoordelen",p:'strategie',c:'Adaptatiestrategie',kw:['deep-dive','impactanalyse','risicohouding']},
  {t:'Maatregelen',p:'strategie',c:'Adaptatiestrategie',kw:['maatregel','zonwering','wadi','isolatie','maatregelentabel','kosten','complexiteit']},
  {t:'Bijlagen',p:'strategie',c:'Adaptatiestrategie',kw:['bijlage','updates','kennisagenda','literatuur','stakeholders','kwantitatieve effecten']},
  {t:'Veelgestelde vragen',p:'faq',c:'Framework for Climate Adaptive Buildings',kw:['faq','veelgestelde vragen','toepassing','interpretatie','nieuwbouw','onbekend']},
];

/* ── VERTALING (Google Translate) ── */
var currentLang = 'nl';
var gtReady = false;
var gtPending = null;

function googleTranslateElementInit(){
  new google.translate.TranslateElement({pageLanguage:'nl',includedLanguages:'en',autoDisplay:false}, 'google_translate_element');
  var tries = 0;
  var waitForCombo = setInterval(function(){
    tries++;
    var combo = document.querySelector('.goog-te-combo');
    if(combo || tries > 100){
      clearInterval(waitForCombo);
      gtReady = !!combo;
      if(gtPending){ var l = gtPending; gtPending = null; setGoogleLang(l); }
    }
  }, 100);
  hideGoogleTranslateChrome();
}

/* Google's vertaalbalk duikt soms weer op (eigen iframe + inline top-offset op
   <body>/<html>). We forceren 'm continu weg, i.p.v. te vertrouwen op CSS alleen. */
function hideGoogleTranslateChrome(){
  document.querySelectorAll('iframe.goog-te-banner-frame, .goog-te-banner-frame, body > .skiptranslate').forEach(function(el){
    el.style.display='none';
    el.style.visibility='hidden';
    el.style.height='0';
  });
  if(document.body && document.body.style.top) document.body.style.top='0px';
  if(document.documentElement && document.documentElement.style.top) document.documentElement.style.top='0px';
}
setInterval(hideGoogleTranslateChrome, 500);

/* Terug naar het Nederlands via de .goog-te-combo blijkt in de praktijk onbetrouwbaar:
   Google's widget zet na een vertaling een 'googtrans'-cookie en herschrijft de tekst-
   nodes op een manier die met alleen de select terugzetten niet altijd goed terugdraait.
   De robuuste, breed gedocumenteerde manier is de cookie te wissen en de pagina opnieuw
   te laden. We onthouden welke pagina/sectie open stond zodat de gebruiker daar na de
   herlaad weer uitkomt i.p.v. terug bij Start. */
function clearGoogTransCookie(){
  var host = location.hostname;
  var domains = [''];
  if(host){
    domains.push(host, '.' + host);
    var parts = host.split('.');
    for(var i=1;i<parts.length-1;i++){ domains.push('.' + parts.slice(i).join('.')); }
  }
  domains.forEach(function(d){
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;' + (d ? ' domain=' + d + ';' : '');
  });
}

function revertToOriginalLanguage(){
  try{ sessionStorage.setItem('fcab-restore-page', cur); }catch(e){}
  clearGoogTransCookie();
  location.replace(location.href.split('#')[0]);
}

function setGoogleLang(lang){
  if(lang === 'nl'){ revertToOriginalLanguage(); return; }
  var combo = document.querySelector('.goog-te-combo');
  if(!combo){ gtPending = lang; return; }
  combo.value = lang;
  combo.dispatchEvent(new Event('change'));
}

function toggleLanguage(){
  var btns = Array.prototype.slice.call(document.querySelectorAll('.lang-toggle'));
  var next = currentLang === 'nl' ? 'en' : 'nl';
  btns.forEach(function(btn){ btn.classList.add('busy'); });
  setGoogleLang(next);
  currentLang = next;
  btns.forEach(function(btn){
    var label = btn.querySelector('.lt-label');
    if(label) label.textContent = next === 'nl' ? 'EN' : 'NL';
    btn.setAttribute('aria-label', next === 'nl' ? 'Vertaal pagina naar Engels' : 'Translate page back to Dutch');
    setTimeout(function(){ btn.classList.remove('busy'); }, 400);
  });
}
