/* Gebouwscore zelf bepalen: de keuzes en punten per gebouwkenmerk, de omgevingsscores en de matrices.
   Gelijk aan de tabellen in hoofdstuk 3 (data/fcab-methode.js): 3.1.3, 3.1.4, 3.1.5, 3.2.3, 3.2.5, 3.3.3, 3.3.5, 3.4.3, 3.4.5.
   js/04-gebouwscore.js maakt van de tabel in die paragrafen een klikbare tabel en zet onder de kwetsbaarheidsscore een rekenblok.
   Klassen: 1 zeer laag, 2 laag, 3 gemiddeld, 4 hoog, 5 zeer hoog. */
window.FCAB_CALC = {
 klassen: {
  1: {nl: "Zeer laag", en: "Very low"},
  2: {nl: "Laag", en: "Low"},
  3: {nl: "Gemiddeld", en: "Medium"},
  4: {nl: "Hoog", en: "High"},
  5: {nl: "Zeer hoog", en: "Very high"}
 },

 /* ---- Hitte: opwarming (3.1.3) min afkoeling (3.1.4), begrensd 0-100; klasse volgt direct uit de score (3.1.5) */
 hitte: {
  opwarming: [
   {id: "glas", nl: "Glasoppervlak (west, zuid en oost)", en: "Glazing area (west, south and east)", opties: [
    {nl: "Meer dan 75%", en: "More than 75%", p: 30},
    {nl: "Meer dan 50% tot 75%", en: "More than 50% to 75%", p: 21},
    {nl: "35% tot 50%", en: "35% to 50%", p: 12},
    {nl: "Minder dan 35%", en: "Less than 35%", p: 1.5}]},
   {id: "massa", nl: "Thermische massa", en: "Thermal mass", opties: [
    {nl: "Licht: minder dan 250 kg/m²", en: "Light: less than 250 kg/m²", p: 10},
    {nl: "Middelzwaar: 250–500 kg/m²", en: "Medium: 250–500 kg/m²", p: 7},
    {nl: "Zwaarder: 500–750 kg/m²", en: "Heavier: 500–750 kg/m²", p: 4},
    {nl: "Zwaar: meer dan 750 kg/m²", en: "Heavy: more than 750 kg/m²", p: 1}]},
   {id: "zonwering", nl: "Buitenzonwering of rolluiken", en: "External sun shading or roller shutters", opties: [
    {nl: "Afwezig", en: "Absent", p: 20},
    {nl: "Aanwezig (op meer dan 50% van de ramen op oost, zuid en west)", en: "Present (on more than 50% of the windows east, south and west)", p: 1}]},
   {id: "gwaarde", nl: "Zontoetredingsfactor (g-waarde)", en: "Solar heat gain coefficient (g-value)", opties: [
    {nl: "g ≥ 0,75 of enkel glas", en: "g ≥ 0.75 or single glazing", p: 15},
    {nl: "g 0,60–0,75 of dubbel glas", en: "g 0.60–0.75 or double glazing", p: 10.5},
    {nl: "g 0,40–0,60 of HR+, HR++ of triple glas", en: "g 0.40–0.60 or HR+, HR++ or triple glazing", p: 6},
    {nl: "g ≤ 0,4 of zonwerende folie", en: "g ≤ 0.4 or solar control film", p: 1.5}]},
   {id: "dak", nl: "Kleur dak", en: "Roof colour", opties: [
    {nl: "Donker", en: "Dark", p: 2.5},
    {nl: "Licht, of zonnepanelen", en: "Light, or solar panels", p: 1},
    {nl: "Groen dak of wit dak", en: "Green roof or white roof", p: 0.25}]},
   {id: "gevel", nl: "Kleur gevel", en: "Facade colour", opties: [
    {nl: "Donker", en: "Dark", p: 2.5},
    {nl: "Licht, of groene gevel", en: "Light, or green facade", p: 1}]},
   {id: "overstek", nl: "Bouwkundige overstek boven het raam", en: "Overhang above the window", opties: [
    {nl: "Afwezig of kleiner dan 0,6 m", en: "Absent or less than 0.6 m", p: 20},
    {nl: "0,6 m of meer", en: "0.6 m or more", p: 8},
    {nl: "1,2 m of meer", en: "1.2 m or more", p: 1}]}
  ],
  afkoeling: [
   {id: "koeling", nl: "Actieve koeling", en: "Active cooling", opties: [
    {nl: "Woning: condenserende koeling (airco) in woonkamer én slaapkamer", en: "Dwelling: condensing cooling (air conditioning) in living room and bedroom", p: -30},
    {nl: "Utiliteit: condenserende koeling in meer dan 50% van de verblijfsruimten", en: "Non-residential: condensing cooling in more than 50% of the occupied rooms", p: -40},
    {nl: "Woning: niet-condenserende koeling in woonkamer én slaapkamer", en: "Dwelling: non-condensing cooling in living room and bedroom", p: -15},
    {nl: "Utiliteit: niet-condenserende koeling in meer dan 50% van de verblijfsruimten", en: "Non-residential: non-condensing cooling in more than 50% of the occupied rooms", p: -20},
    {nl: "Geen koeling", en: "No cooling", p: 0}]},
   {id: "isolatie", nl: "Isolatie (Rc of bouwjaar)", en: "Insulation (Rc or construction year)", opties: [
    {nl: "Rc < 1,3 of bouwjaar vóór 1976", en: "Rc < 1.3 or built before 1976", p: -7},
    {nl: "Rc < 2,5 of bouwjaar 1976–1992", en: "Rc < 2.5 or built 1976–1992", p: -5},
    {nl: "Rc < 3,5 of bouwjaar 1993–2013", en: "Rc < 3.5 or built 1993–2013", p: -3},
    {nl: "Rc > 3,5 of bouwjaar na 2013", en: "Rc > 3.5 or built after 2013", p: -1}]},
   {id: "spui", nl: "Spuiventilatie (ramen die open kunnen)", en: "Purge ventilation (windows that open)", opties: [
    {nl: "Op 2 of meer gevels", en: "On 2 or more facades", laag: -20, hoog: -15},
    {nl: "Op 1 gevel", en: "On 1 facade", laag: -10, hoog: -5},
    {nl: "Ramen kunnen niet open", en: "Windows cannot open", laag: 0, hoog: 0}]}
  ],
  omgeving: [
   {id: "laag", nl: "Laag of zeer laag (minder dan 2 weken warme nachten)", en: "Low or very low (less than 2 weeks of warm nights)"},
   {id: "hoog", nl: "Middel of hoog (2 weken of meer warme nachten)", en: "Medium or high (2 weeks or more of warm nights)"}
  ],
  /* grens: score tot en met deze waarde → klasse */
  banden: [[20, 1], [40, 2], [60, 3], [80, 4], [100, 5]]
 },

 /* ---- Wateroverlast: som van de punten (min. 4, max. 100), matrix met de omgevingsscore (3.3.5) */
 wateroverlast: {
  vragen: [
   {id: "ingang", nl: "Hoogte laagste ingang t.o.v. maaiveld op 2 m", en: "Height of the lowest entrance above ground level at 2 m", opties: [
    {nl: "0 cm of lager", en: "0 cm or lower", p: 40},
    {nl: "1 tot 15 cm", en: "1 to 15 cm", p: 28},
    {nl: "Waterkering (schot) aanwezig", en: "Flood barrier present", p: 10},
    {nl: "Hoger dan 15 cm", en: "Higher than 15 cm", p: 4}]},
   {id: "kelder", nl: "Parkeerkelder of andere ondergrondse ruimte", en: "Underground car park or other basement", opties: [
    {nl: "Aanwezig, drempel 0 cm of lager", en: "Present, threshold 0 cm or lower", p: 15},
    {nl: "Drempel 1 tot 15 cm", en: "Threshold 1 to 15 cm", p: 10.5},
    {nl: "Drempel hoger dan 15 cm, waterrooster of schot", en: "Threshold higher than 15 cm, drainage grate or barrier", p: 6},
    {nl: "Geen ondergrondse ruimte", en: "No underground space", p: 0}]},
   {id: "instroom", nl: "Overige instroompunten (zoals een kelderraam) binnen 15 cm boven maaiveld", en: "Other inflow points (such as a basement window) within 15 cm above ground level", opties: [
    {nl: "Aanwezig", en: "Present", p: 20},
    {nl: "Schot bij het instroompunt", en: "Barrier at the inflow point", p: 8},
    {nl: "Niet aanwezig", en: "Not present", p: 0}]},
   {id: "riool", nl: "Ontlastput of terugslagklep", en: "Relief well or non-return valve", opties: [
    {nl: "Geen klep of ontlastput en gemengd riool", en: "No valve or relief well and combined sewer", p: 5},
    {nl: "Klep of ontlastput aanwezig, of gescheiden riool", en: "Valve or relief well present, or separate sewer", p: 0}]},
   {id: "installaties", nl: "Vaste apparatuur en installaties", en: "Fixed equipment and installations", opties: [
    {nl: "Onder straatniveau (niet verhoogd)", en: "Below street level (not raised)", p: 20},
    {nl: "Op de begane grond en ingang 0 cm", en: "On the ground floor and entrance at 0 cm", p: 14},
    {nl: "Niet op de begane grond of eronder, of op poten van 15 cm of meer", en: "Not on or below the ground floor, or on legs of 15 cm or more", p: 0}]}
  ],
  min: 4, max: 100,
  omgeving: [
   {id: "5", nl: "Zeer hoog (meer dan 30 cm water, 70 mm in 1 uur)", en: "Very high (more than 30 cm of water, 70 mm in 1 hour)"},
   {id: "4", nl: "Hoog (20 tot 30 cm)", en: "High (20 to 30 cm)"},
   {id: "3", nl: "Middel (15 tot 20 cm)", en: "Medium (15 to 20 cm)"},
   {id: "2", nl: "Laag (10 tot 15 cm)", en: "Low (10 to 15 cm)"},
   {id: "1", nl: "Zeer laag (2 tot 10 cm)", en: "Very low (2 to 10 cm)"},
   {id: "0", nl: "Geen (minder dan 2 cm)", en: "None (less than 2 cm)"}
  ],
  /* kolomgrenzen van de gebouwscore (tot en met) en per omgevingsscore de klasse per kolom (tabel in 3.3.5) */
  kolommen: [15, 25, 30, 40, 45, 60, 85, 100],
  matrix: {
   "5": [1, 2, 2, 3, 3, 5, 5, 5],
   "4": [1, 1, 2, 2, 3, 3, 4, 5],
   "3": [1, 1, 1, 2, 2, 3, 3, 4],
   "2": [1, 1, 1, 1, 2, 2, 2, 3],
   "1": [1, 1, 1, 1, 1, 1, 1, 2]
  }
 },

 /* ---- Overstroming: stappenplan (3.4.5) met de gebouwscore uit 3.4.3 */
 overstroming: {
  vragen: [
   {id: "ingang", nl: "Hoogte laagste ingang t.o.v. maaiveld op 2 m", en: "Height of the lowest entrance above ground level at 2 m", opties: [
    {nl: "Ingang of afsluitmiddel lager dan 50 cm", en: "Entrance or barrier lower than 50 cm", p: 40},
    {nl: "Ingang 50 cm of hoger, of afsluitmiddel hoger dan 50 cm", en: "Entrance 50 cm or higher, or barrier higher than 50 cm", p: 4}]},
   {id: "kelder", nl: "Parkeerkelder of andere ondergrondse ruimte", en: "Underground car park or other basement", opties: [
    {nl: "Aanwezig, drempel lager dan 50 cm", en: "Present, threshold lower than 50 cm", p: 15},
    {nl: "Drempel 50 cm of hoger, of afsluitmiddel hoger dan 50 cm", en: "Threshold 50 cm or higher, or barrier higher than 50 cm", p: 6},
    {nl: "Geen ondergrondse ruimte", en: "No underground space", p: 0}]},
   {id: "instroom", nl: "Overige instroompunten (kelderraam, open stootvoegen) binnen 50 cm boven maaiveld", en: "Other inflow points (basement window, open joints) within 50 cm above ground level", opties: [
    {nl: "Aanwezig", en: "Present", p: 20},
    {nl: "Afsluitmiddel (schot) bij het instroompunt", en: "Barrier at the inflow point", p: 8},
    {nl: "Niet aanwezig", en: "Not present", p: 0}]},
   {id: "riool", nl: "Terugslagklep", en: "Non-return valve", opties: [
    {nl: "Geen klep en gemengd riool", en: "No valve and combined sewer", p: 5},
    {nl: "Klep aanwezig, of gescheiden riool", en: "Valve present, or separate sewer", p: 0}]},
   {id: "installaties", nl: "Vaste apparatuur en installaties", en: "Fixed equipment and installations", opties: [
    {nl: "Onder straatniveau (niet verhoogd)", en: "Below street level (not raised)", p: 20},
    {nl: "Op de begane grond en ingang lager dan 50 cm", en: "On the ground floor and entrance lower than 50 cm", p: 14},
    {nl: "Niet op de begane grond of eronder, of op poten hoger dan 50 cm", en: "Not on or below the ground floor, or on legs higher than 50 cm", p: 0}]}
  ],
  min: 4, max: 100,
  kans20: [
   {id: "groot", nl: "Groot (meer dan 1/30 per jaar)", en: "Large (more than 1/30 per year)"},
   {id: "middel", nl: "Middelgroot (1/30 tot 1/300 per jaar)", en: "Medium (1/30 to 1/300 per year)"},
   {id: "klein", nl: "Klein (1/300 tot 1/3.000 per jaar)", en: "Small (1/300 to 1/3,000 per year)"},
   {id: "zeerklein", nl: "Zeer tot extreem klein (minder dan 1/3.000 per jaar)", en: "Very to extremely small (less than 1/3,000 per year)"}
  ],
  kans50: [
   {id: "kleiner", nl: "Kleiner dan de kans op meer dan 20 cm", en: "Smaller than the probability of more than 20 cm"},
   {id: "gelijk", nl: "Gelijk aan de kans op meer dan 20 cm", en: "Equal to the probability of more than 20 cm"}
  ],
  /* stap 3: gebouwscore tot en met 30 laag, tot en met 60 middel, daarboven hoog */
  banden: [[30, 2], [60, 3], [100, 4]]
 },

 /* ---- Droogte: paalrot (houten palen) en verschilzetting (fundering op staal), 3.2.3 en 3.2.5 */
 droogte: {
  fundering: [
   {id: "hout", nl: "Houten palen", en: "Timber piles"},
   {id: "staal", nl: "Fundering op staal (ondiep)", en: "Shallow foundation"},
   {id: "beton", nl: "Betonpalen of een andere fundering", en: "Concrete piles or another foundation"},
   {id: "onbekend", nl: "Onbekend", en: "Unknown"}
  ],
  paalrot: {
   bouwjaar: [
    {nl: "Vóór 1830", en: "Before 1830"}, {nl: "1830–1879", en: "1830–1879"}, {nl: "1880–1899", en: "1880–1899"},
    {nl: "1900–1929", en: "1900–1929"}, {nl: "1930–1949", en: "1930–1949"}, {nl: "1950–1975", en: "1950–1975"},
    {nl: "1976 en later", en: "1976 and later"}],
   omgeving: [
    {id: "LP", nl: "LP: laag, veen", en: "LP: low, peat"}, {id: "LC", nl: "LC: laag, klei", en: "LC: low, clay"}, {id: "LS", nl: "LS: laag, zand", en: "LS: low, sand"},
    {id: "MP", nl: "MP: middel, veen", en: "MP: medium, peat"}, {id: "MC", nl: "MC: middel, klei", en: "MC: medium, clay"}, {id: "MS", nl: "MS: middel, zand", en: "MS: medium, sand"},
    {id: "HP", nl: "HP: hoog, veen", en: "HP: high, peat"}, {id: "HC", nl: "HC: hoog, klei", en: "HC: high, clay"}, {id: "HS", nl: "HS: hoog, zand", en: "HS: high, sand"}],
   matrix: {
    LP: [1, 1, 1, 1, 1, 1, 1], LC: [1, 1, 1, 1, 1, 1, 1], LS: [1, 1, 1, 1, 1, 1, 1],
    MP: [4, 4, 3, 3, 2, 2, 2], MC: [3, 3, 2, 2, 2, 2, 1], MS: [5, 5, 4, 4, 3, 3, 2],
    HP: [5, 5, 4, 3, 3, 3, 2], HC: [4, 4, 3, 3, 2, 2, 2], HS: [5, 5, 5, 5, 4, 3, 3]
   }
  },
  zetting: {
   bouwjaar: [{nl: "Vóór 1900", en: "Before 1900"}, {nl: "1900–1920", en: "1900–1920"}, {nl: "Na 1920", en: "After 1920"}],
   kelder: [
    {id: "souterrain", nl: "Volledig souterrain", en: "Full basement (souterrain)"},
    {id: "gedeeltelijk", nl: "Gedeeltelijke kelder, of onbekend", en: "Partial basement, or unknown"},
    {id: "geen", nl: "Geen kelder", en: "No basement"}],
   /* gebouwscore per bouwjaar en kelder (tabel in 3.2.3) */
   score: [
    {souterrain: 50, gedeeltelijk: 100, geen: 75},
    {souterrain: 25, gedeeltelijk: 75, geen: 50},
    {souterrain: 0, gedeeltelijk: 50, geen: 25}],
   kolommen: [0, 25, 50, 75, 100],
   /* per omgevingsscore 0-5 de klasse per gebouwscorekolom (tabel in 3.2.5) */
   matrix: [[1, 1, 1, 1, 1], [1, 1, 1, 2, 2], [1, 2, 2, 3, 3], [2, 3, 3, 4, 4], [3, 4, 4, 5, 5], [4, 4, 5, 5, 5]]
  }
 }
};
