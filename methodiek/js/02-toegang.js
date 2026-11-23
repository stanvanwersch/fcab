/* Access gate: the environment is shielded with an access code (checked against a SHA-256 hash, as before).
   Once opened it stays open in this browser (localStorage 'fcab_gate_ok', the same key as the earlier version). */
(function(G){
  const GATE_HASH='73e2822498c988475f994d5cbc7348677198694cb01830ef3182527acd0f6d0e';
  const $=id=>document.getElementById(id), L=(en,nl)=>G.FCAB_LANG.L(en,nl);
  async function sha256Hex(str){
    const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  function open(){ $('gate').hidden=true; $('app').hidden=false; if(G.FCAB_APP) G.FCAB_APP.start(); }
  async function check(){
    if(await sha256Hex($('gate-input').value)===GATE_HASH){ try{ localStorage.setItem('fcab_gate_ok','1'); }catch(e){} $('gate-error').classList.remove('on'); open(); }
    else $('gate-error').classList.add('on');
  }
  function texts(){
    $('gate-input').placeholder=L('Access code','Toegangscode');
    $('gate-btn').textContent=L('Unlock','Ontgrendelen');
    $('gate-error').textContent=L('Wrong code. Please try again.','Onjuiste code. Probeer het opnieuw.');
    $('gate-legal').textContent=L('This environment is shielded for now. Enter the access code to continue.','Deze omgeving is momenteel afgeschermd. Voer de toegangscode in om verder te gaan.');
    $('gate-foot').textContent=L('Developed by Dutch Green Building Council','Ontwikkeld door Dutch Green Building Council');
  }
  $('gate-btn').addEventListener('click',check);
  $('gate-input').addEventListener('keydown',e=>{ if(e.key==='Enter') check(); });
  let ok=false; try{ ok=localStorage.getItem('fcab_gate_ok')==='1'; }catch(e){}
  G.FCAB_GATE={isOpen:()=>ok||!$('app').hidden};
  if(ok){ $('app').hidden=false; } else { texts(); $('gate').hidden=false; setTimeout(()=>$('gate-input').focus(),0); }
})(window);
