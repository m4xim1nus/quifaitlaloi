"""Spike : ventilation par groupe d'un ou plusieurs scrutins AN, avec libellé des organes (AMO)."""
import json
import sys
from pathlib import Path

RAW = Path(__file__).resolve().parents[2] / "data/raw"
ORGANES = RAW / "an_amo/x/json/organe"


def organe(uid: str) -> dict:
    o = json.loads((ORGANES / f"{uid}.json").read_text())["organe"]
    return {"sigle": o.get("libelleAbrev"), "libelle": o.get("libelle"), "type": o.get("codeType"),
            "debut": (o.get("viMoDe") or {}).get("dateDebut"), "fin": (o.get("viMoDe") or {}).get("dateFin")}


def ventilation(uid: str):
    s = json.loads((RAW / f"an_scrutins_17/x/json/{uid}.json").read_text())["scrutin"]
    print(f"\n{uid} {s['dateScrutin']} {s['typeVote']['codeTypeVote']} {s['sort']['code']} — {s['titre'][:150]}")
    print(f"  total : {s['syntheseVote']['decompte']}")
    for g in s["ventilationVotes"]["organe"]["groupes"]["groupe"]:
        o = organe(g["organeRef"])
        dv = g["vote"]["decompteVoix"]
        print(f"  {o['sigle'] or '?':<10} n={g['nombreMembresGroupe']:>3} maj={g['vote']['positionMajoritaire']:<10}"
              f" pour={dv['pour']:>3} contre={dv['contre']:>3} abst={dv['abstentions']:>3} nv={dv['nonVotants']:>3}")


if __name__ == "__main__":
    for uid in sys.argv[1:]:
        ventilation(uid)
