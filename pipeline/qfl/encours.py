"""Textes en cours : votés au moins une fois sous la XVIIe, ni promulgués ni adoptés définitivement
(docs/METHODO.md, section « Cycle Textes en cours »).

Mêmes règles que pour les lois (scrutin décisif, mode, coalition, groupe décisif), appliquées à
chaque lecture déjà votée. Ce ne sont pas des lois : ils sont exportés à part (`en_cours*.csv`) et
n'entrent dans aucun agrégat des lois.

Périmètre (règle fixe) : un dossier AN de projet ou de proposition de loi, sans promulgation ni
adoption définitive, dont au moins une lecture a été conclue en séance (AN ou Sénat) depuis le
début de la XVIIe. Il est écarté s'il est retiré, rejeté (Dosleg, ou rejet en première lecture
par la première assemblée saisie, hors textes financiers), caduc ou fusionné, ou s'il n'a connu
aucun acte de procédure depuis `INACTIVITE_MOIS` mois. Les écartés restent dans l'export, avec
leur motif (`motif_ecart`), pour l'audit.
"""

import re
from datetime import date

from . import an, parcours, referentiels
from .texte import titre_court, typographie

INACTIVITE_MOIS = 12
DEBUT = parcours.DEBUTS[max(parcours.DEBUTS)]
FINANCIERS = ("finances", "financement_ss")
AUTRE_CHAMBRE = {"AN": "SN", "SN": "AN"}


def seuil_inactivite(date_ref: str, mois: int = INACTIVITE_MOIS) -> str:
    """Date avant laquelle un texte sans acte de procédure est jugé enlisé (`date_ref` − `mois`)."""
    d = date.fromisoformat(date_ref)
    a, m = divmod(d.month - 1 - mois, 12)
    an_, mois_ = d.year + a, m + 1
    jour = min(d.day, 28 if mois_ == 2 else 30 if mois_ in (4, 6, 9, 11) else 31)
    return date(an_, mois_, jour).isoformat()


def _sans_doublon(titre: str) -> str:
    """« Projet de loi Projet de loi-cadre relatif… » (titre de dossier AN) → « Projet de loi-cadre relatif… »."""
    return re.sub(r"^(?:projet|proposition) de loi\s+(?=(?:projet|proposition) de loi)", "", titre, flags=re.I)


def closes(lectures: list[dict]) -> list[dict]:
    return [l for l in lectures if l["dec"] is not None]


def completer_senat(lectures: list[dict], loicod: str | None, decisions: dict, idx: parcours.Index) -> None:
    """Décision d'une lecture du Sénat que le dossier AN n'a pas encore enregistrée : lue dans
    Dosleg (texte adopté ou rejeté en séance), à défaut sur le scrutin public sur l'ensemble (ou la
    question préalable adoptée) de la même lecture. La lecture est marquée `decision_dosleg`."""
    if not loicod:
        return
    for l in lectures:
        if l["chambre"] != "SN" or l["dec"] is not None:
            continue
        dec = decisions.get((loicod, l["typlec"]))
        if dec is None:
            scr = [s for s in idx.sn.get((loicod, l["typlec"]), [])
                   if s["objet"] in ("ensemble", "article_unique") or (s["objet"] == "motion_rejet" and s["sort"] == "adopte")]
            if scr:
                s = max(scr, key=lambda s: (s["date"], s["numero"]))
                dec = (s["date"], "rejete" if s["objet"] == "motion_rejet" or s["sort"] == "rejete" else "adopte")
        if dec is None:
            continue
        jour, issue = dec
        l["dec"] = {"uid": f"{l['dossier']}-{l['etape']}-dosleg", "codeActe": f"{l['etape']}-DEBATS-DEC",
                    "dateActe": jour, "statutConclusion": {"fam_code": "TSORTF01" if issue == "adopte" else "TSORTF07"}}
        l["date"] = jour
        l["decision_dosleg"] = True
    lectures.sort(key=lambda l: (l["date"] or "9999", l["ordre_brut"]))


def motif_ecart(lectures: list[dict], evts: list[dict], type_loi: str, etat_dosleg: str | None,
                derniere_activite: str, date_ref: str) -> str | None:
    """Règle de périmètre : None si le texte est en cours, sinon le motif de son écart.

    Dans l'ordre : retrait (dossier AN ou Dosleg) ; rejet, caducité ou fusion selon Dosleg ;
    rejet de la première lecture par la première assemblée saisie (le texte n'est pas transmis),
    sauf pour une loi de finances ou de financement, transmise malgré le rejet ; aucun acte de
    procédure (dépôt, commission, séance, vote, y compris une séance déjà inscrite à l'ordre du
    jour) depuis `INACTIVITE_MOIS` mois. Un rejet suivi d'une autre lecture dans le dossier n'écarte
    pas le texte (il a été transmis).
    """
    if etat_dosleg == "retire" or any(e["type"] == "retrait" for e in evts):
        return "retire"
    if etat_dosleg in ("rejete", "caduc", "fusionne"):
        return etat_dosleg
    premiere = min(lectures, key=lambda l: l["rang"])
    suite = any(l["rang"] > premiere["rang"] for l in lectures)  # transmis malgré le rejet (comptes de la Sécurité sociale)
    if (premiere["dec"] is not None and premiere["type_lecture"] == "premiere" and type_loi not in FINANCIERS
            and not suite and parcours._statut(premiere["dec"])["issue"] == "rejete"):
        return "rejete"
    if derniere_activite < seuil_inactivite(date_ref):
        return "inactif"
    return None


