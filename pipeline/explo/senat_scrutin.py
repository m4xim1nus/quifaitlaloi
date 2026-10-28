"""Spike : ventile un scrutin Sénat par groupe (Dosleg votsen × ODSEN_HISTOGROUPES)
et compare à la ventilation publiée sur la page HTML du scrutin (si présente en cache)."""
import html
import re
import sys
from pathlib import Path

import polars as pl

ICI = Path(__file__).parent
RAW = ICI.parents[1] / "data/raw"


def histogroupes() -> pl.DataFrame:
    lignes = (RAW / "senat_senateurs/ODSEN_HISTOGROUPES.csv").read_text(encoding="latin-1").splitlines()
    corps = "\n".join(l for l in lignes if not l.startswith("%"))
    df = pl.read_csv(corps.encode(), infer_schema_length=0)
    df = df.rename({"Matricule": "senmat", "Code du groupe politique": "groupe",
                    "Date de début d'appartenance": "debut", "Date de fin d'appartenance": "fin"})
    return (df.select("senmat", "groupe", "Nom court du groupe politique", "debut", "fin").unique()
              .with_columns(pl.col("debut").str.slice(0, 10), pl.col("fin").str.slice(0, 10)))


def ventiler(sesann: str, scrnum: str) -> pl.DataFrame:
    scr = pl.read_parquet(ICI / "out_dosleg/scr.parquet").filter(
        (pl.col("sesann") == sesann) & (pl.col("scrnum") == scrnum))
    date = scr["scrdat"][0][:10]
    print(scr.select("scrdat", "scrpou", "scrcon", "scrvot", "scrsuf", "scrint").to_dicts()[0])
    v = pl.read_parquet(ICI / "out_dosleg/votsen.parquet").filter(
        (pl.col("sesann") == sesann) & (pl.col("scrnum") == scrnum))
    pos = {"1": "pour", "2": "contre", "3": "abst", "4": "nv"}
    g = histogroupes().filter((pl.col("debut") <= date) & (pl.col("fin").is_null() | (pl.col("fin") >= date)))
    j = v.with_columns(pl.col("senmat").str.strip_chars()).join(g, on="senmat", how="left")
    print("votes sans groupe à la date :", j["groupe"].is_null().sum(), "/", j.height,
          "| sénateurs avec 2 groupes :", j.height - v.height)
    return (j.with_columns(pl.col("posvotcod").str.strip_chars().replace_strict(pos).alias("pos"))
             .pivot(on="pos", index="groupe", values="senmat", aggregate_function="len").fill_null(0)
             .sort("groupe"))


def officiel(sesann: str, scrnum: str) -> list[tuple]:
    p = RAW / f"senat_scrutins_json/scr{sesann}-{scrnum}.html"
    if not p.exists():
        return []
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", p.read_text(errors="replace"), flags=re.S)
    txt = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t)))
    motif = (r"(Groupe [^:]+|Réunion administrative[^:]+|Sénateurs ne figurant[^:]+) : (\d+) sénateurs?"
             r"(?: Pour : (\d+))?(?: Contre : (\d+))?(?: Abstentions? : (\d+))?(?: N'(?:a|ont) pas pris part au vote : (\d+))?")
    return [m.groups() for m in re.finditer(motif, txt)]


if __name__ == "__main__":
    pl.Config.set_tbl_rows(30)
    sesann, scrnum = sys.argv[1], sys.argv[2]
    print(ventiler(sesann, scrnum))
    for o in officiel(sesann, scrnum):
        print(o)
