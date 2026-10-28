"""Spike : pour chaque décision de séance AN (…-DEBATS-DEC) des lois promulguées XVIIe,
retrouve le scrutin décisif : voteRefs explicite, sinon même séance + titre, sinon rien (main levée ?)."""
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

import polars as pl

from an_dossier import RAW, parcourir, racines

ICI = Path(__file__).parent


def norm(t: str) -> str:
    t = re.sub(r"[’'`]", " ", t or "")
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", t)).strip()


def cle(titre: str) -> str:
    t = norm(titre)
    t = re.sub(r"^(projet|proposition) de loi (organique |constitutionnelle )?", "", t)
    return t[:60]


scr = pl.read_parquet(ICI / "out_an_scrutins.parquet")
par_seance: dict[str, list[dict]] = {}
for s in scr.iter_rows(named=True):
    par_seance.setdefault(s["seance"], []).append(s)

lois = pl.read_parquet(ICI / "out_lois_an.parquet")
stats, exemples = Counter(), {}
for row in lois.iter_rows(named=True):
    d = json.loads((RAW / f"{row['dossier']}.json").read_text())["dossierParlementaire"]
    k = cle(d["titreDossier"]["titre"])
    for r in racines(d):
        for _, a in parcourir(r):
            c = a["codeActe"]
            if not (c.startswith(("AN", "CMP-DEBATS-AN")) and c.endswith("DEBATS-DEC") or c == "CMP-DEBATS-AN-DEC"):
                continue
            statut = (a.get("statutConclusion") or {}).get("libelle") or "?"
            if "49, alinéa 3" in statut:
                cas = "49.3 (pas de vote attendu)"
            elif a.get("voteRefs"):
                cas = "voteRefs explicite"
            else:
                cands = [s for s in par_seance.get(a.get("reunionRef"), [])
                         if k[:40] in norm(s["titre"]) and re.match(r"(l )?(ensemble|la motion de rejet|l article unique)", norm(s["titre"]))]
                if len(cands) == 1:
                    cas = "séance + titre (1 candidat)"
                elif cands:
                    cas = f"séance + titre ({len(cands)} candidats)"
                elif not a.get("reunionRef"):
                    cas = "pas de reunionRef"
                else:
                    cas = "aucun scrutin trouvé"
            stats[cas] += 1
            exemples.setdefault(cas, []).append((row["num"], c, statut[:30]))

for cas, n in stats.most_common():
    print(f"{n:5}  {cas:<32} ex. {exemples[cas][:3]}")

# Détail des « aucun scrutin trouvé » : type de texte, et y a-t-il des scrutins sur ce texte dans la séance ?
print()
procs = dict(lois.select("num", "proc").iter_rows())
for num, c, statut in exemples.get("aucun scrutin trouvé", []):
    print(f"  {num:<10} {c:<20} {statut:<30} {procs[num]}")