def attente(lectures: list[dict], evts: list[dict], type_loi: str = "ordinaire") -> dict:
    """Où en est le texte, d'après ce que les dossiers enregistrent (aucun calendrier supposé).

    - `lecture` : une étape est ouverte dans le dossier (texte déposé ou transmis, pas encore voté) ;
    - `cmp` : commission mixte paritaire convoquée, sans issue enregistrée ;
    - `cmp_conclusions` : accord en CMP, conclusions pas encore votées dans les deux chambres ;
    - `transmis` : dernier vote favorable, étape suivante pas encore ouverte dans le dossier (le texte
      va à l'autre chambre, art. 45 de la Constitution). Un texte financier rejeté en première lecture
      par l'Assemblée est lui aussi transmis au Sénat (art. 47 et 47-1) ;
    - `navette` : dernier vote défavorable, ou désaccord en CMP, sans suite enregistrée.
    """
    cl = closes(lectures)
    der = max(cl, key=lambda l: (l["date"], l["rang"]))
    ouvertes = [l for l in lectures if l["dec"] is None and l["rang"] > der["rang"]]
    if ouvertes:
        o = max(ouvertes, key=lambda l: l["rang"])
        return {"attente": "lecture", "etape": o["etape"], "chambre": o["chambre"], "type_lecture": o["type_lecture"]}
    if der["type_lecture"] == "cmp":
        lues = {l["chambre"] for l in cl if l["type_lecture"] == "cmp"}
        reste = [c for c in ("AN", "SN") if c not in lues]
        return {"attente": "cmp_conclusions", "etape": "CMP", "chambre": reste[0] if len(reste) == 1 else None,
                "type_lecture": "cmp"}
    cmp_ = [e for e in evts if e["type"] in ("cmp_convoquee", "cmp_accord", "cmp_desaccord") and e["date"]
            and e["date"] >= der["date"]]
    if cmp_:
        rang = {"cmp_convoquee": 0, "cmp_accord": 1, "cmp_desaccord": 1}
        e = max(cmp_, key=lambda e: (e["date"], rang[e["type"]]))
        if e["type"] == "cmp_accord":
            return {"attente": "cmp_conclusions", "etape": "CMP", "chambre": None, "type_lecture": "cmp"}
        if e["type"] == "cmp_convoquee":
            return {"attente": "cmp", "etape": "CMP", "chambre": "CMP", "type_lecture": "cmp"}
        return {"attente": "navette", "etape": None, "chambre": None, "type_lecture": None}
    issue = parcours._statut(der["dec"])["issue"]
    if issue == "adopte" or (type_loi in FINANCIERS and der["chambre"] == "AN" and der["type_lecture"] == "premiere"):
        return {"attente": "transmis", "etape": None, "chambre": AUTRE_CHAMBRE.get(der["chambre"]), "type_lecture": None}
    return {"attente": "navette", "etape": None, "chambre": None, "type_lecture": None}


def seance_prevue(d: dict, att: dict, seances_senat: list[str], date_ref: str) -> str | None:
    """Première séance à venir (date ≥ `date_ref`) pour l'étape attendue : séance inscrite dans le
    dossier AN (`…-DEBATS-SEANCE` datée), ou séance du Sénat dans Dosleg (table date_seance)."""
    if att["attente"] not in ("lecture", "cmp_conclusions"):
        return None
    futures = []
    for e in an.enfants(d):
        if e["codeActe"] != att["etape"]:
            continue
        for a in an.parcourir(e):
            c = a["codeActe"]
            if "-DEBATS-" in c and c.endswith("-SEANCE") and parcours._date(a) >= date_ref:
                ch = "SN" if (c.startswith("SN") or "-SN-" in c) else "AN"
                if att["chambre"] in (None, ch):
                    futures.append(parcours._date(a))
    if att["chambre"] in ("SN", None):
        futures += [s for s in seances_senat if s >= date_ref]
    return min(futures, default=None)


