"""Zet het FCAB-GeoPackage om naar kleine databestanden voor GitHub Pages.

    python maak_data.py "C:\\Users\\...\\Downloads\\nl_fcab_omgevingsscore_wateroverlast_v20260806.gpkg"

Het GeoPackage (2,2 GB) is te groot voor GitHub. Dit script schrijft per tegel
van 5 x 5 km een klein, gecomprimeerd bestand met per object:
BAG pand-ID, middelpunt en omvang (RD), waterdiepteklasse en eventueel de
waterdiepte. De website zoekt daarin op pand-ID of locatie; de pandcontouren
komen live uit de BAG van PDOK.

Uitvoer: map 'data' naast dit script (data/index.json en data/<x>_<y>.bin.gz).
Alleen standaard-Python nodig (geen GDAL). Duur: enkele minuten.
"""
from __future__ import annotations

import argparse
import datetime as dt
import gzip
import json
import re
import sqlite3
import sys
import time
import urllib.parse
from array import array
from pathlib import Path

TEGEL = 5000  # meter
MAGIC = b"FCB1"
KLASSEN = ["0 tot 2 cm", "2 tot 10 cm", "10 tot 15 cm", "15 tot 20 cm", "20 tot 30 cm", "meer dan 30 cm"]
NAMEN = ["geen", "zeer laag", "laag", "middel", "hoog", "zeer hoog"]


def klasse_index(w) -> int:
    """0..5 = klasse, 6 = onbekend."""
    if w is None:
        return 6
    s = str(w).strip().lower()
    if s in KLASSEN:
        return KLASSEN.index(s)
    if s in NAMEN:
        return NAMEN.index(s)
    if s.startswith("meer dan") or s.startswith(">"):
        return 5
    m = re.match(r"^(\d+)\s*(tot|-|–)\s*(\d+)", s)
    if m:
        lo = int(m.group(1))
        return 0 if lo < 2 else 1 if lo < 10 else 2 if lo < 15 else 3 if lo < 20 else 4 if lo < 30 else 5
    return 6


def pand_int(v) -> int:
    if v is None:
        return 0
    s = str(v).strip()
    if s.lower().startswith("nl.imbag"):
        s = s.split(".")[-1]
    try:
        return int(float(s)) if re.fullmatch(r"[\d.eE+]+", s) else 0
    except ValueError:
        return 0


