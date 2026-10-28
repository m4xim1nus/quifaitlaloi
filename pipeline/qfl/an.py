"""Lecture des dumps de l'Assemblée nationale : scrutins, dossiers, mandats de groupe."""

import json
import re
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


def titres_textes(raw: Path, legislature: int) -> dict[str, set[str]]:
    """dossierRef → titres des projets et propositions de loi déposés ou adoptés (hors textes de
    commission, aux titres tronqués). Le titre d'un texte change en navette : l'intitulé d'un
    scrutin reprend parfois le titre du dépôt (« renforçant l'efficacité de l'administration… »
    pour la loi ESSOC)."""
    out: dict[str, set[str]] = {}
    d = extraits(raw, f"an_dossiers_{legislature}") / "json/document"
    for p in [*d.glob("PRJL*.json"), *d.glob("PION*.json")]:
        if "BTC" in p.stem:
            continue
        doc = json.loads(p.read_text())["document"]
        if doc.get("dossierRef"):
            out.setdefault(doc["dossierRef"], set()).add(doc["titres"]["titrePrincipal"])
    return out


def _projet(texte: str | None) -> str | None:
    """Numéro du projet visé par une déclaration ou une motion (« DECLANR5L16B0274-N0 » → « 16B0274 »)."""
    m = re.search(r"L(\d+)(B\d+)", texte or "")
    return m.group(1) + m.group(2) if m else None


def motions_censure(dossiers: dict[str, dict], scrutins: list[dict]) -> dict[tuple[str, str], list[str]]:
    """(date de l'engagement, projet) → scrutins des motions de censure déposées en réponse (art. 49, al. 3).

    Lus dans les dossiers « Engagement de la responsabilité » (actes AN21). Sous la XVIe,
    leurs motions n'ont pas de `voteRefs` : on apparie motions et scrutins de censure dans
    l'ordre (dépôt, numéro de motion ↔ numéro de scrutin), seulement si une législature en
    compte autant des deux côtés et que les rares `voteRefs` présents confirment l'ordre.
    L'ordre est conservé en XVIIe, où les `voteRefs` existent (une motion non votée y décale
    le compte : pas d'appariement par rang).
    """
    par_leg: dict[int, list[tuple]] = {}
    engagements: list[tuple[str, str, list]] = []
    for uid, d in dossiers.items():
        actes = [a for e in enfants(d) for a in parcourir(e)]
        dgvt = [a for a in actes if a["codeActe"] == "AN21-DGVT"]
        motions = [a for a in actes if a["codeActe"] == "AN21-MOTION"]
        votes = [a for a in actes if a["codeActe"] == "AN21-MOTION-VOTE"]
        if not motions:
            continue
        leg = int(re.match(r"DLR5L(\d+)", uid).group(1))
        refs = [r for v in votes for r in vote_refs(v)]
        lignes = []
        for i, m in enumerate(motions):
            n = re.search(r"-N(\d+)$", m.get("texteAssocie") or "")
            lignes.append(((m.get("dateActe") or "")[:10], int(n.group(1)) if n else 0, refs[i] if i < len(refs) else None))
        par_leg.setdefault(leg, []).extend(lignes)
        if dgvt:
            engagements.append(((dgvt[0].get("dateActe") or "")[:10], _projet(dgvt[0].get("texteAssocie")), lignes))
    moc = {}
    for s in scrutins:
        if s["type_vote"] == "MOC":
            moc.setdefault(s["legislature"], []).append(s)
    rang: dict[tuple, str] = {}
    for leg, lignes in par_leg.items():
        ss = sorted(moc.get(leg, []), key=lambda s: s["numero"])
        paires = list(zip(sorted(lignes), ss))
        # apparié seulement si les comptes concordent et que les voteRefs connus confirment l'ordre
        if len(ss) == len(lignes) and all(r is None or r == s["id"] for (_, _, r), s in paires):
            rang.update({m: s["id"] for m, s in paires})
    out: dict[tuple[str, str], list[str]] = {}
    for date, projet, lignes in engagements:
        ids = [r or rang.get((d, n, r)) for d, n, r in lignes]
        out[(date, projet)] = [i for i in ids if i]
    return out


def enfants(acte: dict) -> list[dict]:
    return _liste((acte.get("actesLegislatifs") or {}).get("acteLegislatif"))


def parcourir(acte: dict):
    yield acte
    for e in enfants(acte):
        yield from parcourir(e)


def vote_refs(acte: dict) -> list[str]:
    return _liste((acte.get("voteRefs") or {}).get("voteRef"))