def textes(autres: list[dict], idx: parcours.Index, dosleg: dict, exclus: set[str], date_ref: str
           ) -> tuple[list[dict], list[dict], list[dict]]:
    """Textes en cours (et écartés, avec leur motif), leurs lectures votées et leurs événements.

    `exclus` : scrutins déjà décisifs pour une loi, qu'une lecture d'un texte en cours ne peut pas
    reprendre (les lois gardent leur rattachement, contrôlé par les textes témoins).
    `dosleg` : `decisions` (senat.decisions_seance), `activite` et `seances` (par loicod), `etats`
    (loicod → état Dosleg), `themes`.
    """
    rows, toutes, rows_evt = [], [], []
    # Un dossier Sénat peut correspondre à deux dossiers AN (projet de loi constitutionnelle sur la
    # Corse : dossier du dépôt au Sénat, puis dossier du texte examiné). Les décisions lues dans
    # Dosleg ne complètent que le dossier principal : le plus avancé, puis le plus récent.
    def avance(c: dict) -> tuple:
        return (len(closes(c["lectures"])), max((l["date"] or "" for l in c["lectures"]), default=""), c["uid"])
    principal: dict[str, str] = {}
    for c in sorted(autres, key=avance):
        if c["sn"]:
            principal[c["sn"]["loicod"]] = c["uid"]
    for c in autres:
        uid, d, lectures, evts, sn = c["uid"], c["dossier"], c["lectures"], c["evts"], c["sn"]
        loicod = sn["loicod"] if sn else None
        if loicod and principal.get(loicod) == uid:
            completer_senat(lectures, loicod, dosleg["decisions"], idx)
        cl = closes(lectures)
        if not any(l["date"] >= DEBUT for l in cl):
            continue
        titre = typographie(d["titreDossier"]["titre"])
        complet = next((typographie(t) for t in c["titres"][1:] if t and t.lower().startswith(("projet", "proposition"))),
                       None) if not titre.lower().startswith(("projet", "proposition")) else titre
        typ, sous_type = parcours.type_loi(d, complet or titre, sn["typloicod"] if sn else None)
        for l in lectures:
            l["ctx"] = (loicod, c["titres"], typ)
            l["exclus"] = set(exclus)
            l.update(parcours.qualifier(l, idx, *l["ctx"]))
            l["loi_id"] = uid
        actes = [a for e in an.enfants(d) for a in an.parcourir(e)]
        dates = [parcours._date(a) for a in actes if parcours._date(a)] + [l["date"] for l in cl]
        dates += dosleg["activite"].get(loicod, []) if loicod else []
        etat = dosleg["etats"].get(loicod) if loicod else None
        motif = motif_ecart(lectures, evts, typ, etat, max(dates), date_ref)
        att = attente(lectures, evts, typ)
        der = max(cl, key=lambda l: (l["date"], l["rang"]))
        rows.append({
            "id": uid,
            "statut": "en_cours",
            "motif_ecart": motif,
            "titre": complet or titre,
            "titre_dossier": titre,
            "titre_court": referentiels.charger("titres_courts").get(uid)
            or parcours.titre_court_budget(complet or titre, sous_type) or titre_court(_sans_doublon(titre)),
            "type": typ,
            "sous_type": sous_type,
            "initiative": parcours._initiative(d),
            "procedure_an": (d.get("procedureParlementaire") or {}).get("libelle"),
            "date_depot": min((parcours._date(a) for a in actes if a["codeActe"].endswith("-DEPOT") and parcours._date(a)),
                              default=None),
            "date_derniere_lecture": der["date"],
            "issue_derniere_lecture": parcours._statut(der["dec"])["issue"],
            "date_derniere_activite": max(x for x in dates if x <= date_ref) if any(x <= date_ref for x in dates) else None,
            "attente": att["attente"],
            "attente_etape": att["etape"],
            "attente_chambre": att["chambre"],
            "attente_type_lecture": att["type_lecture"],
            "seance_prevue": seance_prevue(d, att, dosleg["seances"].get(loicod, []) if loicod else [], date_ref),
            "legislature": parcours.legislature(der["date"]),
            "dossier_an": uid,
            "signet_senat": sn["signet"] if sn else c["signet"],
            "loicod_senat": loicod,
            "etat_dosleg": etat,
            "url_an": parcours.URL_AN.format(leg=d.get("legislature") or 17, chemin=d["titreDossier"]["titreChemin"]),
            "url_senat": parcours.URL_SENAT.format(signet=sn["signet"] if sn else c["signet"]) if (sn or c["signet"]) else None,
            "procedure_acceleree": any(e["type"] == "procedure_acceleree" for e in evts),
            "themes": ";".join(dosleg["themes"].get((loicod or "").strip(), [])),
        })
        # lectures votées seulement : l'étape ouverte est décrite par `attente`. Une lecture close sans
        # décision et suivie d'une autre (délais budgétaires) reste, comme pour les lois.
        toutes += [l for l in lectures if l["dec"] is not None or l["rang"] < der["rang"]]
        rows_evt += [{"texte_id": uid, **e} for e in evts]
    parcours._departager(toutes, idx)
    cols = ("id", "loi_id", "dossier", "etape", "chambre", "type_lecture", "date", "statut_code", "statut",
            "issue", "decision_deduite", "art_49_3", "mode_adoption", "scrutin_id", "rattachement")
    rows_lect = [{**{k: l[k] for k in cols}, "decision_dosleg": bool(l.get("decision_dosleg"))} for l in toutes]
    for l in rows_lect:
        l["texte_id"] = l.pop("loi_id")
    return rows, rows_lect, rows_evt
