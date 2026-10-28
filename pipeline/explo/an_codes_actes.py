"""Spike : inventaire des codes d'actes (suffixe générique) et statuts de conclusion, tous dossiers AN XVIIe."""
import json
import re
from collections import Counter

from an_dossier import RAW, parcourir, racines

codes, types, statuts, procs = Counter(), Counter(), Counter(), Counter()
exemples = {}
for p in RAW.glob("*.json"):
    d = json.loads(p.read_text())["dossierParlementaire"]
    procs[(d.get("@xsi:type"), (d.get("procedureParlementaire") or {}).get("libelle"))] += 1
    for r in racines(d):
        for _, a in parcourir(r):
            # AN1-COM-FOND -> ANx-COM-FOND : on neutralise le numéro de lecture
            c = re.sub(r"^(AN|SN)(\d|NLEC|LDEF|LNOUV)", r"\1*", a["codeActe"])
            codes[c] += 1
            types[a.get("@xsi:type")] += 1
            exemples.setdefault(c, p.stem)
            sc = a.get("statutConclusion")
            if sc:
                statuts[(c.split("-")[-1], sc.get("fam_code"), sc.get("libelle"))] += 1

print("== procédures"); [print(f"{n:6} {k}") for k, n in procs.most_common()]
print("== codes"); [print(f"{n:6} {k:<32} ex. {exemples[k]}") for k, n in sorted(codes.items())]
print("== types"); [print(f"{n:6} {k}") for k, n in types.most_common()]
print("== statuts"); [print(f"{n:6} {k}") for k, n in sorted(statuts.items())]
