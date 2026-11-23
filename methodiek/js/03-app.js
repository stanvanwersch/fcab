/* FCAB Online Omgeving: routing, sidebar, top bar, pages, chapter menu and search.
   Content comes from data/: CD_FCAB_TEXT (methodology, chapters 1-6), FCAB_PAGES (home, FAQ, about, archive, changelog)
   and FCAB_MEASURES (measure table). Routes: #home, #m-<nr> (chapter or section), #maatregelen, #faq, #contact,
   #archief, #changelog. Sections 3.1 to 3.6 (the climate themes) are pages of their own; other sections scroll
   within their chapter. */
(function(G){
  const $=id=>document.getElementById(id), LG=G.FCAB_LANG, L=(en,nl)=>LG.L(en,nl), NL=()=>LG.lang==='nl';
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const DOC=G.CD_FCAB_TEXT||[], PAGES=G.FCAB_PAGES||{}, MEAS=G.FCAB_MEASURES||null;
  const t=o=>NL()?o.t_nl:(o.t_en||o.t_nl), h=o=>(NL()?o.nl:(o.en||o.nl))||'';
  const sid=nr=>'s-'+String(nr).replace(/\./g,'-');
  const THEMECOL={'3.1':'#E8710A','3.2':'#E8B84B','3.3':'#3B82C4','3.4':'#1F5F99','3.5':'#7A8A99','3.6':'#4BAE8A'};

  // ---- methodology tree
  const NODES={}; (function walk(list,parent){ list.forEach(n=>{ NODES[n.nr]={n,parent}; walk(n.sub||[],n); }); })(DOC,null);
  const isThemePage=nr=>/^3\.\d+$/.test(nr);
  // the page a section lives on: a chapter, or a climate theme (3.x)
  function pageOf(nr){
    if(!NODES[nr]) return null;
    let k=nr; while(k){ if(isThemePage(k)||!NODES[k].parent) return k; k=NODES[k].parent.nr; }
    return null;
  }
  // reading order of the method pages: 1, 2, 3, 3.1 ... 3.6, 4, 5, 6
  const ORDER=[]; DOC.forEach(c=>{ ORDER.push(c.nr); if(c.nr==='3') (c.sub||[]).forEach(s=>ORDER.push(s.nr)); });

  // ---- icons
  const SVG={
    menu:'<path d="M4 5h16v14H4z"/><path d="M9 5v14"/>', back:'<path d="m15 6-6 6 6 6"/>', fwd:'<path d="m9 6 6 6-6 6"/>',
    search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>', home:'<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/>',
    book:'<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
    table:'<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M4 10h16M4 15h16M10 5v14"/>',
    help:'<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4"/><circle cx="12" cy="16.8" r=".6" fill="currentColor"/>',
    archive:'<rect x="3.5" y="4.5" width="17" height="4" rx="1"/><path d="M5 8.5V19h14V8.5M10 12h4"/>',
    info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".6" fill="currentColor"/>',
    mail:'<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="m4 7 8 6 8-6"/>', globe:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5s1.1-6.1 3.4-8.5z"/>',
    clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', dl:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    more:'<circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18" cy="12" r="1.2" fill="currentColor"/>',
    chev:'<path d="m7 10 5 5 5-5"/>', up:'<path d="m7 14 5-5 5 5"/>', down:'<path d="m7 10 5 5 5-5"/>', x:'<path d="M7 7l10 10M17 7 7 17"/>',
    tool:'<path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17v3h3l5.2-5.2a4 4 0 0 0 5.3-5.3l-2.3 2.3-2.4-.6-.6-2.4z"/>',
    flag:'<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>', layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    gauge:'<path d="M4 15a8 8 0 1 1 16 0"/><path d="m12 15 4-5"/><circle cx="12" cy="15" r="1.2" fill="currentColor"/>', shield:'<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/>',
    print:'<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="1.5"/><path d="M7 14h10v6H7z"/>',
  };
  const ic=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[k]||''}</svg>`;

  // ---- routing
  const PAGE_KEYS={home:['home',L('Home','Home')],faq:['faq',L('Frequently asked questions','Veelgestelde vragen')],contact:['contact','Contact'],archief:['archief',L('Archive cards','Archiefkaarten')],changelog:['changelog','Changelog']};
  function parse(){
    const raw=decodeURIComponent(location.hash.slice(1)||'home');
    const m=raw.match(/^m-([\d.]+)$/);
    if(m&&NODES[m[1]]) return {v:'m',nr:m[1],page:pageOf(m[1])};
    if(raw==='maatregelen') return {v:'maatregelen'};
    if(raw==='overons') return {v:'contact'};
    if(['home','faq','contact','archief','changelog'].includes(raw)) return {v:raw};
    return {v:'home'};
  }
  const st={sbHidden:false,open3:true,themes:true,more:false};
  try{ st.open3=localStorage.getItem('fcab-open3')==='1'; st.themes=localStorage.getItem('fcab-themes')!=='0'; }catch(e){}
  try{ st.sbHidden=localStorage.getItem('fcab-sb')==='0'; }catch(e){}

  function pageTitle(k){ const p=PAGES[k]; return p?(NL()?p.t_nl:(p.t_en||p.t_nl)):({home:L('Home','Home'),faq:L('Frequently asked questions','Veelgestelde vragen'),contact:'Contact',archief:L('Archive cards','Archiefkaarten'),changelog:'Changelog'}[k]); }

  // ---- sidebar
  // the items under More (a pop-up menu beside the sidebar)
  const MORE_ITEMS=()=>[['#m-5','tool',L('Maintenance','Beheer'),'m-5'],['#m-6','book',L('Sources','Bronnen'),'m-6'],null,
    ['#maatregelen','table',L('Measure table','Maatregelentabel'),'maatregelen'],['#faq','help',pageTitle('faq'),'faq'],['#archief','archive',pageTitle('archief'),'archief'],['#changelog','clock',pageTitle('changelog'),'changelog']].map(x=>x&&[x[0],x[1],x[2],x[3]]).filter((x,i,a)=>x||a[i-1]);
  function morePop(btn){
    let pop=$('morepop');
    if(!pop){ pop=document.createElement('div'); pop.id='morepop'; pop.className='pop'; pop.setAttribute('role','menu'); document.body.appendChild(pop); }
    if(!btn){ pop.hidden=true; document.querySelectorAll('[data-more]').forEach(b=>b.setAttribute('aria-expanded','false')); return; }
    const r=parse(), cur=r.v==='m'?'m-'+r.page:r.v;
    pop.innerHTML=MORE_ITEMS().map(m=>m?`<a role="menuitem" href="${m[0]}" class="${cur===m[3]?'on':''}">${ic(m[1])}<span>${esc(m[2])}</span></a>`:'<hr>').join('');
    const b=btn.getBoundingClientRect();
    pop.hidden=false; pop.style.left=Math.round(b.right-44)+'px';
    pop.style.top=Math.round(Math.min(b.top,innerHeight-pop.offsetHeight-12))+'px';
    btn.setAttribute('aria-expanded','true');
  }

  function sidebar(r){
    const cur=r.v==='m'?'m-'+r.page:r.v;
    const it=(href,icon,label,k,cls,extra)=>`<a class="sbi${cls?' '+cls:''}${cur===k?' on':''}" href="${href}" title="${label}"${cur===k?' aria-current="page"':''}>${icon}<span>${label}</span>${extra||''}</a>`;
    const dot=nr=>`<i class="dot" style="background:${THEMECOL[nr]||'#9C9690'}"></i>`;
    // short chapter names; chapter 3 (Beoordeling) folds open and shut; 5 and 6 sit under More
    const SHORT={'1':L('Introduction','Introductie'),'2':L('Methodology','Methodologie'),'3':L('Assessment','Beoordeling'),'4':L('Adaptation','Adaptatie'),'5':L('Maintenance','Beheer'),'6':L('Sources','Bronnen')};
    const c3=NODES['3']&&NODES['3'].n, themes=(c3&&c3.sub)||[];
    const fold=(k,open)=>`<button type="button" class="sbc" data-fold="${k}" aria-expanded="${open}" title="${open?L('Collapse','Inklappen'):L('Expand','Uitklappen')}" aria-label="${open?L('Collapse','Inklappen'):L('Expand','Uitklappen')}">${ic('chev')}</button>`;
    const CHIC={'1':'flag','2':'layers','3':'gauge','4':'shield'};
    const chap=['1','2','3','4'].filter(n=>NODES[n]).map(n=>it('#m-'+n,ic(CHIC[n]),SHORT[n],'m-'+n,'ch')).join('');
    const moreOn=MORE_ITEMS().some(m=>m&&m[3]===cur);
    $('sb').innerHTML=`<div class="sbt">
        <a class="brand" href="#home" title="${L('To the start page','Naar de startpagina')}"><div class="fmark"><i>F</i><i>C</i><i>A</i><i>B</i></div><span>Framework for Climate<br>Adaptive Buildings</span></a>
      </div>
      <div class="sbs">
        <div class="sbq"><label>${ic('search')}<input id="q" type="search" autocomplete="off" placeholder="${L('Search','Zoek')}" aria-label="${L('Search the methodology','Zoek in de methodiek')}"></label><div class="qres" id="qres" hidden></div></div>
        ${chap}
        <button type="button" class="sbi sbm${moreOn?' on':''}" data-more aria-haspopup="menu" aria-expanded="false">${ic('more')}<span>${L('More','Meer')}</span></button>
        <button type="button" class="sbsec${st.themes?' open':''}" data-fold="themes" aria-expanded="${st.themes}"><span>${L('Climate themes','Klimaatthema\'s')}</span>${ic('chev')}</button>
        ${st.themes?themes.map(x=>it('#m-'+x.nr,dot(x.nr),esc(t(x)),'m-'+x.nr,(x.sub||[]).length?'th':'th soon')).join(''):''}
      </div>
`;
    bindSearch();
  }

  // ---- top bar
  function topbar(r){
    let where;
    if(r.v==='m'){ const p=NODES[r.page].n, par=NODES[r.page].parent; where=[L('Methodology','Methodiek')].concat(par?[t(par)]:[]).concat([t(p)]); }
    else if(r.v==='maatregelen') where=[L('Measure table','Maatregelentabel')];
    else where=[pageTitle(r.v)];
    $('mtop').innerHTML=`<div class="mtl"><button type="button" class="ib sbopenbtn" data-sbtoggle title="${st.sbHidden?L('Show the sidebar','Zijbalk tonen'):L('Hide the sidebar','Zijbalk verbergen')}" aria-label="${st.sbHidden?L('Show the sidebar','Zijbalk tonen'):L('Hide the sidebar','Zijbalk verbergen')}">${ic('menu')}</button>
        <button type="button" class="ib" data-hist="-1" title="${L('Back','Terug')}" aria-label="${L('Back','Terug')}">${ic('back')}</button><button type="button" class="ib" data-hist="1" title="${L('Forward','Vooruit')}" aria-label="${L('Forward','Vooruit')}">${ic('fwd')}</button>
        <span class="mtw">${where.map(esc).join(' <span>›</span> ')}</span></div>
      <div class="mtr"><a class="tbl${r.v==='contact'?' on':''}" href="#contact">${ic('mail')}<span>Contact</span></a><button type="button" class="tbl" data-lang="${NL()?'en':'nl'}" lang="${NL()?'en':'nl'}">${ic('globe')}<span>${NL()?'English':'Nederlands'}</span></button><button type="button" class="ib" data-print title="${L('Print','Afdrukken')}" aria-label="${L('Print','Afdrukken')}">${ic('print')}</button><a class="dgbc" href="https://www.dgbc.nl" target="_blank" rel="noopener" title="${L('An initiative of Dutch Green Building Council','Een initiatief van Dutch Green Building Council')}"><img src="assets/img/afbeelding-02.png" alt="Dutch Green Building Council"></a></div>`;
  }

  // ---- pages
  const docw=(inner)=>`<div class="docw"><div class="docm">${inner}</div><nav class="toc2" id="toc2" aria-label="${L('On this page','Op deze pagina')}"></nav></div>`;
  function section(o,lvl){
    const tag='h'+Math.min(lvl,4);
    const ph=!(o.sub||[]).length&&!/<(p|ul|ol|table)\b/i.test(h(o)) ? '' : '';
    return `<${tag} id="${sid(o.nr)}" class="fd${lvl}"><span class="fdn">${o.nr}</span> ${esc(t(o))}</${tag}>${h(o)}${ph}${(o.sub||[]).map(x=>section(x,lvl+1)).join('')}`;
  }
  function pnav(nr){
    const MAIN=['1','2','3','4'], k=MAIN.indexOf(nr); if(k<0) return '';
    const p=k>0?MAIN[k-1]:null, n=k<MAIN.length-1?MAIN[k+1]:null;
    const nm=x=>({'1':L('Introduction','Introductie'),'2':L('Methodology','Methodologie'),'3':L('Assessment','Beoordeling'),'4':L('Adaptation','Adaptatie')})[x];
    const prev=p?`<a class="pv" href="#m-${p}">${ic('back')}<span>${esc(nm(p))}</span></a>`:'<span></span>';
    const next=n?`<a class="nx" href="#m-${n}"><small>${L('Next','Volgende')}</small><b>${esc(nm(n))}${ic('fwd')}</b></a>`:'';
    return `<nav class="pnav" aria-label="${L('Chapters','Hoofdstukken')}">${prev}${next}</nav>`;
  }
  function methodPage(nr){
    const o=NODES[nr].n, par=NODES[nr].parent;
    let body=`<h1>${esc(t(o))}</h1><div class="prose">${h(o)}`;
    if(nr==='3'){
      // the climate themes are pages of their own: show them as entries
      body+=`</div><ul class="tlist">${(o.sub||[]).map(x=>`<li><a href="#m-${x.nr}"><i class="dot" style="background:${THEMECOL[x.nr]||'var(--text3)'}"></i><b>${esc(t(x))}</b><span>${esc(themeDesc(x.nr))}</span>${ic('fwd')}</a></li>`).join('')}</ul>`;
    } else {
      body+=(o.sub||[]).map(x=>section(x,isThemePage(nr)?3:2)).join('')+'</div>';
    }
    return docw(body+pnav(nr));
  }
  const THEMEDESC={'3.1':['Overheating of the building and heat stress on warm days and nights.','Oververhitting van het gebouw en hittestress op warme dagen en nachten.'],
    '3.2':['Foundation damage from pile rot and differential settlement, and the risk of wildfire.','Funderingsschade door paalrot en verschilzetting en de kans op natuurbrand.'],
    '3.3':['Water nuisance from extreme rainfall and from high groundwater.','Wateroverlast door extreme regen en door hoog grondwater.'],
    '3.4':['Water from rivers or the sea after a dike breach.','Water uit rivieren of de zee na een dijkdoorbraak.'],
    '3.5':['Being developed.','In ontwikkeling.'],'3.6':['Being developed.','In ontwikkeling.']};
  const themeDesc=nr=>THEMEDESC[nr]?L(THEMEDESC[nr][0],THEMEDESC[nr][1]):'';
  function homePage(){
    const p=PAGES.home;
    const GO=[['#m-1','flag',L('Introduction','Introductie'),L('Why FCAB exists, what it aims for and which buildings it covers.','Waarom FCAB bestaat, wat het wil bereiken en voor welke gebouwen.')],
      ['#m-2','layers',L('Methodology','Methodologie'),L('Concepts, climate hazards, scenarios and how the methodology is built.','Begrippen, klimaatdreigingen, scenario\'s en de opbouw van de methodiek.')],
      ['#m-3','gauge',L('Assessment','Beoordeling'),L('The vulnerability score of a building per climate theme.','Per klimaatthema de kwetsbaarheidsscore van een gebouw.')],
      ['#m-4','shield',L('Adaptation','Adaptatie'),L('In-depth analysis and an adaptation plan for buildings at high risk.','Verdiepende analyse en een adaptatieplan voor gebouwen met een hoog risico.')],
      ['#maatregelen','table',L('Measure table','Maatregelentabel'),L('Adaptation measures per climate theme, searchable and filterable.','Adaptatiemaatregelen per klimaatthema, doorzoekbaar en te filteren.')],
      ['#faq','help',pageTitle('faq'),L('Answers to common questions about FCAB.','Antwoorden op veelgestelde vragen over FCAB.')]];
    const cards=`<h2>${L('Go directly to','Ga direct naar')}</h2><ul class="tlist go">${GO.map(g=>`<li><a href="${g[0]}">${ic(g[1])}<b>${esc(g[2])}</b><span>${esc(g[3])}</span>${ic('fwd')}</a></li>`).join('')}</ul>`;
    if(p) return `<h1>Framework for Climate Adaptive Buildings</h1><div class="prose home">${h(p)}</div>${cards}`;
    return `<h1>Framework for Climate Adaptive Buildings</h1><p class="lead">${L('The FCAB methodology online: determine the climate risks of buildings and draw up an adaptation strategy.','De FCAB-methodiek online: bepaal de klimaatrisico\'s van gebouwen en stel een adaptatiestrategie op.')}</p>${cards}`;
  }
  function textPage(k){
    const p=PAGES[k];
    if(!p) return `<h1>${esc(pageTitle(k))}</h1><p class="ph">${L('This page is being moved to the new environment.','Deze pagina wordt naar de nieuwe omgeving overgezet.')}</p>`;
    const body=h(p), hasH1=/<h1\b/i.test(body);
    const inner=`${hasH1?'':`<h1>${esc(pageTitle(k))}</h1>`}<div class="prose${k==='faq'?' faq':''}">${body}</div>`;
    return /<h2\b/i.test(body)?docw(inner):inner;
  }
  // measure table with search and a filter on the first column with few distinct values
  const ms={q:'',theme:'',cat:''};
  // a cell is {nl,en}, a plain value, or true/false
  function mcell(row,key){
    const v=row[key];
    if(v===true) return L('yes','ja'); if(v===false) return '';
    if(v&&typeof v==='object') return (NL()?v.nl:(v.en||v.nl))||'';
    return v==null?'':v;
  }
  // filters: climate theme and type of measure; rows are grouped by type (a header row per type)
  const FKEYS=[['theme',()=>L('climate themes','klimaatthema\'s')],['cat',()=>L('types of measure','soorten maatregelen')]];
  const vals=key=>[...new Set((MEAS.rows||[]).map(r=>String(mcell(r,key))).filter(Boolean))];
  function measuresPage(){
    if(!MEAS) return `<h1>${L('Measure table','Maatregelentabel')}</h1><p class="ph">${L('The measure table is being moved to the new environment.','De maatregelentabel wordt naar de nieuwe omgeving overgezet.')}</p>`;
    const cols=(MEAS.columns||[]).filter(c=>c.key!=='cat'), ct=c=>NL()?c.t_nl:(c.t_en||c.t_nl);
    const sel=(key,lab)=>(MEAS.columns||[]).some(c=>c.key===key)?`<select data-mf="${key}" aria-label="${esc(lab)}"><option value="">${L('All','Alle')} ${esc(lab)}</option>${vals(key).sort((a,b)=>a.localeCompare(b)).map(v=>`<option${ms[key]===v?' selected':''}>${esc(v)}</option>`).join('')}</select>`:'';
    return `<h1>${L('Measure table','Maatregelentabel')}</h1>
      <div class="prose">${NL()?(MEAS.intro_nl||''):(MEAS.intro_en||MEAS.intro_nl||'')}</div>
      <div class="mfil"><input id="mq" type="search" placeholder="${L('Search measures','Zoek maatregelen')}" value="${esc(ms.q)}" aria-label="${L('Search measures','Zoek maatregelen')}">
        ${FKEYS.map(([k,f])=>sel(k,f())).join('')}
        <span class="cnt" id="mcnt"></span>
        ${MEAS.xlsx?`<a class="btn" href="${esc(MEAS.xlsx)}" download>${ic('dl')}Excel</a>`:''}</div>
      <div class="wrap"><table class="t mt"><thead><tr>${cols.map(c=>`<th class="c-${c.key}">${esc(ct(c))}</th>`).join('')}</tr></thead><tbody id="mbody"></tbody></table></div>`;
  }
  const CLAMP=['benefits','attention'];
  function fillMeasures(){
    const tb=$('mbody'); if(!tb) return;
    const cols=(MEAS.columns||[]).filter(c=>c.key!=='cat'), q=ms.q.trim().toLowerCase(), all=MEAS.rows||[];
    const list=all.filter(r=>FKEYS.every(([k])=>!ms[k]||String(mcell(r,k))===ms[k])&&(!q||(MEAS.columns||[]).some(c=>plain(String(mcell(r,c.key))).toLowerCase().includes(q))));
    let html='', prev=null;
    list.forEach(r=>{ const g=String(mcell(r,'cat')); if(g&&g!==prev){ html+=`<tr class="grp"><th colspan="${cols.length}">${esc(g)}</th></tr>`; prev=g; }
      html+=`<tr>${cols.map(c=>`<td class="c-${c.key}">${CLAMP.includes(c.key)?`<div class="clamp">${mcell(r,c.key)}</div>`:mcell(r,c.key)}</td>`).join('')}</tr>`; });
    tb.innerHTML=html||`<tr><td colspan="${cols.length}">${L('No measures found.','Geen maatregelen gevonden.')}</td></tr>`;
    tb.querySelectorAll('.clamp').forEach(el=>{ if(el.scrollHeight>el.clientHeight+2&&!el.closest('tr').querySelector('[data-rm]')) el.insertAdjacentHTML('afterend',`<button type="button" class="rm" data-rm>${L('Read more','Lees meer')}</button>`); });
    $('mcnt').textContent=`${list.length} ${L('of','van')} ${all.length}`;
  }

  // ---- search over methodology, pages and measures
  const plain=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
  function index(){
    const out=[];
    Object.values(NODES).forEach(({n})=>out.push({href:'#m-'+n.nr,title:n.nr+' '+t(n),text:plain(h(n))}));
    Object.keys(PAGES).forEach(k=>out.push({href:'#'+k,title:pageTitle(k),text:plain(h(PAGES[k]))}));
    if(MEAS) (MEAS.rows||[]).forEach(r=>{ const tx=(MEAS.columns||[]).map(c=>plain(String(mcell(r,c.key)))).join(' · '); out.push({href:'#maatregelen',title:L('Measure','Maatregel')+': '+tx.slice(0,70),text:tx,meas:tx}); });
    return out;
  }
  function bindSearch(){
    const q=$('q'), box=$('qres'); if(!q) return;
    q.addEventListener('input',()=>{
      const s=q.value.trim().toLowerCase(); if(s.length<2){ box.hidden=true; return; }
      const hits=index().map(x=>{ const it=x.title.toLowerCase().includes(s)?2:0, k=x.text.toLowerCase().indexOf(s); return {x,score:it+(k>=0?1:0),k}; }).filter(o=>o.score>0).sort((a,b)=>b.score-a.score).slice(0,14);
      box.innerHTML=hits.length?hits.map(({x,k})=>`<a href="${x.href}" data-q="${esc(x.meas?q.value.trim():'')}">${esc(x.title)}${k>=0?`<small>…${esc(x.text.slice(Math.max(0,k-40),k+80))}…</small>`:''}</a>`).join(''):`<p>${L('Nothing found.','Niets gevonden.')}</p>`;
      box.hidden=false;
    });
    q.addEventListener('keydown',e=>{ if(e.key==='Escape'){ q.value=''; box.hidden=true; } if(e.key==='Enter'){ const a=box.querySelector('a'); if(a) a.click(); } });
    box.addEventListener('click',e=>{ const a=e.target.closest('a'); if(a&&a.dataset.q) ms.q=a.dataset.q; box.hidden=true; });
  }

  // ---- chapter menu (same behaviour as the Climate Risk Tool)
  function buildToc(){
    const nav=$('toc2'); if(!nav) return;
    const hs=[...document.querySelectorAll('.docm h2, .docm h3')];
    if(hs.length<2){ nav.remove(); document.querySelector('.docw').style.gridTemplateColumns='minmax(0,1fr)'; return; }
    hs.forEach((x,k)=>{ if(!x.id) x.id='h'+k; });
    const lvl2=hs.some(x=>x.tagName==='H2');
    nav.innerHTML=`<button type="button" class="tct" data-fsopen title="${L('Search on this page','Zoek op deze pagina')}"><span>${L('On this page','Op deze pagina')}</span>${ic('search')}</button>
      <div class="tcs" hidden>${ic('search')}<input id="fs" type="search" autocomplete="off" placeholder="${L('Search on this page','Zoek op deze pagina')}" aria-label="${L('Search on this page','Zoek op deze pagina')}"><span id="fsn"></span><button type="button" class="fsb" data-fs="-1" aria-label="${L('Previous match','Vorige treffer')}">${ic('up')}</button><button type="button" class="fsb" data-fs="1" aria-label="${L('Next match','Volgende treffer')}">${ic('down')}</button><button type="button" class="fsb" data-fsclose aria-label="${L('Close search','Zoeken sluiten')}">${ic('x')}</button></div>`+hs.map(x=>`<a href="#" class="${lvl2&&x.tagName==='H3'?'t3':''}" data-toc="${x.id}">${esc(x.textContent.trim())}</a>`).join('');
    tocSpy();
  }
  function tocSpy(){
    const nav=$('toc2'); if(!nav) return;
    const top=$('view').getBoundingClientRect().top+40; let cur=null;
    nav.querySelectorAll('a').forEach(a=>{ const x=document.getElementById(a.dataset.toc); if(x&&x.getBoundingClientRect().top<=top) cur=x.id; });
    if(!cur){ const f=nav.querySelector('a'); cur=f&&f.dataset.toc; }
    nav.querySelectorAll('a').forEach(a=>a.classList.toggle('on',a.dataset.toc===cur));
  }

  // ---- search within the page: mark the matches in the text, step through them
  const fs={hits:[],k:-1};
  function fsClear(){ document.querySelectorAll('mark.fm').forEach(m=>{ const p=m.parentNode; p.replaceChild(document.createTextNode(m.textContent),m); p.normalize(); }); fs.hits=[]; fs.k=-1; }
  function fsRun(q){
    fsClear(); const n=$('fsn'); q=(q||'').trim();
    if(q.length<2){ if(n) n.textContent=''; return; }
    const root=document.querySelector('.docm'); if(!root) return;
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:x=>x.parentElement.closest('select,option,script,.calc .cfs')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
    const nodes=[]; while(w.nextNode()) nodes.push(w.currentNode);
    const ql=q.toLowerCase();
    nodes.forEach(t=>{ const txt=t.nodeValue, low=txt.toLowerCase(); let i=low.indexOf(ql); if(i<0) return;
      const frag=document.createDocumentFragment(); let last=0;
      while(i>=0){ frag.appendChild(document.createTextNode(txt.slice(last,i))); const m=document.createElement('mark'); m.className='fm'; m.textContent=txt.slice(i,i+q.length); frag.appendChild(m); fs.hits.push(m); last=i+q.length; i=low.indexOf(ql,last); }
      frag.appendChild(document.createTextNode(txt.slice(last))); t.parentNode.replaceChild(frag,t); });
    if(n) n.textContent=fs.hits.length?'':'0';
    if(fs.hits.length) fsGo(1);
  }
  function fsGo(d){
    if(!fs.hits.length) return;
    if(fs.k>=0) fs.hits[fs.k].classList.remove('on');
    fs.k=(fs.k+d+fs.hits.length)%fs.hits.length;
    const m=fs.hits[fs.k]; m.classList.add('on'); m.scrollIntoView({block:'center'});
    $('fsn').textContent=`${fs.k+1}/${fs.hits.length}`;
  }
  function fsOpen(on){
    const nav=$('toc2'); if(!nav) return;
    nav.querySelector('.tct').hidden=on; nav.querySelector('.tcs').hidden=!on;
    if(on) $('fs').focus(); else { fsClear(); $('fs').value=''; $('fsn').textContent=''; }
  }

  // ---- render
  let last='';
  function render(){
    const r=parse();
    document.title=(r.v==='m'?`${t(NODES[r.page].n)} · `:r.v==='home'?'':`${r.v==='maatregelen'?L('Measure table','Maatregelentabel'):pageTitle(r.v)} · `)+'Framework for Climate Adaptive Buildings';
    $('app').classList.toggle('nosb',st.sbHidden);
    sidebar(r); topbar(r);
    const key=r.v==='m'?'m-'+r.page:r.v;
    $('view').innerHTML=r.v==='m'?methodPage(r.page):r.v==='maatregelen'?measuresPage():r.v==='home'?homePage():textPage(r.v);
    if(r.v==='maatregelen') fillMeasures();
    if(r.v==='m'&&G.FCAB_GS) G.FCAB_GS.enhance(r.page);
    buildToc();
    // scroll: to the section of the route, or to the top for a new page
    const target=r.v==='m'&&r.nr!==r.page?document.getElementById(sid(r.nr)):null;
    if(target) target.scrollIntoView({block:'start'}); else if(key!==last) $('view').scrollTop=0;
    last=key;
  }

  // ---- events
  document.addEventListener('click',e=>{
    const el=e.target.closest('[data-sbtoggle],[data-hist],[data-lang],[data-toc],[data-print],[data-fold],[data-more],[data-rm],[data-fsopen],[data-fs],[data-fsclose]'); if(!el) return;
    if(el.hasAttribute('data-rm')){ const tr=el.closest('tr'), open=!tr.classList.contains('open'); tr.classList.toggle('open',open); tr.querySelectorAll('[data-rm]').forEach(b=>b.textContent=open?L('Read less','Minder'):L('Read more','Lees meer')); return; }
    if(el.dataset.fold==='3'){ st.open3=!st.open3; try{ localStorage.setItem('fcab-open3',st.open3?'1':'0'); }catch(x){} sidebar(parse()); return; }
    if(el.dataset.fold==='themes'){ st.themes=!st.themes; try{ localStorage.setItem('fcab-themes',st.themes?'1':'0'); }catch(x){} sidebar(parse()); return; }
    if(el.hasAttribute('data-more')){ morePop(el.getAttribute('aria-expanded')==='true'?null:el); return; }
    if(el.hasAttribute('data-fsopen')){ fsOpen(true); return; }
    if(el.hasAttribute('data-fsclose')){ fsOpen(false); return; }
    if(el.dataset.fs){ fsGo(+el.dataset.fs); return; }
    if(el.dataset.toc){ e.preventDefault(); const x=document.getElementById(el.dataset.toc); if(x) x.scrollIntoView({behavior:'smooth',block:'start'}); return; }
    if(el.dataset.hist){ history.go(+el.dataset.hist); return; }
    if(el.dataset.print!==undefined){ window.print(); return; }
    if(el.dataset.lang){ LG.set(el.dataset.lang); render(); return; }
    if(el.hasAttribute('data-sbtoggle')){
      if(matchMedia('(max-width:900px)').matches){ $('app').classList.toggle('sbopen'); return; }
      st.sbHidden=!st.sbHidden; try{ localStorage.setItem('fcab-sb',st.sbHidden?'0':'1'); }catch(x){}
      render();
    }
  });
  // clicking Beoordeling itself also opens its climate themes
  document.addEventListener('click',e=>{ const a=e.target.closest('.sbg > a.sbi'); if(a&&!st.open3){ st.open3=true; try{ localStorage.setItem('fcab-open3','1'); }catch(x){} } });
  document.addEventListener('input',e=>{
    if(e.target.id==='mq'){ ms.q=e.target.value; fillMeasures(); }
    if(e.target.id==='fs') fsRun(e.target.value);
  });
  document.addEventListener('change',e=>{ const k=e.target.dataset&&e.target.dataset.mf; if(k){ ms[k]=e.target.value; fillMeasures(); } });
  // close the sidebar overlay on a narrow screen when clicking outside it
  document.addEventListener('click',e=>{ if($('app').classList.contains('sbopen')&&!e.target.closest('.sb,[data-sbtoggle]')) $('app').classList.remove('sbopen'); });
  document.addEventListener('keydown',e=>{ if(e.target.id!=='fs') return; if(e.key==='Enter'){ e.preventDefault(); fsGo(e.shiftKey?-1:1); } if(e.key==='Escape') fsOpen(false); });
  // close the More menu on a click elsewhere, Escape, or a new page
  document.addEventListener('click',e=>{ if(!e.target.closest('#morepop,[data-more]')) morePop(null); else if(e.target.closest('#morepop a')) morePop(null); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') morePop(null); });
  window.addEventListener('resize',()=>morePop(null));
  window.addEventListener('hashchange',()=>{ $('app').classList.remove('sbopen'); render(); });
  $('view').addEventListener('scroll',()=>{ if($('toc2')) requestAnimationFrame(tocSpy); },{passive:true});

  let started=false;
  G.FCAB_APP={start(){ if(started) return; started=true; render(); }};
  if(!$('app').hidden) G.FCAB_APP.start();
})(window);
