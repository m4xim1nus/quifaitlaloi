"""Spike : aplatit les scrutins AN XVIIe en une table polars (une ligne par scrutin)."""
import json
import sys
from collections import Counter
from pathlib import Path

import polars as pl

RAW = Path(__file__).resolve().parents[2] / "data/raw/an_scrutins_17/x/json"


def _dossier(d):
    # tantôt null, tantôt {"titre", "dossierRef"} (clés observées au spike)
    if not d:
        return None
    if isinstance(d, dict):
        return d.get("dossierRef") or json.dumps(d, ensure_ascii=False)
    return str(d)


def lire(path: Path) -> dict:
    s = json.loads(path.read_text())["scrutin"]
    sv = s["syntheseVote"]
    obj = s.get("objet") or {}
    return {
        "uid": s["uid"],
        "numero": int(s["numero"]),
        "date": s["dateScrutin"],
        "seance": s.get("seanceRef"),
        "type": s["typeVote"]["codeTypeVote"],
        "sort": s["sort"]["code"],
        "titre": s["titre"],
        "dossier": _dossier(obj.get("dossierLegislatif")),
        "ref_leg": json.dumps(obj.get("referenceLegislative"), ensure_ascii=False) if obj.get("referenceLegislative") else None,
        "demandeur": (s.get("demandeur") or {}).get("texte"),
        "pour": int(sv["decompte"]["pour"]),
        "contre": int(sv["decompte"]["contre"]),
        "abst": int(sv["decompte"]["abstentions"]),
        "exprimes": int(sv["suffragesExprimes"]),
        "mode_pub": s.get("modePublicationDesVotes"),
    }


def charger() -> pl.DataFrame:
    return pl.DataFrame([lire(p) for p in sorted(RAW.glob("*.json"))], infer_schema_length=None).sort("numero")


if __name__ == "__main__":
    df = charger()
    df.write_parquet(Path(__file__).parent / "out_an_scrutins.parquet")
    print(df.shape, df["date"].min(), df["date"].max())
    print(df.group_by("type").len())
    print(df.group_by("sort").len())
    print(df.group_by("mode_pub").len())
    print("dossier non nul :", df["dossier"].is_not_null().sum(), "ref_leg non nul :", df["ref_leg"].is_not_null().sum())
