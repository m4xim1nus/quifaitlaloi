"""Build : dumps → data/qfl.sqlite + data/export/ (CSV et JSON)."""

import json
import shutil
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

import polars as pl

from . import an, metriques, parcours, referentiels, senat, votes
from .sources import extraits, lire_manifeste

LEGISLATURES_AN = (16, 17)


def _log(msg: str) -> None:
    print(msg, file=sys.stderr)


# --- Groupes -------------------------------------------------------------------

def groupes(raw: Path) -> list[dict]:
    b = referentiels.blocs()
    out = []
    for leg, refs in b["assemblee"].items():
        for ref, g in refs.items():
            o = json.loads((extraits(raw, "an_amo") / f"json/organe/{ref}.json").read_text())["organe"]
            v = o.get("viMoDe") or {}
            out.append({"id": ref, "chambre": "AN", "legislature": leg, "sigle": g["sigle"], "nom": o.get("libelle"),
                        "bloc": g["bloc"], "date_debut": v.get("dateDebut"), "date_fin": v.get("dateFin"),
                        "couleur": o.get("couleurAssociee")})  # couleur officielle AN (affichage)
    for code, g in b["senat"].items():
        out.append({"id": f"SN-{code}", "chambre": "SN", "legislature": None, "sigle": g["sigle"], "nom": g["nom"],
                    "bloc": g["bloc"], "date_debut": None, "date_fin": None, "couleur": None})
    return out


# --- Lois : drapeaux dérivés des lectures ---------------------------------------

def _resume_loi(loi: dict, lects: list[dict], sig: dict[str, dict]) -> dict:
    closes = [l for l in lects if l["issue"] != "sans_decision"]
    an_ = [l for l in closes if l["chambre"] == "AN"]
    sn_ = [l for l in closes if l["chambre"] == "SN"]
    finale = closes[-1] if closes else None
    def dec(ls):
        if not ls:
            return {}
        l = ls[-1]
        s = sig.get(l["scrutin_id"]) or {}
        return {"lecture": l["id"], "mode": l["mode_adoption"], "scrutin": l["scrutin_id"],
                "classe": s.get("classe"), "pivots": s.get("pivots"), "pivots_hors_socle": s.get("pivots_hors_socle"),
                "pivots_abstention": s.get("pivots_abstention"),
                "gagnants_hors_socle": s.get("gagnants_hors_socle")}
    d_an, d_sn = dec(an_), dec(sn_)
    a493 = any(l["mode_adoption"] == "ART_49_3" for l in an_)
    ri = any(l["mode_adoption"] == "REJET_INVERSE" for l in an_)
    vb = any(l["vote_bloque"] for l in closes)
    return {
        **loi,
        "parcours": " → ".join(l["etape"] + (f"-{l['chambre']}" if l["etape"] == "CMP" else "") for l in lects),
        "n_lectures": len(closes),
        "chambre_finale": finale["chambre"] if finale else None,
        "mode_final": finale["mode_adoption"] if finale else None,
        **{f"{k}_an": v for k, v in d_an.items()},
        **{f"{k}_sn": v for k, v in d_sn.items()},
        "a_49_3": a493,
        "a_49_3_final": bool(an_) and an_[-1]["mode_adoption"] == "ART_49_3",
        "a_rejet_inverse": ri,
        "a_motion_rejet": any(l["mode_adoption"] == "MOTION_REJET" for l in an_),
        "a_vote_bloque": vb,
        "a_delai_expire": any(l["mode_adoption"] == "DELAI_EXPIRE" for l in lects),
        "contournement": a493 or ri or vb,
    }


SEUIL_REJET_INVERSE = 0.5
SOUTIEN = {"pour", "pas_censure"}  # soutien au texte final (sur un 49.3 : ne pas voter la censure)


