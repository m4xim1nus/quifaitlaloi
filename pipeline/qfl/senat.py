"""Lecture de Dosleg (dump PostgreSQL du Sénat) et des appartenances aux groupes."""

import re
from pathlib import Path

import polars as pl

from .sources import extraits
from .texte import nettoyer, objet_scrutin

TABLES = {
    "scr": ["sesann", "scrnum", "code", "scrint", "scrdat", "scrvotsea", "scrsufsea", "scrpousea", "scrconsea"],
    "votsen": ["sesann", "scrnum", "senmat", "posvotcod"],
    "date_seance": ["code", "lecidt", "date_s"],
    "lecass": ["lecassidt", "lecidt", "codass"],
    "lecture": ["lecidt", "loicod", "typleccod"],
    "loi": ["loicod", "typloicod", "signet", "date_loi", "loinumjo", "loititjo", "url_an"],
    "texte": ["texcod", "oritxtcod", "lecassidt"],
    "oritxt": ["oritxtcod", "oritxtlib", "oritxtado"],
    "the": ["thecle", "thelib"],
    "loithe": ["loicod", "thecle"],
}
ESC = {"t": "\t", "n": "\n", "r": "\r", "\\": "\\"}
POSITIONS = {"1": "pour", "2": "contre", "3": "abstention", "4": "non_votant"}
DEBUT = "2017-06-27"  # début de la période utile (XVe législature, parcours.DEBUT)


def _champ(v: str):
    if v == r"\N":
        return None
    return re.sub(r"\\(.)", lambda m: ESC.get(m.group(1), m.group(1)), v).strip() if "\\" in v else v.strip()


def dosleg(raw: Path) -> dict[str, pl.DataFrame]:
    """Tables utiles de Dosleg, colonnes en texte, champs `char` débarrassés de leurs blancs."""
    sql = extraits(raw, "senat_dosleg") / "dosleg.sql"
    out: dict[str, pl.DataFrame] = {}
    with sql.open(encoding="utf-8") as f:
        nom = None
        for ligne in f:
            if nom is None:
                m = re.match(r"COPY (?:public\.)?(\w+) \((.*)\) FROM stdin;", ligne)
                if m and m.group(1) in TABLES:
                    nom = m.group(1)
                    cols = [c.strip().strip('"') for c in m.group(2).split(",")]
                    idx = [cols.index(c) for c in TABLES[nom]]
                    lignes = []
            elif ligne == "\\.\n":
                out[nom] = pl.DataFrame(lignes, schema={c: pl.Utf8 for c in TABLES[nom]}, orient="row")
                nom = None
            else:
                v = ligne.rstrip("\n").split("\t")
                lignes.append([_champ(v[i]) for i in idx])
    manquantes = set(TABLES) - set(out)
    if manquantes:
        raise SystemExit(f"Dosleg : tables absentes du dump : {sorted(manquantes)}")
    return out


def histogroupes(raw: Path) -> pl.DataFrame:
    """Appartenances datées sénateur → groupe (ODSEN_HISTOGROUPES, CSV latin-1, en-tête `%`)."""
    p = extraits(raw, "senat_senateurs")
    lignes = p.read_text(encoding="latin-1").splitlines()
    corps = "\n".join(l for l in lignes if not l.startswith("%"))
    df = pl.read_csv(corps.encode(), infer_schema_length=0)
    return (df.select(pl.col("Matricule").alias("senmat"),
                      pl.col("Code du groupe politique").alias("groupe"),
                      pl.col("Date de début d'appartenance").str.slice(0, 10).alias("debut"),
                      pl.col("Date de fin d'appartenance").str.slice(0, 10).fill_null("9999").alias("fin"))
              .unique())


def adoptes_definitivement(tables: dict[str, pl.DataFrame]) -> set[str]:
    """Lois (loicod) dont un texte est « adopté définitivement » (oritxt.oritxtado = D).

    Sert à repérer les textes adoptés mais pas encore promulgués quand le
    Sénat a eu le dernier mot : le dossier AN code parfois ces décisions
    « modifié » (docs/SOURCES.md).
    """
    d = (tables["texte"].join(tables["oritxt"], on="oritxtcod")
         .filter(pl.col("oritxtado") == "D")
         .join(tables["lecass"].select("lecassidt", "lecidt"), on="lecassidt")
         .join(tables["lecture"], on="lecidt"))
    return set(d["loicod"].drop_nulls())


