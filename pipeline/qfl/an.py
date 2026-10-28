"""Lecture des dumps de l'Assemblée nationale : scrutins, dossiers, mandats de groupe."""

import json
import sys
from collections import Counter
from functools import cache
from pathlib import Path

from .sources import extraits
from .texte import objet_scrutin


def _int(v) -> int:
    return int(v or 0)


def _liste(v) -> list:
    if v is None:
        return []
    return v if isinstance(v, list) else [v]


# --- Mandats de groupe (AMO), pour les ventilations où l'organe manque ----------

@cache
def _mandats_gp(raw: Path) -> dict[str, list[tuple[str, str, str]]]:
    """acteurRef → [(organeRef, début, fin)] des mandats de groupe politique."""
    out: dict[str, list] = {}
    for p in (extraits(raw, "an_amo") / "json/acteur").glob("*.json"):
        a = json.loads(p.read_text())["acteur"]
        uid = a["uid"]["#text"] if isinstance(a["uid"], dict) else a["uid"]
        for m in _liste((a.get("mandats") or {}).get("mandat")):
            if m.get("typeOrgane") == "GP":
                out.setdefault(uid, []).append(
                    (m["organes"]["organeRef"], m["dateDebut"], m.get("dateFin") or "9999"))
    return out


def _groupe_a_date(raw: Path, acteur: str, date: str) -> str | None:
    for organe, debut, fin in _mandats_gp(raw).get(acteur, []):
        if debut <= date <= fin:
            return organe
    return None


def _votants(vote: dict) -> list[str]:
    nom = vote.get("decompteNominatif") or {}
    return [v["acteurRef"] for k in ("pours", "contres", "abstentions", "nonVotants")
            for v in _liste((nom.get(k) or {}).get("votant") if isinstance(nom.get(k), dict) else None)]


def _resoudre_organe(raw: Path, groupe: dict, date: str) -> str | None:
    """Organe d'une ventilation notée `PO0` (anomalie du dump) : groupe majoritaire de ses votants à la date."""
    c = Counter(o for a in _votants(groupe["vote"]) if (o := _groupe_a_date(raw, a, date)))
    return c.most_common(1)[0][0] if c else None


# --- Scrutins ----------------------------------------------------------------

def scrutins(raw: Path, legislature: int) -> tuple[list[dict], list[dict]]:
    """Scrutins publics d'une législature (hors Congrès) et leur ventilation par groupe."""
    rows, ventil = [], []
    anomalies = 0
    for p in sorted((extraits(raw, f"an_scrutins_{legislature}") / "json").glob("VTANR5*.json")):
        s = json.loads(p.read_text())["scrutin"]
        sv = s["syntheseVote"]
        dec = sv["decompte"]
        obj = s.get("objet") or {}
        dl = obj.get("dossierLegislatif")
        rows.append({
            "id": s["uid"],
            "chambre": "AN",
            "legislature": legislature,
            "numero": int(s["numero"]),
            "date": s["dateScrutin"],
            "seance": s.get("seanceRef"),
            "type_vote": s["typeVote"]["codeTypeVote"],
            "titre": s["titre"],
            "objet": objet_scrutin(s["titre"]),
            "sort": "adopte" if s["sort"]["code"] == "adopté" else "rejete",
            "pour": _int(dec["pour"]),
            "contre": _int(dec["contre"]),
            "abstention": _int(dec["abstentions"]),
            "votants": _int(sv["nombreVotants"]),
            "exprimes": _int(sv["suffragesExprimes"]),
            "requis": _int(sv["nbrSuffragesRequis"]),
            "demandeur": (s.get("demandeur") or {}).get("texte"),
            "dossier_an": dl.get("dossierRef") if isinstance(dl, dict) else None,
        })
        groupes = _liste(s["ventilationVotes"]["organe"]["groupes"]["groupe"])
        for g in groupes:
            organe = g["organeRef"]
            if organe == "PO0":
                anomalies += 1
                organe = _resoudre_organe(raw, g, s["dateScrutin"])
                if organe is None:
                    continue  # aucun votant : la ventilation n'apporte aucune voix
            dv = g["vote"]["decompteVoix"]
            ventil.append({
                "scrutin_id": s["uid"],
                "groupe_id": organe,
                "membres": _int(g["nombreMembresGroupe"]),
                "pour": _int(dv["pour"]),
                "contre": _int(dv["contre"]),
                "abstention": _int(dv["abstentions"]),
                # nonVotantsVolontaires recopie toujours les abstentions (XVIe et XVIIe) : ignoré
                "non_votants": _int(dv.get("nonVotants")),
            })
    if anomalies:
        print(f"AN XV{'I' * (legislature - 15)}e : {anomalies} ventilations sans organe (PO0) "
              "rattachées par les mandats de leurs votants", file=sys.stderr)
    return rows, ventil


# --- Dossiers ----------------------------------------------------------------

def dossiers(raw: Path, legislature: int) -> dict[str, dict]:
    """uid → dossierParlementaire."""
    d = extraits(raw, f"an_dossiers_{legislature}") / "json/dossierParlementaire"
    return {p.stem: json.loads(p.read_text())["dossierParlementaire"] for p in d.glob("*.json")}


def enfants(acte: dict) -> list[dict]:
    return _liste((acte.get("actesLegislatifs") or {}).get("acteLegislatif"))


def parcourir(acte: dict):
    yield acte
    for e in enfants(acte):
        yield from parcourir(e)


def vote_refs(acte: dict) -> list[str]:
    return _liste((acte.get("voteRefs") or {}).get("voteRef"))