def _rejet_inverse(lects: list[dict], pos: dict[str, list[dict]]) -> None:
    """Règle du rejet inversé (validée par Max le 2026-10-28, docs/METHODO.md §5).

    Une motion de rejet adoptée à l'AN est un rejet inversé si le texte part
    ensuite en CMP et si plus de la moitié des voix « pour » la motion viennent
    de groupes qui soutiennent le texte final à l'AN (dernier scrutin AN).
    `score_rejet_inverse` = cette part.
    """
    an_final = [l for l in lects if l["chambre"] == "AN" and l["scrutin_id"]]
    for i, l in enumerate(lects):
        l["score_rejet_inverse"] = None
        if l["chambre"] != "AN" or l["mode_adoption"] != "MOTION_REJET":
            continue
        l["candidat_rejet_inverse"] = any(x["type_lecture"] == "cmp" for x in lects[i + 1:])
        fin = an_final[-1] if an_final and an_final[-1] is not l else None
        if not (l["candidat_rejet_inverse"] and fin):
            continue
        soutiens = {p["groupe_id"] for p in pos.get(fin["scrutin_id"], []) if p["position"] in SOUTIEN}
        motion = pos.get(l["scrutin_id"], [])
        total = sum(p["pour"] for p in motion)
        part = sum(p["pour"] for p in motion if p["groupe_id"] in soutiens) / total if total else 0
        l["score_rejet_inverse"] = round(part, 3)
        if part > SEUIL_REJET_INVERSE:
            l["mode_adoption"] = "REJET_INVERSE"


# --- SQLite ----------------------------------------------------------------------

TYPES = {pl.Int64: "INTEGER", pl.Int32: "INTEGER", pl.UInt32: "INTEGER", pl.Float64: "REAL", pl.Boolean: "INTEGER"}
CLES = {"lois": "id", "lectures": "id", "scrutins": "id", "groupes": "id", "signatures": "scrutin_id"}


def _ecrire_sqlite(chemin: Path, tables: dict[str, pl.DataFrame]) -> None:
    tmp = chemin.with_suffix(".tmp")
    tmp.unlink(missing_ok=True)
    con = sqlite3.connect(tmp)
    for nom, df in tables.items():
        cols = []
        for c, t in df.schema.items():
            sql = f'"{c}" {TYPES.get(t, "TEXT")}'
            if CLES.get(nom) == c:
                sql += " PRIMARY KEY"
            cols.append(sql)
        con.execute(f"CREATE TABLE {nom} ({', '.join(cols)})")
        lignes = [tuple(int(v) if isinstance(v, bool) else v for v in r) for r in df.iter_rows()]
        con.executemany(f"INSERT INTO {nom} VALUES ({', '.join('?' * df.width)})", lignes)
    for idx in ("lectures(loi_id)", "positions_groupes(scrutin_id)", "evenements(loi_id)", "scrutins(loi_id)"):
        con.execute(f"CREATE INDEX IF NOT EXISTS i_{idx.replace('(', '_').rstrip(')')} ON {idx}")
    con.commit()
    con.execute("VACUUM")
    con.close()
    tmp.replace(chemin)


def _df(rows: list[dict], schema: dict | None = None) -> pl.DataFrame:
    return pl.DataFrame(rows, schema=schema, infer_schema_length=None)


# --- Build ----------------------------------------------------------------------