def nl(n: int) -> str:
    return f"{n:,}".replace(",", ".")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("gpkg", nargs="?", help="pad naar het GeoPackage (standaard: zoeken in Downloads)")
    ap.add_argument("--uit", default=str(Path(__file__).resolve().parent / "data"))
    a = ap.parse_args()

    if not a.gpkg:
        dl = Path.home() / "Downloads"
        kand = [dl / "nl_fcab_omgevingsscore_wateroverlast_v20260806.gpkg", Path(__file__).resolve().parent / "nl_fcab_omgevingsscore_wateroverlast_v20260806.gpkg"]
        kand += sorted(dl.glob("nl_fcab_omgevingsscore_wateroverlast*.gpkg"), reverse=True)
        a.gpkg = next((str(k) for k in kand if k.is_file()), None)
        if not a.gpkg:
            sys.exit("GeoPackage niet gevonden in Downloads. Geef het pad op: python maak_data.py PAD")
        print(f"GeoPackage: {a.gpkg}")
    src = Path(a.gpkg)
    if not src.is_file():
        sys.exit(f"Bestand niet gevonden: {src}")
    pad = src.resolve().as_posix()
    pad = "/" + pad if re.match(r"^[A-Za-z]:", pad) else pad
    try:
        c = sqlite3.connect("file://" + urllib.parse.quote(pad, safe="/:") + "?mode=ro&immutable=1", uri=True)
        c.execute("SELECT 1 FROM gpkg_contents LIMIT 1")
    except sqlite3.Error:
        c = sqlite3.connect(str(src))
    lagen = [r[0] for r in c.execute("SELECT table_name FROM gpkg_contents WHERE data_type='features'")]
    laag = next((l for l in lagen if "wateroverlast" in l.lower()), lagen[0])
    geom, srs = c.execute("SELECT column_name, srs_id FROM gpkg_geometry_columns WHERE table_name=?", (laag,)).fetchone()
    if int(srs) != 28992:
        sys.exit(f"Verwacht EPSG:28992 (RD New), gevonden EPSG:{srs}")
    info = list(c.execute(f'PRAGMA table_info("{laag}")'))
    pk = next((r[1] for r in info if r[5] == 1), "fid")
    kols = [(r[1], (r[2] or "").upper()) for r in info if r[1] != geom]
    low = {k.lower(): k for k, _ in kols}
    klasse = low.get("waterdiepte_klasse") or next((k for k, _ in kols if "klasse" in k.lower()), None)
    pid = next((low[k] for k in ("identificatie", "pand_id", "bag_pand_id", "pandid", "bag_id", "bag_identificatie") if k in low), None) \
        or next((k for k, _ in kols if "identificatie" in k.lower() or "pand" in k.lower()), None)
    diepte = next((k for k, t in kols if k != klasse and "diepte" in k.lower() and any(x in t for x in ("REAL", "DOUBLE", "FLOAT", "INT", "NUM"))), None)
    rtree = f"rtree_{laag}_{geom}"
    if not klasse:
        sys.exit("Geen kolom met de waterdiepteklasse gevonden")
    print(f"Laag: {laag}\nKolommen: klasse={klasse}, pand-ID={pid or '-'}, waterdiepte={diepte or '-'}")

    # steekproef om te vergelijken met QGIS
    print("Steekproef uit het GeoPackage (vergelijk gerust in QGIS):")
    lo, hi = c.execute(f'SELECT min("{pk}"), max("{pk}") FROM "{laag}"').fetchone()
    for f in (0.1, 0.3, 0.5, 0.7, 0.9):
        row = c.execute(f'SELECT {("t." + chr(34) + pid + chr(34)) if pid else "NULL"}, t."{klasse}" FROM "{laag}" t WHERE t."{pk}" >= ? ORDER BY t."{pk}" LIMIT 1', (int(lo + f * (hi - lo)),)).fetchone()
        if row:
            print(f"  pand {row[0]}: {row[1]!r} -> {(KLASSEN + ['Onbekend'])[klasse_index(row[1])]}")
    waarden = [r[0] for r in c.execute(f'SELECT DISTINCT "{klasse}" FROM (SELECT "{klasse}" FROM "{laag}" LIMIT 200000)')]
    print("Gevonden klassewaarden:", ", ".join(repr(w) for w in waarden))
    onbekend = [w for w in waarden if klasse_index(w) == 6 and not str(w or "").lower().startswith("onbekend")]
    if onbekend:
        print("LET OP: deze waarden worden niet herkend en tellen als 'Onbekend':", ", ".join(repr(w) for w in onbekend))

    ext = c.execute(f'SELECT min(minx), max(maxx), min(miny), max(maxy) FROM "{rtree}"').fetchone()
    tx0, tx1 = int(ext[0] // TEGEL), int(ext[1] // TEGEL)
    ty0, ty1 = int(ext[2] // TEGEL), int(ext[3] // TEGEL)
    uit = Path(a.uit)
    uit.mkdir(parents=True, exist_ok=True)
    for f in uit.glob("*.bin.gz"):
        f.unlink()

    sel = f't."{pid}"' if pid else "NULL"
    seld = f't."{diepte}"' if diepte else "NULL"
    q = (f'SELECT r.minx, r.maxx, r.miny, r.maxy, {sel}, t."{klasse}", {seld} FROM "{rtree}" r '
         f'JOIN "{laag}" t ON t."{pk}" = r.id WHERE r.minx < ? AND r.maxx >= ? AND r.miny < ? AND r.maxy >= ?')
    tegels, totaal, telling = [], 0, [0] * 7
    bytes_tot = 0
    start = time.time()
    n_tegels = (tx1 - tx0 + 1) * (ty1 - ty0 + 1)
    i = 0
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            i += 1
            x0, y0 = tx * TEGEL, ty * TEGEL
            ids, xs, ys, hw, hh, dd, kk = array("d"), array("i"), array("i"), array("H"), array("H"), array("h"), array("B")
            for minx, maxx, miny, maxy, p, k, d in c.execute(q, (x0 + TEGEL, x0, y0 + TEGEL, y0)):
                cx, cy = (minx + maxx) / 2, (miny + maxy) / 2
                if not (x0 <= cx < x0 + TEGEL and y0 <= cy < y0 + TEGEL):
                    continue
                ki = klasse_index(k)
                ids.append(float(pand_int(p)))
                xs.append(int(round(cx)))
                ys.append(int(round(cy)))
                hw.append(min(65535, int((maxx - minx) / 2 + 1)))
                hh.append(min(65535, int((maxy - miny) / 2 + 1)))
                try:
                    dd.append(-1 if d is None else max(-1, min(32767, int(round(float(d) * 10)))))
                except (TypeError, ValueError):
                    dd.append(-1)
                kk.append(ki)
                telling[ki] += 1
            n = len(kk)
            if not n:
                continue
            for arr in (ids, xs, ys, hw, hh, dd):
                if sys.byteorder != "little":
                    arr.byteswap()
            body = MAGIC + n.to_bytes(4, "little") + ids.tobytes() + xs.tobytes() + ys.tobytes() + hw.tobytes() + hh.tobytes() + dd.tobytes() + kk.tobytes()
            data = gzip.compress(body, 6, mtime=0)
            (uit / f"{tx}_{ty}.bin.gz").write_bytes(data)
            tegels.append(f"{tx}_{ty}")
            totaal += n
            bytes_tot += len(data)
            if len(tegels) % 25 == 0:
                print(f"  {i}/{n_tegels} tegels doorzocht · {nl(totaal)} objecten · {bytes_tot / 1e6:.0f} MB · {time.time() - start:.0f} s")

    versie = (re.search(r"v(\d{8})", laag) or re.search(r"v(\d{8})", src.name))
    (uit / "index.json").write_text(json.dumps({
        "formaat": "FCB1", "tegel": TEGEL, "laag": laag, "bestand": src.name, "versie": versie.group(1) if versie else "",
        "kolommen": {"klasse": klasse, "pand": pid, "diepte": diepte}, "aantal": totaal,
        "per_klasse": dict(zip(KLASSEN + ["Onbekend"], telling)), "gemaakt": dt.date.today().isoformat(), "tegels": tegels,
    }, ensure_ascii=False), encoding="utf-8")
    print(f"\nKlaar: {nl(totaal)} objecten in {len(tegels)} bestanden, samen {bytes_tot / 1e6:.0f} MB, in {time.time() - start:.0f} s.")
    print(f"Map: {uit}")


if __name__ == "__main__":
    main()
