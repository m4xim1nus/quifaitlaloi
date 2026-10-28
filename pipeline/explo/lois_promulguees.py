"""Spike : lois promulguées depuis le début de la XVIIe, selon les actes PROM-PUB des dossiers AN
et selon la table `loi` de Dosleg (Sénat). Rapproche les deux par numéro de loi."""
import json
from pathlib import Path

import polars as pl

from an_dossier import RAW, parcourir, racines

DEBUT = "2024-07-18"
ICI = Path(__file__).parent


def an() -> pl.DataFrame:
    rows = []
    for p in RAW.glob("*.json"):
        d = json.loads(p.read_text())["dossierParlementaire"]
        for r in racines(d):
            for _, a in parcourir(r):
                if a["codeActe"] == "PROM-PUB":
                    rows.append({"dossier": p.stem, "proc": (d.get("procedureParlementaire") or {}).get("libelle"),
                                 "date": (a.get("dateActe") or "")[:10], "num": a.get("codeLoi"),
                                 "titre_an": a.get("titreLoi"), "senat": d["titreDossier"].get("senatChemin")})
    return pl.DataFrame(rows)


def senat() -> pl.DataFrame:
    loi = pl.read_parquet(ICI / "out_dosleg/loi.parquet")
    return (loi.filter(pl.col("date_loi").is_not_null())
               .select(pl.col("loicod").str.strip_chars(), pl.col("typloicod").str.strip_chars().alias("typ"),
                       pl.col("date_loi").str.slice(0, 10).alias("date_sn"), pl.col("loinumjo").alias("num_sn"),
                       pl.col("signet").str.strip_chars(), pl.col("loititjo").alias("titre_sn")))


if __name__ == "__main__":
    pl.Config.set_tbl_rows(60); pl.Config.set_fmt_str_lengths(90); pl.Config.set_tbl_width_chars(250)
    a = an().filter(pl.col("date") >= DEBUT)
    s = senat().filter(pl.col("date_sn") >= DEBUT)
    print("AN PROM-PUB depuis", DEBUT, ":", a.height, "| doublons de numéro :", a.height - a["num"].n_unique())
    print(a.group_by("proc").len().sort("len", descending=True))
    print("Sénat loi.date_loi depuis", DEBUT, ":", s.height)
    print(s.group_by("typ").len().sort("len", descending=True))
    print(s.head(3))
    a.write_parquet(ICI / "out_lois_an.parquet"); s.write_parquet(ICI / "out_lois_sn.parquet")