def scrutins(tables: dict[str, pl.DataFrame]) -> pl.DataFrame:
    """Scrutins publics du Sénat depuis DEBUT, rattachés à leur loi et type de lecture Dosleg."""
    lec = (tables["date_seance"].select("code", pl.col("lecidt").alias("lecassidt"))
           .join(tables["lecass"].select("lecassidt", "lecidt"), on="lecassidt", how="left")
           .join(tables["lecture"], on="lecidt", how="left")
           .unique("code"))
    s = (tables["scr"].filter(pl.col("scrdat") >= DEBUT)
         .join(lec.select("code", "loicod", "typleccod"), on="code", how="left"))
    num = lambda c: pl.col(c).cast(pl.Int64).fill_null(0)
    s = s.with_columns(
        pl.format("SN{}-{}", "sesann", "scrnum").alias("id"),
        pl.col("scrint").map_elements(nettoyer, return_dtype=pl.Utf8).alias("titre"),
        num("scrpousea").alias("pour"), num("scrconsea").alias("contre"),
        num("scrvotsea").alias("votants"), num("scrsufsea").alias("exprimes"),
    )
    return (s.with_columns(
                pl.lit("SN").alias("chambre"),
                pl.col("scrnum").cast(pl.Int64).alias("numero"),
                pl.col("sesann").cast(pl.Int64).alias("session"),
                pl.col("scrdat").str.slice(0, 10).alias("date"),
                pl.col("titre").map_elements(objet_scrutin, return_dtype=pl.Utf8).alias("objet"),
                (pl.col("votants") - pl.col("exprimes")).alias("abstention"),
                (pl.col("exprimes") // 2 + 1).alias("requis"))
            .with_columns(pl.when(pl.col("pour") >= pl.col("requis")).then(pl.lit("adopte"))
                          .otherwise(pl.lit("rejete")).alias("sort"))
            .select("id", "chambre", "session", "numero", "date", "titre", "objet", "sort", "pour", "contre",
                    "abstention", "votants", "exprimes", "requis", "loicod", "typleccod")
            .sort("date", "numero"))


def ventilation(tables: dict[str, pl.DataFrame], scr: pl.DataFrame, groupes: pl.DataFrame) -> pl.DataFrame:
    """Votes nominatifs (votsen) agrégés par groupe d'appartenance à la date du scrutin."""
    v = (tables["votsen"]
         .with_columns(pl.format("SN{}-{}", "sesann", "scrnum").alias("scrutin_id"))
         .join(scr.select(pl.col("id").alias("scrutin_id"), "date"), on="scrutin_id", how="inner")
         .with_columns(pl.col("posvotcod").replace_strict(POSITIONS).alias("position")))
    j = (v.join(groupes, on="senmat", how="left")
          .filter((pl.col("debut") <= pl.col("date")) & (pl.col("fin") >= pl.col("date")))
          .unique(["scrutin_id", "senmat"]))
    # Un sénateur sans appartenance à la date est compté parmi les non-inscrits.
    sans = (v.join(j.select("scrutin_id", "senmat"), on=["scrutin_id", "senmat"], how="anti")
             .with_columns(pl.lit("NI").alias("groupe")))
    tout = pl.concat([j.select("scrutin_id", "senmat", "groupe", "position"),
                      sans.select("scrutin_id", "senmat", "groupe", "position")])
    agg = (tout.group_by("scrutin_id", "groupe")
               .agg(pl.len().alias("membres"),
                    *[(pl.col("position") == p).sum().alias(p) for p in POSITIONS.values()]))
    return (agg.rename({"groupe": "groupe_id", "non_votant": "non_votants"})
               .with_columns(pl.col("membres").cast(pl.Int64),
                             *[pl.col(c).cast(pl.Int64) for c in ("pour", "contre", "abstention", "non_votants")])
               .sort("scrutin_id", "groupe_id"))


def themes(tables: dict[str, pl.DataFrame]) -> dict[str, list[str]]:
    """Thèmes du Sénat de chaque loi (loicod → libellés), du plus spécifique au plus général :
    rangés par fréquence croissante sur l'ensemble de Dosleg, « Société » (fourre-tout) en dernier."""
    lib = dict(zip(tables["the"]["thecle"], tables["the"]["thelib"]))
    freq: dict[str, int] = {}
    par_loi: dict[str, list[str]] = {}
    for loicod, cle in zip(tables["loithe"]["loicod"], tables["loithe"]["thecle"]):
        t = lib.get(cle)
        if not t:
            continue
        freq[t] = freq.get(t, 0) + 1
        par_loi.setdefault(loicod.strip(), []).append(t)
    return {k: sorted(set(v), key=lambda t: (t == "Société", freq[t], t)) for k, v in par_loi.items()}
