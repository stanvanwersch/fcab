# FCAB Rekenkern Wateroverlast (website)

Klimaatrisico wateroverlast door korte extreme regen (70 mm in 1 uur), met de kaart centraal.
Draait volledig in de browser en is geschikt voor **GitHub Pages**: er is geen server of Python nodig om de site te gebruiken.

## Eenmalig: data klaarzetten

Het GeoPackage `nl_fcab_omgevingsscore_wateroverlast_v20260806.gpkg` (2,2 GB) is te groot voor GitHub.
Zet het daarom om naar kleine databestanden (tegels van 5 × 5 km, samen ongeveer 100–150 MB):

    python maak_data.py "C:\Users\<naam>\Downloads\nl_fcab_omgevingsscore_wateroverlast_v20260806.gpkg"

Alleen standaard-Python is nodig (3.9 of nieuwer). Het script maakt de map `data` naast `index.html` en meldt welke kolommen het heeft herkend (klasse, BAG pand-ID, waterdiepte). Dat duurt enkele minuten.

## Op GitHub zetten

1. Zet alle bestanden uit deze map **inclusief de map `data`** in je repository.
   De map `data` bevat ruim duizend kleine bestanden. De uploadknop op github.com neemt maximaal 100 bestanden tegelijk; gebruik daarom GitHub Desktop of `git`:

        git add .
        git commit -m "Rekenkern wateroverlast met data"
        git push

2. Zet GitHub Pages aan: *Settings → Pages → Deploy from a branch → main / (root)*.
3. Open de site; de toegangscode is dezelfde als bij de Rekenkern.

Bij een nieuwe versie van het GeoPackage: `maak_data.py` opnieuw draaien en de map `data` opnieuw pushen.

## Hoe het werkt

| Onderdeel | Bron |
|---|---|
| Omgevingsscore | `data/` (uit het GeoPackage): per pand de waterdiepteklasse, op BAG pand-ID of locatie |
| Pandcontouren, bouwjaar | BAG via PDOK (live) |
| Adressen zoeken | PDOK Locatieserver (live) |
| Luchtfoto en kaart | PDOK |
| Gebouwscore en klimaatrisico | FCAB-2 wateroverlast en risicomatrix, berekend in de browser |

- Ingezoomd tot straatniveau kleuren de BAG-panden met de omgevingsscore (kleuren volgens de SLD).
- Verder uitgezoomd verschijnen stippen op plekken met water op straat.
- Koppeling per pand: 1) zelfde BAG pand-ID, 2) locatie binnen het object, 3) dichtstbijzijnde object binnen 10 m.
- Zonder map `data` rekent de site met voorbeeldwaarden; dat staat dan in beeld.

Let op: de toegangscode schermt de pagina af, maar bestanden in een openbare repository zijn voor iedereen op te vragen. Gebruik een privérepository als de data niet openbaar mag zijn (GitHub Pages vanuit een privérepository vraagt een betaald GitHub-abonnement).
