/* Gebouwscore zelf bepalen, in de tabellen van hoofdstuk 3 (data/gebouwscore.js).
   - The table in 3.1.3, 3.1.4, 3.3.3 and 3.4.3 becomes a clickable table: click a situation to choose it (click again to undo).
   - Below the first paragraph of 3.1.5, 3.2.5, 3.3.5 and 3.4.5 comes a calculation block with the environment score and
     the result; the matching row or cell of the table there is marked.
   - A characteristic that is not chosen counts as 'very high vulnerability' (the rule for unknown characteristics).
   Choices are kept in localStorage 'fcab-gs'. Called by js/03-app.js after rendering a page: FCAB_GS.enhance(). */
(function(G){
  const C=G.FCAB_CALC; if(!C) return;
  const LG=G.FCAB_LANG, L=(en,nl)=>LG.L(en,nl), tx=o=>o?(LG.lang==='nl'?o.nl:(o.en||o.nl)):'';
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let S={sel:{},env:{}};
  try{ const x=JSON.parse(localStorage.getItem('fcab-gs')||'null'); if(x&&x.sel&&x.env) S=x; }catch(e){}
  const save=()=>{ try{ localStorage.setItem('fcab-gs',JSON.stringify(S)); }catch(e){} };
  const num=n=>{ const r=Math.round(n*100)/100; return (LG.lang==='nl'?String(r).replace('.',','):String(r)).replace('-','−'); };
  const pts=n=>(n>0?'+':'')+num(n);
  // classes in the FCAB logo colours only: k1 light green ... k5 red (css/01-stijl.css)
  const badge=k=>k?`<span class="kbadge k${k}">${esc(tx(C.klassen[k]))}</span>`:`<span class="kbadge none">${L('none','geen')}</span>`;
  const KWORD={'zeer laag':1,'very low':1,'laag':2,'low':2,'gemiddeld':3,'medium':3,'hoog':4,'high':4,'zeer hoog':5,'very high':5};
  // turn a table of the method text into a colour matrix: every body cell that holds a class (or 1-5) gets its colour
  function asMatrix(t,numeric){
    if(!t) return; t.classList.add('mx');
    [...t.rows].forEach((r,ri)=>{ if(ri===0) return; [...r.cells].forEach((c,ci)=>{ if(ci===0) return;
      const v=c.textContent.trim().toLowerCase(), k=numeric?(/^[1-5]$/.test(v)?+v:0):KWORD[v];
      if(k){ c.classList.add('k'+k); if(numeric) c.title=tx(C.klassen[k]); } }); });
  }

  // ---- questions: chosen points, or the most vulnerable option when not chosen
  const optPts=(o,env)=>o.p!==undefined?o.p:(env==='hoog'?o.hoog:o.laag);
  function sumQ(key,list,env){
    let sum=0, open=0;
    list.forEach(q=>{ const i=S.sel[key+'.'+q.id];
      if(i===undefined){ open++; sum+=Math.max(...q.opties.map(o=>optPts(o,env))); } else sum+=optPts(q.opties[i],env); });
    return {sum,open};
  }
  const band=(bands,v)=>{ for(const [hi,k] of bands) if(v<=hi) return k; return bands[bands.length-1][1]; };
  const colOf=(cols,v)=>{ for(let i=0;i<cols.length;i++) if(v<=cols[i]) return i; return cols.length-1; };

  function results(){
    const R={};
    // heat
    { const env=S.env['hitte.omgeving']; const o=sumQ('hitte',C.hitte.opwarming,env), a=sumQ('hitte',C.hitte.afkoeling,env||'laag');
      const raw=o.sum+a.sum, score=Math.round(Math.max(0,Math.min(100,raw)));
      R.hitte={op:o.sum,af:a.sum,score,open:o.open+a.open,envOpen:!env,k:band(C.hitte.banden,score)}; }
    // pluvial flooding
    { const W=C.wateroverlast, s=sumQ('wateroverlast',W.vragen), score=Math.round(Math.max(W.min,Math.min(W.max,s.sum))), env=S.env['wateroverlast.omgeving'];
      const col=colOf(W.kolommen,score);
      R.wateroverlast={score,open:s.open,env,col,k:env&&env!=='0'?W.matrix[env][col]:null}; }
    // river and sea flooding: step plan
    { const O=C.overstroming, s=sumQ('overstroming',O.vragen), score=Math.round(Math.max(O.min,Math.min(O.max,s.sum)));
      const k20=S.env['overstroming.k20'], k50=S.env['overstroming.k50'];
      let k=null, stap=null;
      if(k20==='klein'||k20==='zeerklein'){ k=2; stap=1; }
      else if(k20&&k50==='gelijk'){ k=4; stap=2; }
      else if(k20&&k50==='kleiner'){ k=band(O.banden,score); stap=3; }
      R.overstroming={score,open:s.open,k20,k50,k,stap}; }
    // drought: pile rot and differential settlement
    { const D=C.droogte, f=S.env['droogte.fundering'];
      const bjP=S.env['droogte.p.bouwjaar'], omP=S.env['droogte.p.omgeving'], bjZ=S.env['droogte.z.bouwjaar'], kel=S.env['droogte.z.kelder']||'gedeeltelijk', omZ=S.env['droogte.z.omgeving'];
      const p=(f==='hout'||f==='onbekend')&&bjP!==undefined&&omP?D.paalrot.matrix[omP][bjP]:null;
      const zs=bjZ!==undefined?D.zetting.score[bjZ][kel]:null;
      const z=(f==='staal'||f==='onbekend')&&zs!=null&&omZ!==undefined?D.zetting.matrix[omZ][D.zetting.kolommen.indexOf(zs)]:null;
      R.droogte={f,p,zs,z,k:f==='onbekend'?(p&&z?Math.max(p,z):null):f==='hout'?p:f==='staal'?z:null}; }
    return R;
  }

  // ---- clickable table
  function qtable(key,list,opts){
    opts=opts||{};
    const rows=list.map(q=>q.opties.map((o,i)=>{
      const on=S.sel[key+'.'+q.id]===i;
      const p=o.p!==undefined?pts(o.p):`<span title="${L('environment score low','omgevingsscore laag')}">${pts(o.laag)}</span> / <span title="${L('environment score medium or high','omgevingsscore middel of hoog')}">${pts(o.hoog)}</span>`;
      return `<tr class="qo${on?' on':''}${i===0?' q1':''}" data-gs="${key}.${q.id}" data-i="${i}" tabindex="0" role="button" aria-pressed="${on}">
        ${i===0?`<td class="qk" rowspan="${q.opties.length}">${esc(tx(q))}</td>`:''}<td class="qs">${esc(tx(o))}</td><td class="qp">${p}</td></tr>`;}).join('')).join('');
    return `<div class="wrap"><table class="t qt" data-qt="${key}" data-part="${opts.part||''}"><thead><tr><th>${L('Characteristic','Kenmerk')}</th><th>${L('Situation','Situatie')}</th><th class="qp">${L('Points','Punten')}</th></tr></thead>
      <tbody>${rows}</tbody><tfoot><tr><td colspan="2" class="qtl" data-tot-label="${key}.${opts.part||''}"></td><td class="qp" data-tot="${key}.${opts.part||''}"></td></tr></tfoot></table></div>`;
  }
  const sel=(id,label,list,val,valOf)=>`<label class="cf"><span>${label}</span><select data-env="${id}"><option value="">${L('Choose','Kies')}</option>${list.map((o,i)=>{ const v=valOf?valOf(o,i):o.id; return `<option value="${esc(v)}"${String(val)===String(v)?' selected':''}>${esc(tx(o))}</option>`; }).join('')}</select></label>`;

  // ---- calculation blocks
  function box(theme){
    const h=`<div class="calc" data-calc="${theme}"><div class="calch">${L('Determine it yourself','Zelf bepalen')}</div>`;
    if(theme==='hitte') return h+`<p class="cs">${L('Choose the situation per characteristic in the tables of 3.1.3 and 3.1.4. The environment score only affects the points for purge ventilation.','Kies per kenmerk de situatie in de tabellen van 3.1.3 en 3.1.4. De omgevingsscore bepaalt alleen de punten voor spuiventilatie.')}</p>
      <div class="cfs">${sel('hitte.omgeving',L('Environment score heat','Omgevingsscore hitte'),C.hitte.omgeving,S.env['hitte.omgeving'])}</div><div class="cres" data-res="hitte"></div></div>`;
    if(theme==='wateroverlast') return h+`<p class="cs">${L('Choose the situation per characteristic in the table of 3.3.3 and the environment score from 3.3.2.','Kies per kenmerk de situatie in de tabel van 3.3.3 en de omgevingsscore uit 3.3.2.')}</p>
      <div class="cfs">${sel('wateroverlast.omgeving',L('Environment score pluvial flooding','Omgevingsscore wateroverlast'),C.wateroverlast.omgeving,S.env['wateroverlast.omgeving'])}</div><div class="cres" data-res="wateroverlast"></div></div>`;
    if(theme==='overstroming') return h+`<p class="cs">${L('Choose the flood probabilities from 3.4.2. Only in step 3 does the building score from the table in 3.4.3 count.','Kies de overstromingskansen uit 3.4.2. Alleen in stap 3 telt de gebouwscore uit de tabel in 3.4.3.')}</p>
      <div class="cfs">${sel('overstroming.k20',L('Probability of more than 20 cm in 2050','Kans op meer dan 20 cm in 2050'),C.overstroming.kans20,S.env['overstroming.k20'])}
      ${sel('overstroming.k50',L('Probability of more than 50 cm','Kans op meer dan 50 cm'),C.overstroming.kans50,S.env['overstroming.k50'])}</div><div class="cres" data-res="overstroming"></div></div>`;
    if(theme==='droogte'){ const D=C.droogte, f=S.env['droogte.fundering'];
      return h+`<p class="cs">${L('Choose the foundation type. For an unknown foundation both mechanisms are assessed and the highest counts.','Kies het funderingstype. Bij een onbekende fundering worden beide mechanismen beoordeeld en telt de hoogste.')}</p>
      <div class="cfs">${sel('droogte.fundering',L('Foundation type','Funderingstype'),D.fundering,f)}</div>
      <div class="cfs" data-show="p"><b class="cfh">${L('Pile rot (timber piles)','Paalrot (houten palen)')}</b>${sel('droogte.p.bouwjaar',L('Construction year','Bouwjaar'),D.paalrot.bouwjaar,S.env['droogte.p.bouwjaar'],(o,i)=>i)}${sel('droogte.p.omgeving',L('Environment score (3.2.2)','Omgevingsscore (3.2.2)'),D.paalrot.omgeving,S.env['droogte.p.omgeving'])}</div>
      <div class="cfs" data-show="z"><b class="cfh">${L('Differential settlement (shallow foundation)','Verschilzetting (fundering op staal)')}</b>${sel('droogte.z.bouwjaar',L('Construction year','Bouwjaar'),D.zetting.bouwjaar,S.env['droogte.z.bouwjaar'],(o,i)=>i)}${sel('droogte.z.kelder',L('Basement','Kelder'),D.zetting.kelder,S.env['droogte.z.kelder'])}${sel('droogte.z.omgeving',L('Environment score 0–5 (3.2.2)','Omgevingsscore 0–5 (3.2.2)'),[0,1,2,3,4,5].map(n=>({id:String(n),nl:String(n),en:String(n)})),S.env['droogte.z.omgeving'])}</div>
      <div class="cres" data-res="droogte"></div></div>`; }
    return '';
  }
  const item=(l,v,cls)=>`<span class="ci${cls?' '+cls:''}">${l} <b>${v}</b></span>`;
  const openNote=n=>n?`<p class="cnote">${n===1?L('1 characteristic not chosen yet; it counts as very high vulnerability.','1 kenmerk nog niet gekozen; dat telt als zeer hoge kwetsbaarheid.'):L(`${n} characteristics not chosen yet; they count as very high vulnerability.`,`${n} kenmerken nog niet gekozen; die tellen als zeer hoge kwetsbaarheid.`)}</p>`:'';

  // ---- update everything that is on the page
  function update(){
    const R=results(), root=document.getElementById('view'); if(!root) return;
    root.querySelectorAll('tr.qo').forEach(tr=>{ const on=S.sel[tr.dataset.gs]===+tr.dataset.i; tr.classList.toggle('on',on); tr.setAttribute('aria-pressed',on); });
    const tot=(k,v,label)=>{ const a=root.querySelector(`[data-tot="${k}"]`), b=root.querySelector(`[data-tot-label="${k}"]`); if(a) a.textContent=num(v); if(b) b.textContent=label; };
    tot('hitte.op',R.hitte.op,L('Score heating up','Score opwarming'));
    tot('hitte.af',R.hitte.af,L('Points cooling down','Punten afkoeling')+(S.env['hitte.omgeving']?'':' '+L('(environment score low assumed)','(uitgaande van omgevingsscore laag)')));
    tot('wateroverlast.',R.wateroverlast.score,L('Building score (min. 4, max. 100)','Gebouwscore (min. 4, max. 100)'));
    tot('overstroming.',R.overstroming.score,L('Building score (min. 4, max. 100)','Gebouwscore (min. 4, max. 100)'));
    const set=(t,html)=>{ const el=root.querySelector(`[data-res="${t}"]`); if(el) el.innerHTML=html; };
    const H=R.hitte;
    set('hitte',`<div class="cis">${item(L('Heating up','Opwarming'),num(H.op))}${item(L('Cooling down','Afkoeling'),num(H.af))}${item(L('Building score','Gebouwscore'),H.score)}${item(L('Vulnerability score','Kwetsbaarheidsscore'),badge(H.k),'big')}</div>${openNote(H.open)}${H.envOpen?`<p class="cnote">${L('No environment score chosen: purge ventilation is counted as with a low score.','Geen omgevingsscore gekozen: spuiventilatie telt als bij een lage score.')}</p>`:''}`);
    const W=R.wateroverlast;
    set('wateroverlast',`<div class="cis">${item(L('Building score','Gebouwscore'),W.score)}${item(L('Vulnerability score','Kwetsbaarheidsscore'),W.env?badge(W.k):`<span class="kbadge none">${L('choose the environment score','kies de omgevingsscore')}</span>`,'big')}</div>${openNote(W.open)}${W.env==='0'?`<p class="cnote">${L('With environment score none there is no vulnerability to pluvial flooding.','Met omgevingsscore geen is er geen kwetsbaarheid voor wateroverlast.')}</p>`:''}`);
    const O=R.overstroming;
    const why=O.stap===1?L('Step 1: probability of more than 20 cm is small.','Stap 1: de kans op meer dan 20 cm is klein.'):O.stap===2?L('Step 2: the water always comes higher than 50 cm; the building score does not count.','Stap 2: het water komt altijd hoger dan 50 cm; de gebouwscore telt niet mee.'):O.stap===3?L('Step 3: the building score determines the score.','Stap 3: de gebouwscore bepaalt de score.'):(O.k20?L('Choose the probability of more than 50 cm.','Kies ook de kans op meer dan 50 cm.'):L('Choose the probability of more than 20 cm.','Kies de kans op meer dan 20 cm.'));
    set('overstroming',`<div class="cis">${item(L('Building score','Gebouwscore'),O.stap===3?O.score:'–')}${item(L('Vulnerability score','Kwetsbaarheidsscore'),O.k?badge(O.k):'–','big')}</div><p class="cnote">${why}</p>${O.stap===3?openNote(O.open):''}`);
    const k50=root.querySelector('[data-env="overstroming.k50"]'); if(k50) k50.closest('.cf').hidden=!(O.k20==='groot'||O.k20==='middel');
    const D=R.droogte;
    root.querySelectorAll('[data-show]').forEach(el=>{ el.hidden=!(D.f==='onbekend'||(el.dataset.show==='p'&&D.f==='hout')||(el.dataset.show==='z'&&D.f==='staal')); });
    set('droogte',D.f==='beton'?`<p class="cnote">${L('On concrete piles or another foundation there is no score for pile rot and differential settlement.','Op betonpalen of een andere fundering is er geen score voor paalrot en verschilzetting.')}</p>`:!D.f?'':
      `<div class="cis">${D.f!=='staal'?item(L('Pile rot','Paalrot'),D.p?badge(D.p):'–'):''}${D.f!=='hout'?item(L('Building score settlement','Gebouwscore zetting'),D.zs!=null?D.zs:'–'):''}${D.f!=='hout'?item(L('Differential settlement','Verschilzetting'),D.z?badge(D.z):'–'):''}${D.f==='onbekend'?item(L('Foundation (highest)','Fundering (hoogste)'),D.k?badge(D.k):'–','big'):''}</div>`);
    // mark the matching row or cell in the tables of the method text
    root.querySelectorAll('.gs-mark').forEach(el=>el.classList.remove('gs-mark'));
    const T=root._gsT||{};
    if(T.hitte&&H){ const r=T.hitte.rows[H.k]; if(r) r.classList.add('gs-mark'); }
    if(T.water&&W.env&&W.env!=='0'){ const r=T.water.rows[6-(+W.env)]; if(r&&r.cells[W.col+1]) r.cells[W.col+1].classList.add('gs-mark'); }
    if(T.over&&O.stap){ const r=T.over.rows[O.stap===3?({4:3,3:4,2:5}[O.k]):O.stap]; if(r) r.classList.add('gs-mark'); }
    if(T.paal&&D.p){ const ids=['LP','LC','LS','MP','MC','MS','HP','HC','HS'], r=T.paal.rows[ids.indexOf(S.env['droogte.p.omgeving'])+1]; if(r&&r.cells[+S.env['droogte.p.bouwjaar']+1]) r.cells[+S.env['droogte.p.bouwjaar']+1].classList.add('gs-mark'); }
    if(T.zet&&D.z){ const r=T.zet.rows[+S.env['droogte.z.omgeving']+1]; const c=C.droogte.zetting.kolommen.indexOf(D.zs)+1; if(r&&r.cells[c]) r.cells[c].classList.add('gs-mark'); }
    if(T.zscore&&D.zs!=null){ const r=T.zscore.rows[+S.env['droogte.z.bouwjaar']+1], c={souterrain:1,gedeeltelijk:2,geen:3}[S.env['droogte.z.kelder']||'gedeeltelijk']; if(r&&r.cells[c]) r.cells[c].classList.add('gs-mark'); }
  }

  // ---- find the n-th table of a section (the siblings after its heading, up to the next section heading)
  function tables(nr){
    const h=document.getElementById('s-'+nr.replace(/\./g,'-')); const out=[]; if(!h) return out;
    for(let n=h.nextElementSibling;n&&!(/^H[1-4]$/.test(n.tagName)&&n.id&&n.id.startsWith('s-'));n=n.nextElementSibling){ if(n.tagName==='TABLE') out.push(n); else n.querySelectorAll&&n.querySelectorAll('table').forEach(t=>out.push(t)); }
    return out;
  }
  function replace(nr,html){ const t=tables(nr)[0]; if(!t) return; const d=document.createElement('div'); d.innerHTML=html; t.replaceWith(d.firstElementChild); }
  function insertBox(nr,html){
    const h=document.getElementById('s-'+nr.replace(/\./g,'-')); if(!h) return;
    let after=h.nextElementSibling&&h.nextElementSibling.tagName==='P'?h.nextElementSibling:h;
    after.insertAdjacentHTML('afterend',html);
  }

  function enhance(page){
    const root=document.getElementById('view'); if(!root) return;
    root._gsT={};
    if(page==='3.1'){
      replace('3.1.3',qtable('hitte',C.hitte.opwarming,{part:'op'})); replace('3.1.4',qtable('hitte',C.hitte.afkoeling,{part:'af'}));
      root._gsT.hitte=tables('3.1.5')[0]; asMatrix(root._gsT.hitte,false); insertBox('3.1.5',box('hitte'));
    } else if(page==='3.2'){
      root._gsT.zscore=tables('3.2.3')[0]; const t=tables('3.2.5'); root._gsT.paal=t[0]; root._gsT.zet=t[1]; asMatrix(t[0],true); asMatrix(t[1],true); insertBox('3.2.5',box('droogte'));
    } else if(page==='3.3'){
      replace('3.3.3',qtable('wateroverlast',C.wateroverlast.vragen)); root._gsT.water=tables('3.3.5')[0]; asMatrix(root._gsT.water,false); insertBox('3.3.5',box('wateroverlast'));
    } else if(page==='3.4'){
      replace('3.4.3',qtable('overstroming',C.overstroming.vragen)); root._gsT.over=tables('3.4.5')[0]; insertBox('3.4.5',box('overstroming'));
    } else return;
    update();
  }

  function choose(tr){ const k=tr.dataset.gs, i=+tr.dataset.i; if(S.sel[k]===i) delete S.sel[k]; else S.sel[k]=i; save(); update(); }
  document.addEventListener('click',e=>{ const tr=e.target.closest('tr.qo[data-gs]'); if(tr) choose(tr); });
  document.addEventListener('keydown',e=>{ const tr=e.target.closest&&e.target.closest('tr.qo[data-gs]'); if(tr&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); choose(tr); } });
  document.addEventListener('change',e=>{ const k=e.target.dataset&&e.target.dataset.env; if(!k) return; if(e.target.value==='') delete S.env[k]; else S.env[k]=e.target.value; save(); update(); });

  G.FCAB_GS={enhance};
})(window);
