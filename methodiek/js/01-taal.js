/* Language (Dutch and English): L(en, nl) for texts in the code; tx(object, field) takes field_nl / field_en.
   The choice is kept in localStorage 'fcab-lang'; without a choice Dutch, or English when the browser is not Dutch. */
(function(G){
  let lang='nl';
  try{ const s=localStorage.getItem('fcab-lang'); lang=s||((navigator.language||'nl').toLowerCase().startsWith('nl')?'nl':'en'); }catch(e){}
  G.FCAB_LANG={
    get lang(){ return lang; },
    set(l){ lang=l==='en'?'en':'nl'; try{ localStorage.setItem('fcab-lang',lang); }catch(e){} document.documentElement.lang=lang; },
    L:(en,nl)=>lang==='nl'?nl:en,
  };
  document.documentElement.lang=lang;
})(window);
