"""Positions de groupe, cohésion, pivot et signature de coalition d'un scrutin (docs/METHODO.md).

Conventions :
- position d'un groupe = position majoritaire parmi ses votants (pour,
  contre, abstention ; les non-votants sont exclus), « partage » en cas
  d'égalité, « absent » sans votant ; cohésion = part de cette position ;
- motion de censure : seuls les « pour » sont recueillis. Un groupe est
  « censure » si plus de la moitié de ses membres la votent, sinon
  « pas_censure » ; cohésion = part majoritaire de ses membres ;
- pivot : le comportement du groupe a décidé du résultat (voir `pivot`).
"""

from collections import defaultdict

from . import referentiels

COTE = {"adopte": "pour", "rejete": "contre"}
OPPOSE = {"pour": "contre", "contre": "pour", "pas_censure": "censure", "censure": "pas_censure"}


def requis(exprimes: int) -> int:
    """Majorité absolue des suffrages exprimés."""
    return exprimes // 2 + 1


def position(g: dict, censure: bool) -> tuple[str, float | None, float | None]:
    """(position, cohésion, indice de Rice) d'un groupe sur un scrutin."""
    if censure:
        if not g["membres"]:
            return "absent", None, None
        p = g["pour"] / g["membres"]
        return ("censure" if p > 0.5 else "pas_censure"), max(p, 1 - p), None
    votes = {"pour": g["pour"], "contre": g["contre"], "abstention": g["abstention"]}
    total = sum(votes.values())
    if not total:
        return "absent", None, None
    haut = max(votes.values())
    gagnants = [k for k, v in votes.items() if v == haut]
    rice = abs(g["pour"] - g["contre"]) / (g["pour"] + g["contre"]) if g["pour"] + g["contre"] else None
    return (gagnants[0] if len(gagnants) == 1 else "partage"), haut / total, rice


def pivot(s: dict, g: dict) -> tuple[bool, bool]:
    """(pivot, pivot par abstention) du groupe `g` sur le scrutin `s`.

    Règle du basculement (validée par Max le 2026-10-28, docs/METHODO.md §10) :
    le groupe est décisif si, en votant à l'inverse, il renversait l'issue.

    - texte ou motion ordinaire adopté : si ses « pour » avaient voté contre,
      le texte tombait ;
    - rejeté : si ses « contre » avaient voté pour, il passait ;
    - motion de censure rejetée : si tous ses membres l'avaient votée, elle
      passait (« pivot de non-censure ») ; adoptée : sans ses voix, elle tombait ;
    - pivot par abstention (adopté, hors censure) : si ses abstentionnistes
      avaient voté contre, le texte tombait.
    """
    if s["type_vote"] == "MOC":
        if s["sort"] == "adopte":
            return s["pour"] - g["pour"] < s["requis"], False
        return s["pour"] + (g["membres"] - g["pour"]) >= s["requis"], False
    if s["sort"] == "adopte":
        # les exprimés ne changent pas : les « pour » du groupe deviennent des « contre »
        p = s["pour"] - g["pour"] < requis(s["exprimes"])
        a = s["pour"] < requis(s["exprimes"] + g["abstention"])
        return p, a
    return s["pour"] + g["contre"] >= requis(s["exprimes"]), False


def positions(s: dict, groupes: list[dict], blocs_par_groupe: dict[str, str]) -> list[dict]:
    """Lignes de positions_groupes d'un scrutin."""
    censure = s["type_vote"] == "MOC"
    out = []
    for g in groupes:
        pos, coh, rice = position(g, censure)
        pv, pa = pivot(s, g)
        votants = g["pour"] + g["contre"] + g["abstention"]
        out.append({**g, "bloc": blocs_par_groupe[g["groupe_id"]], "position": pos, "cohesion": coh, "rice": rice,
                    "participation": votants / g["membres"] if g["membres"] else None,
                    "pivot": pv, "pivot_abstention": pa})
    return out


def socle_a_date(date: str) -> list[str]:
    """Blocs du socle à une date (législature AN en cours)."""
    socle = referentiels.blocs()["socle"]
    leg = max((l for l, v in socle.items() if v["debut"] <= date[:10]), default=min(socle))
    return socle[leg]["blocs"]


def signature(s: dict, pos: list[dict], sigles: dict[str, str]) -> dict:
    """Signature de coalition du camp gagnant d'un scrutin.

    Camp gagnant : « pour » si adopté, « contre » si rejeté ; sur une motion
    de censure rejetée, les groupes qui ne la votent pas (« pas_censure »).
    """
    if s["type_vote"] == "MOC":
        cote = "censure" if s["sort"] == "adopte" else "pas_censure"
    else:
        cote = COTE[s["sort"]]
    socle = socle_a_date(s["date"])
    # position agrégée de chaque bloc (somme des voix de ses groupes)
    somme: dict[str, dict] = defaultdict(lambda: {"membres": 0, "pour": 0, "contre": 0, "abstention": 0})
    for p in pos:
        for k in ("membres", "pour", "contre", "abstention"):
            somme[p["bloc"]][k] += p[k]
    censure = s["type_vote"] == "MOC"
    blocs = {b: position(v, censure)[0] for b, v in somme.items()}
    socle_tot = {k: sum(somme[b][k] for b in socle) for k in ("membres", "pour", "contre", "abstention")}
    socle_pos = position(socle_tot, censure)[0]

    hors = [p for p in pos if p["bloc"] != "autres"]
    opposants = [p for p in hors if p["position"] == OPPOSE[cote]]
    soutiens = sorted({p["bloc"] for p in hors if p["position"] == cote and p["bloc"] not in socle})
    if not opposants:
        classe = "consensus"
    elif socle_pos != cote:
        classe = "hors_socle"
    elif "gauche" in soutiens and "rn" in soutiens:
        classe = "transpartisan"
    elif "rn" in soutiens:
        classe = "socle_rn"
    elif "gauche" in soutiens:
        classe = "socle_gauche"
    elif "droite" in soutiens:
        classe = "socle_droite"
    else:
        classe = "socle_seul"
    return {
        "scrutin_id": s["id"],
        "camp": cote,
        "classe": classe,
        "socle": "+".join(socle),
        "position_socle": socle_pos,
        **{f"bloc_{b}": blocs.get(b) for b in referentiels.blocs()["blocs"]},
        "gagnants_hors_socle": ",".join(sigles[p["groupe_id"]] for p in pos
                                        if p["position"] == cote and p["bloc"] not in socle),
        "pivots": ",".join(sigles[p["groupe_id"]] for p in pos if p["pivot"]),
        # pivots extérieurs au socle : sur une censure, un groupe du socle est
        # mécaniquement « pivot » (s'il la votait, elle passait) sans que ce soit informatif
        "pivots_hors_socle": ",".join(sigles[p["groupe_id"]] for p in pos if p["pivot"] and p["bloc"] not in socle),
        "pivots_abstention": ",".join(sigles[p["groupe_id"]] for p in pos if p["pivot_abstention"]),
    }