def build(raw: Path, sqlite: Path, export: Path) -> None:
    _log("== Scrutins AN")
    scr_an, ventil_an = [], []
    for leg in LEGISLATURES_AN:
        r, v = an.scrutins(raw, leg)
        scr_an += r
        ventil_an += v
    _log(f"   {len(scr_an)} scrutins, {len(ventil_an)} ventilations")

    _log("== Sénat (Dosleg)")
    tables = senat.dosleg(raw)
    scr_sn_df = senat.scrutins(tables)
    ventil_sn = (senat.ventilation(tables, scr_sn_df, senat.histogroupes(raw))
                 .with_columns(pl.format("SN-{}", "groupe_id").alias("groupe_id")))
    scr_sn = [{**s, "type_vote": "SCR", "legislature": None} for s in scr_sn_df.to_dicts()]
    _log(f"   {len(scr_sn)} scrutins depuis {senat.DEBUT}")
    loi_sn = tables["loi"].filter(pl.col("date_loi").is_not_null() | pl.col("signet").is_not_null())
    par_signet = {r["signet"]: {**r, "titre": r["loititjo"]} for r in loi_sn.to_dicts() if r["signet"]}
    par_date: dict[str, list[dict]] = {}  # secours sans signet (loinumjo est le n° du JO, pas de la loi)
    for r in loi_sn.to_dicts():
        if r["date_loi"]:
            par_date.setdefault(r["date_loi"][:10], []).append({**r, "titre": r["loititjo"]})

    _log("== Groupes")
    grp = groupes(raw)
    bloc_de = {g["id"]: g["bloc"] for g in grp}
    sigle_de = {g["id"]: g["sigle"] for g in grp}
    manquants = {v["groupe_id"] for v in ventil_an} - set(bloc_de)
    manquants |= set(ventil_sn["groupe_id"].unique()) - set(bloc_de)
    if manquants:
        raise SystemExit(f"groupes absents de blocs.yaml : {sorted(manquants)}")

    _log("== Positions de groupe (tous scrutins)")
    tous = {s["id"]: s for s in scr_an + scr_sn}
    ventil: dict[str, list[dict]] = {}
    for v in ventil_an + ventil_sn.to_dicts():
        ventil.setdefault(v["scrutin_id"], []).append(v)
    pos = {sid: votes.positions(tous[sid], gs, bloc_de) for sid, gs in ventil.items()}

    _log("== Parcours des lois")
    idx = parcours.Index(scr_an, scr_sn)
    rows_lois, rows_lect, rows_evt = parcours.lois(an.dossiers(raw, 17), idx,
                                                   {"par_signet": par_signet, "par_date": par_date,
                                                    "definitifs": senat.adoptes_definitivement(tables)})
    par_loi: dict[str, list[dict]] = {}
    for l in rows_lect:
        l["vote_bloque"] = parcours._flag("vote_bloque", l["id"]) or bool(
            l["scrutin_id"] and parcours._flag("vote_bloque", l["scrutin_id"]))
        l["candidat_rejet_inverse"] = False
        par_loi.setdefault(l["loi_id"], []).append(l)
    for lects in par_loi.values():
        _rejet_inverse(lects, pos)

    # scrutins utiles : décisifs des lectures, motions de censure et motions de rejet du parcours
    utiles = {l["scrutin_id"] for l in rows_lect if l["scrutin_id"]}
    utiles |= {e["scrutin_id"] for e in rows_evt if e["scrutin_id"]}
    utiles &= set(tous)
    sig = {sid: votes.signature(tous[sid], pos[sid], sigle_de) for sid in sorted(utiles) if sid in pos}
    lois_res = [_resume_loi(loi, par_loi.get(loi["id"], []), sig) for loi in rows_lois]
    themes = senat.themes(tables)
    for loi in lois_res:
        loi["themes"] = ";".join(themes.get((loi["loicod_senat"] or "").strip(), []))
    _log(f"   {len(lois_res)} lois ({sum(l['statut'] == 'adoptee' for l in lois_res)} en attente de promulgation), "
         f"{len(rows_lect)} lectures, {len(utiles)} scrutins utiles")

    lien = {}
    for l in rows_lect:
        if l["scrutin_id"]:
            lien[l["scrutin_id"]] = (l["id"], l["loi_id"])
    for e in rows_evt:
        if e["scrutin_id"] and e["scrutin_id"] not in lien:
            lien[e["scrutin_id"]] = (None, e["loi_id"])
    cols_scr = ["id", "chambre", "legislature", "numero", "date", "type_vote", "titre", "objet", "sort", "pour",
                "contre", "abstention", "votants", "exprimes", "requis"]
    scr_rows = [{**{k: tous[s].get(k) for k in cols_scr}, "lecture_id": lien.get(s, (None, None))[0],
                 "loi_id": lien.get(s, (None, None))[1]} for s in sorted(utiles)]
    pos_rows = [{k: p[k] for k in ("scrutin_id", "groupe_id", "bloc", "membres", "pour", "contre", "abstention",
                                   "non_votants", "position", "cohesion", "rice", "participation", "pivot",
                                   "pivot_abstention")}
                for s in sorted(utiles) for p in pos.get(s, [])]

    dfs = {
        "lois": _df(lois_res),
        "lectures": _df(rows_lect),
        "scrutins": _df(scr_rows),
        "positions_groupes": _df(pos_rows),
        "signatures": _df(list(sig.values())),
        "groupes": _df(grp),
        "evenements": _df(rows_evt),
    }

    _log("== Métriques")
    met = metriques.calculer(dfs, pos, tous)

    _log("== Écriture")
    sqlite.parent.mkdir(parents=True, exist_ok=True)
    _ecrire_sqlite(sqlite, dfs)
    if export.exists():
        shutil.rmtree(export)
    export.mkdir(parents=True)
    for nom, df in dfs.items():
        df.write_csv(export / f"{nom}.csv")
    (export / "metriques.json").write_text(json.dumps(met, ensure_ascii=False, indent=1) + "\n")
    meta = {
        "genere_le": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "sources": lire_manifeste(raw),
        "comptes": {k: v.height for k, v in dfs.items()},
        "referentiels": {n: referentiels.charger(n) for n in ("blocs", "flags", "periodes")},
    }
    (export / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1, default=str) + "\n")
    _log(f"   {sqlite} ({sqlite.stat().st_size / 1e6:.1f} Mo), {export}/")
