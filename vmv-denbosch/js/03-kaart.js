/* VMV-kaartviewer Den Bosch: inloggen, kaart, waterdieptekaart, panden, legenda en instellingen. Alleen licht. */
(function(){
  var C = window.VMV_CONFIG;
  var LABELS = C.klassen.map(function(k){ return k.label; });
  var ORDER = {}; LABELS.forEach(function(l, i){ ORDER[l] = i; });
  var KLEUR_KEY = "vmv-db-kleuren", WATER_KEY = "vmv-db-waterkleuren";
  var STD_PANDEN = C.klassen.map(function(k){ return k.kleur; });
  var STD_WATER = C.kaartlaag.klassen.map(function(k){ return k.kleur; });

  var PRESETS = [
    { naam: "Groen → rood", kleuren: STD_PANDEN },
    { naam: "Grijs → paars", kleuren: ["#d1d5db", "#c4b5fd", "#a78bfa", "#7c3aed", "#5b21b6", "#2e1065"] }
  ];

  var kleuren = laadKleuren(KLEUR_KEY, STD_PANDEN);
  var waterKleuren = laadKleuren(WATER_KEY, STD_WATER);
  var data = [], gefilterd = [];
  var activeEffect = C.effecten[0].key, activeFilter = "all";
  var map = null, waterLaag = null, pandenLaag = null, detailRij = null;
  var tegelSet = {};
  (window.VMV_TEGELS || "").split(" ").forEach(function(t){ if (t) tegelSet[t] = 1; });

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]; }); }

  /* ---------- kleuren ---------- */
  function laadKleuren(key, std){
    try {
      var s = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(s) && s.length === std.length) return s;
    } catch(e){}
    return std.slice();
  }
  function bewaarKleuren(){
    try {
      localStorage.setItem(KLEUR_KEY, JSON.stringify(kleuren));
      localStorage.setItem(WATER_KEY, JSON.stringify(waterKleuren));
    } catch(e){}
  }
  function kleurVan(score){
    return ORDER[score] !== undefined ? kleuren[ORDER[score]] : C.onbekendKleur;
  }
  function hexRgb(h){
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // Tekstkleur die leesbaar is op de gegeven achtergrond
  function tekstOp(h){
    var c = hexRgb(h); return (c[0]*299 + c[1]*587 + c[2]*114) / 1000 > 150 ? "#1c1a17" : "#ffffff";
  }

  // De tegels hebben per pixel grijswaarde k*32+16 voor klasse k (1..5). Een 'discrete' tabel met 8 vakken
  // zet elke klasse om naar de kleur van de kaartlaag (waterKleuren[k-1]).
  function zetFilter(){
    var tabel = [[], [], []];
    for (var k = 0; k < 8; k++){
      var rgb = (k >= 1 && k <= waterKleuren.length) ? hexRgb(waterKleuren[k - 1]) : [0, 0, 0];
      for (var c = 0; c < 3; c++) tabel[c].push((rgb[c] / 255).toFixed(4));
    }
    ["R", "G", "B"].forEach(function(ch, c){
      $("water-func" + ch).setAttribute("tableValues", tabel[c].join(" "));
    });
  }

  /* ---------- inloggen ---------- */
  function tryLogin(){
    var code = $("code-input").value.trim().toUpperCase();
    var digest = sha256(new TextEncoder().encode(code));
    if (bytesToHex(digest) !== C.codeHash){ toonFout(); return; }
    try {
      data = vmvOntsleutel(window.VMV_PANDEN, digest);
    } catch(e){ toonFout(); return; }
    $("login-error").style.display = "none";
    $("code-input").style.borderColor = "";
    $("login-screen").style.display = "none";
    $("app").style.display = "flex";
    startKaart();
  }
  function toonFout(){
    $("login-error").style.display = "block";
    $("code-input").style.borderColor = "#b91c1c";
  }
  function logout(){
    data = []; gefilterd = [];
    $("app").style.display = "none";
    $("login-screen").style.display = "flex";
    $("code-input").value = "";
    if (map){ map.remove(); map = null; }
  }

  /* ---------- kaart ---------- */
  var WaterLaag = L.TileLayer.extend({
    createTile: function(coords, done){
      var key = coords.z + "/" + coords.x + "/" + coords.y;
      if (!tegelSet[key]){
        var leeg = document.createElement("div");
        setTimeout(function(){ done(null, leeg); }, 0);
        return leeg;
      }
      return L.TileLayer.prototype.createTile.call(this, coords, done);
    }
  });

  function startKaart(){
    if (map){ map.remove(); map = null; }
    map = L.map("map", { zoomControl: true }).setView(C.centrum, C.zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors", maxZoom: 19
    }).addTo(map);

    map.createPane("water");
    map.getPane("water").style.zIndex = 350;
    var kl = C.kaartlaag;
    waterLaag = new WaterLaag(kl.tegels, {
      pane: "water", minZoom: kl.minZoom, maxNativeZoom: kl.maxNativeZoom, maxZoom: 19,
      bounds: L.latLngBounds(kl.grenzen), opacity: kl.dekking,
      attribution: kl.naam + " Den Bosch"
    });
    waterLaag.addTo(map);
    pandenLaag = L.layerGroup().addTo(map);

    filter();
  }

  function slechtste(row){
    var m = -1;
    C.effecten.forEach(function(e){ var s = ORDER[row[e.key]]; if (s !== undefined && s > m) m = s; });
    return m;
  }

  function filter(){
    gefilterd = data.filter(function(row){
      if (activeFilter === "hoog" && slechtste(row) < 4) return false;
      if (activeFilter === "zeerhoog" && slechtste(row) < 5) return false;
      return true;
    });
    $("rec-count").textContent = gefilterd.length + " panden zichtbaar";
    tekenPanden();
  }

  function tekenPanden(){
    if (!pandenLaag) return;
    pandenLaag.clearLayers();
    gefilterd.forEach(function(row){
      var score = row[activeEffect] || "Onbekend";
      var rand = (ORDER[score] >= 4) ? "#1c1a17" : "#ffffff";
      var icon = L.divIcon({
        className: "",
        html: "<div style=\"width:12px;height:12px;border-radius:50%;background:" + kleurVan(score) + ";border:1.5px solid " + rand + ";box-shadow:0 1px 3px rgba(0,0,0,.4)\"></div>",
        iconSize: [12, 12], iconAnchor: [6, 6]
      });
      var m = L.marker([row.lat, row.lon], { icon: icon, title: adres(row) });
      m.on("click", function(){ toonDetail(row); map.setView([row.lat, row.lon], Math.max(map.getZoom(), 16)); });
      pandenLaag.addLayer(m);
    });
  }

  function adres(row){
    return (row.straatnaam + " " + row.huisnummer + (row.toevoeging || "")).trim();
  }

  function pill(score){
    var bg = kleurVan(score);
    return "<span class=\"si-score\" style=\"background:" + bg + ";color:" + tekstOp(bg) + "\">" + esc(score) + "</span>";
  }

  /* ---------- zijpaneel ---------- */
  function zoek(){
    sluitDetail();
    var q = $("search-input").value.trim().toLowerCase();
    var res = $("search-results"), cnt = $("search-result-count");
    if (q.length < 2){
      res.innerHTML = "<div class=\"search-hint\">Typ een adres, functie of postcode om te zoeken.<br><br>Je kunt ook op een pand op de kaart klikken om de details te bekijken.</div>";
      cnt.textContent = ""; return;
    }
    var hits = data.filter(function(row){
      return [row.objectfunctie, row.straatnaam, row.huisnummer, row.toevoeging, row.postcode, row.plaatsnaam, row.objectnummer]
        .join(" ").toLowerCase().indexOf(q) !== -1;
    }).slice(0, 60);
    cnt.textContent = hits.length ? hits.length + " resultaten" : "Geen resultaten";
    window._vmvHits = hits;
    res.innerHTML = hits.length ? hits.map(function(row, i){
      return "<div class=\"search-item\" data-idx=\"" + i + "\"><div class=\"si-name\">" + esc(adres(row)) + "</div>" +
        "<div class=\"si-addr\">" + esc(row.objectfunctie) + "</div>" + pill(row[activeEffect] || "Onbekend") + "</div>";
    }).join("") : "<div class=\"search-hint\">Geen resultaten gevonden.</div>";
  }

  function toonDetail(row){
    detailRij = row;
    $("d-name").textContent = adres(row);
    $("d-addr").textContent = ((row.postcode || "") + " " + (row.plaatsnaam || "")).trim() + (row.bouwjaar ? " · Bouwjaar: " + row.bouwjaar : "");
    var extra = [row.objectfunctie, (row.objectkenmerk && row.objectkenmerk !== "Geen monument") ? row.objectkenmerk : ""].filter(Boolean).join(" · ");
    $("d-functie").textContent = extra;
    $("d-functie").style.display = extra ? "" : "none";
    $("d-grid").innerHTML = C.effecten.map(function(e){
      var v = row[e.key] || "Onbekend";
      return "<div class=\"detail-effect\"><div class=\"de-label\">" + esc(e.label) + "</div>" + pill(v) + "</div>";
    }).join("");
    $("search-results").style.display = "none";
    $("detail-panel").classList.add("open");
  }
  function sluitDetail(){
    $("detail-panel").classList.remove("open");
    $("search-results").style.display = "";
  }

  /* ---------- legenda ---------- */
  function tekenLegenda(){
    $("legend-items").innerHTML = LABELS.map(function(l, i){
      return "<div class=\"legend-item\"><div class=\"legend-dot\" style=\"background:" + kleuren[i] + "\"></div>" + l + "</div>";
    }).join("") +
      "<div class=\"legend-item\"><div class=\"legend-dot\" style=\"background:" + C.onbekendKleur + "\"></div>Onbekend</div>";
    $("legend-water").innerHTML = C.kaartlaag.klassen.map(function(k, i){
      return "<div class=\"legend-item\"><div class=\"legend-sq\" style=\"background:" + waterKleuren[i] + "\"></div>" + esc(k.label) + "</div>";
    }).join("");
  }

  /* ---------- instellingen ---------- */
  function tekenInstellingen(){
    $("kleur-rijen").innerHTML = LABELS.map(function(l, i){
      return "<label class=\"color-row\"><span>" + l + "</span><code>" + kleuren[i] + "</code>" +
        "<input type=\"color\" data-i=\"" + i + "\" value=\"" + kleuren[i] + "\"></label>";
    }).join("");
    $("water-rijen").innerHTML = C.kaartlaag.klassen.map(function(k, i){
      return "<label class=\"color-row\"><span>" + esc(k.label) + "</span><code>" + waterKleuren[i] + "</code>" +
        "<input type=\"color\" data-w=\"" + i + "\" value=\"" + waterKleuren[i] + "\"></label>";
    }).join("");
    $("preset-rij").innerHTML = PRESETS.map(function(p, i){
      return "<button type=\"button\" class=\"filter-btn preset-btn\" data-p=\"" + i + "\"><span class=\"preset-swatch\">" +
        p.kleuren.map(function(k){ return "<i style=\"background:" + k + "\"></i>"; }).join("") + "</span>" + p.naam + "</button>";
    }).join("");
  }
  function kleurenGewijzigd(){
    bewaarKleuren(); zetFilter(); tekenLegenda();
    if (map) tekenPanden();
    if (detailRij && $("detail-panel").classList.contains("open")) toonDetail(detailRij);
    else if ($("search-input").value.trim().length >= 2) zoek();
  }

  /* ---------- start ---------- */
  document.addEventListener("DOMContentLoaded", function(){
    zetFilter(); tekenLegenda(); tekenInstellingen();

    // Legenda inklapbaar; de stand blijft bewaard
    function zetLegenda(dicht){
      $("legend").classList.toggle("dicht", dicht);
      $("legend-toggle").setAttribute("aria-expanded", dicht ? "false" : "true");
    }
    try { zetLegenda(localStorage.getItem("vmv-db-legenda") === "dicht"); } catch(e){}
    $("legend-toggle").addEventListener("click", function(){
      var dicht = !$("legend").classList.contains("dicht");
      zetLegenda(dicht);
      try { localStorage.setItem("vmv-db-legenda", dicht ? "dicht" : "open"); } catch(e){}
    });

    $("login-btn").addEventListener("click", tryLogin);
    $("code-input").addEventListener("keydown", function(e){ if (e.key === "Enter") tryLogin(); });
    $("logout-btn").addEventListener("click", logout);
    $("search-input").addEventListener("input", zoek);
    $("detail-close").addEventListener("click", sluitDetail);
    $("search-results").addEventListener("click", function(e){
      var it = e.target.closest(".search-item");
      if (!it || !window._vmvHits) return;
      var row = window._vmvHits[+it.dataset.idx];
      map.setView([row.lat, row.lon], 17);
      toonDetail(row);
    });
    $("filter-row").addEventListener("click", function(e){
      var b = e.target.closest(".filter-btn"); if (!b) return;
      document.querySelectorAll("#filter-row .filter-btn").forEach(function(x){ x.classList.remove("on"); });
      b.classList.add("on"); activeFilter = b.dataset.filter; filter();
    });

    $("settings-btn").addEventListener("click", function(){ $("settings").classList.add("open"); });
    $("settings-close").addEventListener("click", function(){ $("settings").classList.remove("open"); });
    $("settings").addEventListener("click", function(e){ if (e.target === this) this.classList.remove("open"); });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape") $("settings").classList.remove("open"); });
    $("kleur-rijen").addEventListener("input", function(e){
      var i = e.target.dataset.i; if (i === undefined) return;
      kleuren[+i] = e.target.value;
      e.target.previousElementSibling.textContent = e.target.value;
      kleurenGewijzigd();
    });
    $("preset-rij").addEventListener("click", function(e){
      var b = e.target.closest(".preset-btn"); if (!b) return;
      kleuren = PRESETS[+b.dataset.p].kleuren.slice();
      tekenInstellingen(); kleurenGewijzigd();
    });
    $("water-rijen").addEventListener("input", function(e){
      var i = e.target.dataset.w; if (i === undefined) return;
      waterKleuren[+i] = e.target.value;
      e.target.previousElementSibling.textContent = e.target.value;
      kleurenGewijzigd();
    });
    $("kleur-reset").addEventListener("click", function(){
      kleuren = STD_PANDEN.slice(); waterKleuren = STD_WATER.slice();
      tekenInstellingen(); kleurenGewijzigd();
    });
  });
})();
