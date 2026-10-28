"""Spike : liste les dossiers AN filtrés par libellé de procédure (sous-chaîne)."""
import json
import sys

from an_dossier import RAW

motif = sys.argv[1].lower()
for p in sorted(RAW.glob("*.json")):
    d = json.loads(p.read_text())["dossierParlementaire"]
    proc = (d.get("procedureParlementaire") or {}).get("libelle") or ""
    if motif in proc.lower():
        print(p.stem, "|", proc, "|", d["titreDossier"]["titre"][:110])
