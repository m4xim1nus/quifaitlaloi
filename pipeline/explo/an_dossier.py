"""Spike : affiche l'arbre des actes législatifs d'un dossier AN (uid ou chemin)."""
import json
import sys
from pathlib import Path

RAW = Path(__file__).resolve().parents[2] / "data/raw/an_dossiers_17/x/json/dossierParlementaire"


def enfants(acte: dict) -> list[dict]:
    sous = (acte.get("actesLegislatifs") or {}).get("acteLegislatif")
    if sous is None:
        return []
    return sous if isinstance(sous, list) else [sous]


def parcourir(acte: dict, prof: int = 0):
    yield prof, acte
    for e in enfants(acte):
        yield from parcourir(e, prof + 1)


def racines(dossier: dict) -> list[dict]:
    return enfants(dossier)


def details(a: dict) -> str:
    bits = []
    for k in ("texteAssocie", "texteAdopte", "voteRefs", "statutConclusion", "decision", "codeLoi",
              "infoJO", "typeMotion", "typeMotionCensure", "auteurMotion", "reunionRef", "provenance",
              "casSaisine", "urlConclusion", "titreLoi", "urlLegifrance", "referenceNOR", "dateJO"):
        if a.get(k):
            bits.append(f"{k}={json.dumps(a[k], ensure_ascii=False)[:160]}")
    return " ".join(bits)


if __name__ == "__main__":
    uid = sys.argv[1]
    d = json.loads((RAW / f"{uid}.json").read_text())["dossierParlementaire"]
    print(d["titreDossier"]["titre"])
    for prof, a in (x for r in racines(d) for x in parcourir(r)):
        date = (a.get("dateActe") or "")[:10]
        print(f"{'  '*prof}{a['codeActe']:<28} {date:<10} {a['@xsi:type']:<32} {details(a)}")
