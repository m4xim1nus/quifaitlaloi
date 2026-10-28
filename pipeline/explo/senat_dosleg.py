"""Spike : lit les blocs COPY du dump PostgreSQL Dosleg et écrit un parquet par table (tout en texte)."""
import re
from pathlib import Path

import polars as pl

DUMP = Path(__file__).resolve().parents[2] / "data/raw/senat_dosleg/x/dosleg.sql"
OUT = Path(__file__).parent / "out_dosleg"

ESC = {"t": "\t", "n": "\n", "r": "\r", "\\": "\\"}


def champ(v: str):
    if v == r"\N":
        return None
    return re.sub(r"\\(.)", lambda m: ESC.get(m.group(1), m.group(1)), v)


def tables():
    with DUMP.open(encoding="utf-8") as f:
        nom, cols, lignes = None, None, []
        for ligne in f:
            if nom is None:
                m = re.match(r"COPY (?:public\.)?(\w+) \((.*)\) FROM stdin;", ligne)
                if m:
                    nom, cols, lignes = m.group(1), [c.strip().strip('"') for c in m.group(2).split(",")], []
            elif ligne.rstrip("\n") == r"\.":
                yield nom, cols, lignes
                nom = None
            else:
                lignes.append([champ(v) for v in ligne.rstrip("\n").split("\t")])


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for nom, cols, lignes in tables():
        df = pl.DataFrame(lignes, schema={c: pl.Utf8 for c in cols}, orient="row")
        df.write_parquet(OUT / f"{nom}.parquet")
        print(f"{nom:<14} {df.height:>8}  {', '.join(cols)[:180]}")
