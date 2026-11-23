/* Inhoud en standaardinstellingen van de VMV-kaartviewer Den Bosch (wateroverlast). */
window.VMV_CONFIG = {
  gemeente: "'s-Hertogenbosch",
  centrum: [51.697, 5.304],
  zoom: 13,

  // SHA-256 van de toegangscode (hoofdletters). De pandgegevens in panden.js zijn met dezelfde code versleuteld.
  codeHash: "73e2822498c988475f994d5cbc7348677198694cb01830ef3182527acd0f6d0e",

  // Klassen van laag naar hoog. 'kleur' is de standaardkleur; die is bij Instellingen aan te passen.
  // Omgevingsscore van de panden
  klassen: [
    { label: "Geen",      kleur: "#14532d" },
    { label: "Zeer laag", kleur: "#5f9e2f" },
    { label: "Laag",      kleur: "#c9c22c" },
    { label: "Middel",    kleur: "#f29b1d" },
    { label: "Hoog",      kleur: "#d9481c" },
    { label: "Zeer hoog", kleur: "#7f0d0d" }
  ],
  onbekendKleur: "#9ca3af",

  // Klimaateffecten per pand (alleen wateroverlast door een bui). Bij één effect verbergt de viewer de effectkeuze.
  effecten: [
    { key: "waterbui",   label: "Wateroverlast: bui 70mm/2u" }
  ],

  // Kaartlaag: waterdieptekaart bui 70 mm (bron: waterdieptekaart_db2.tif, waterdiepte in meter, RD New, 0,5 m).
  // De tegels bevatten per pixel de klasse 1-5 (zie scripts/toclass.py); 'Geen hinderlijke waterdiepte' is doorzichtig.
  // Labels en kleuren volgens waterdiepte_70mm_1h_qgis.sld (bron/).
  kaartlaag: {
    naam: "Waterdiepte bui 70 mm/1 uur",
    klassen: [
      { label: "2 - 10 cm",      kleur: "#b6edf0" },
      { label: "10 - 15 cm",     kleur: "#74b4e8" },
      { label: "15 - 20 cm",     kleur: "#1f83e0" },
      { label: "20 - 30 cm",     kleur: "#1d44b8" },
      { label: "Meer dan 30 cm", kleur: "#002673" }
    ],
    tegels: "assets/waterdiepte/{z}/{x}/{y}.png",
    minZoom: 10,
    maxNativeZoom: 16,
    grenzen: [[51.6336, 5.1698], [51.7686, 5.5321]],
    dekking: 1
  }
};
