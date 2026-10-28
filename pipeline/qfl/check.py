"""Contrôles de la base produite : invariants, textes témoins, candidats à arbitrer.

Un invariant ou un texte témoin en échec fait échouer `qfl check`. Les
candidats (rejet inversé non arbitré, etc.) sont listés sans faire échouer.
"""

import sqlite3
from pathlib import Path

from . import referentiels


def _q(con, sql: str, *args) -> list[tuple]:
    return con.execute(sql, args).fetchall()


def _un(con, sql: str, *args):
    r = _q(con, sql, *args)
    return r[0][0] if r else None


# Faits établis (docs/SOURCES.md, cas témoins ; datan.fr pour V2957 et V4758).
TEMOINS = [
    ("Duplomb : 1re lecture AN close par la motion de rejet V2105",
     "select scrutin_id from lectures where id='DLR5L17N50819-AN1'", "VTANR5L17V2105"),
    ("Duplomb : texte CMP adopté par scrutin solennel V2957",
     "select mode_adoption || ' ' || scrutin_id from lectures where id='DLR5L17N50819-CMP-AN'",
     "SCRUTIN_SOLENNEL VTANR5L17V2957"),
    ("Duplomb : V2957, 316 pour, 223 contre, 25 abstentions",
     "select pour || '-' || contre || '-' || abstention from scrutins where id='VTANR5L17V2957'", "316-223-25"),
    ("Duplomb : RN 119 pour, 2 abstentions (datan.fr)",
     "select p.pour || '-' || p.abstention from positions_groupes p join groupes g on g.id=p.groupe_id "
     "where scrutin_id='VTANR5L17V2957' and g.sigle='RN'", "119-2"),
    ("Duplomb : coalition socle + RN, RN pivot",
     "select classe_an || ' ' || pivots_hors_socle_an from lois where id='2025-794'", "socle_rn RN"),
    ("Duplomb : rejet inversé (100 % des voix de la motion viennent des soutiens du texte)",
     "select mode_adoption || ' ' || score_rejet_inverse from lectures where id='DLR5L17N50819-AN1'",
     "REJET_INVERSE 1.0"),
    ("Nouvelle-Calédonie (2025-1055) : rejet inversé (66 %), contournement",
     "select l.mode_adoption || ' ' || o.contournement from lectures l join lois o on o.id=l.loi_id "
     "where l.id='DLR5L17N52655-AN1'", "REJET_INVERSE 1"),
    ("Assurance chômage (2026-470) : 1re lecture AN rejetée par suppression de l'article unique (V6283)",
     "select issue || ' ' || mode_adoption || ' ' || scrutin_id from lectures where id='DLR5L17N53981-AN1'",
     "rejete SCRUTIN_ORDINAIRE VTANR5L17V6283"),
    ("Parité municipale (2025-444) : 1re lecture AN sous la XVe, scrutin ordinaire V4360",
     "select mode_adoption || ' ' || scrutin_id from lectures where id='DLR5L15N43846-AN1'",
     "SCRUTIN_ORDINAIRE VTANR5L15V4360"),
    ("PLF 2026 : 1re lecture AN rejetée (V4241)",
     "select issue || ' ' || scrutin_id from lectures where id='DLR5L17N52428-AN1'", "rejete VTANR5L17V4241"),
    ("PLF 2026 : 49.3 en nouvelle lecture et en lecture définitive",
     "select group_concat(etape) from (select etape from lectures where loi_id='2026-103' "
     "and mode_adoption='ART_49_3' order by date)", "ANNLEC,ANLDEF"),
    ("PLF 2026 : contournement", "select contournement from lois where id='2026-103'", 1),
    ("PLFSS 2025 : 1re lecture AN close par l'expiration des délais",
     "select mode_adoption from lectures where id='DLR5L17N50588-AN1'", "DELAI_EXPIRE"),
    ("PLFSS 2025 : 49.3 sur le texte CMP suivi de la censure (V519)",
     "select issue || ' ' || scrutin_id from lectures where id='DLR5L17N50588-CMP-AN'", "rejete VTANR5L17V519"),
    ("LFSS 2026 : lecture définitive adoptée 247-232 (V4758, datan.fr)",
     "select s.pour || '-' || s.contre from lois l join scrutins s on s.id=l.scrutin_an where l.id='2025-1403'",
     "247-232"),
    ("LFSS 2026 : SOC pour (64), pivot",
     "select p.pour || ' ' || p.pivot from positions_groupes p join groupes g on g.id=p.groupe_id "
     "where scrutin_id='VTANR5L17V4758' and g.sigle='SOC'", "64 1"),
    ("Paris-Lyon-Marseille : nouvelle lecture AN retrouvée malgré la décision égarée (V2954)",
     "select scrutin_id from lectures where id='DLR5L17N50692-ANNLEC'", "VTANR5L17V2954"),
    ("Meublés de tourisme : lecture Sénat des conclusions de CMP déduite",
     "select decision_deduite from lectures where id='DLR5L16N47722-CMP-SN'", 1),
    # Baselines (XVe, XVIe)
    ("Retraites 2023 (2023-270) : 1re lecture AN close par l'expiration des délais (art. 47-1)",
     "select mode_adoption from lectures where id='DLR5L16N47066-AN1'", "DELAI_EXPIRE"),
    ("Retraites 2023 : 49.3 sur le texte CMP, motion LIOT miroir (V1240, 278 voix)",
     "select l.mode_adoption || ' ' || s.id || ' ' || s.pour from lectures l join scrutins s on s.id=l.scrutin_id "
     "where l.id='DLR5L16N47066-CMP-AN'", "ART_49_3 VTANR5L16V1240 278"),
    ("Retraites 2023 : LR pivot de non-censure (19 censeurs sur 61)",
     "select pivots_hors_socle_an from lois where id='2023-270'", "LR"),
    ("Retraites 2023 : vote unique au Sénat (SN2022-249, 195-112) retrouvé malgré son intitulé",
     "select scrutin_id from lectures where id='DLR5L16N47066-SN1'", "SN2022-249"),
    ("PLF 2023 : 1re partie au 49.3, motion NUPES miroir (V358, 239 voix)",
     "select scrutin_id from lectures where id='DLR5L16N45988-AN1'", "VTANR5L16V358"),
    ("Immigration (2024-42) : motion de rejet adoptée (V3203, 270-265), non requalifiée (48 %)",
     "select l.mode_adoption || ' ' || s.pour || '-' || s.contre || ' ' || l.score_rejet_inverse from lectures l "
     "join scrutins s on s.id=l.scrutin_id where l.id='DLR5L16N47118-AN1'", "MOTION_REJET 270-265 0.478"),
    ("Immigration : texte CMP adopté par scrutin solennel V3213 (349-186), RN pivot",
     "select l.scrutin_an || ' ' || s.pour || '-' || s.contre || ' ' || l.pivots_hors_socle_an from lois l "
     "join scrutins s on s.id=l.scrutin_an where l.id='2024-42'", "VTANR5L16V3213 349-186 RN"),
    ("Bioéthique (2021-1017) : lecture définitive 326-115-42 (V3855)",
     "select s.pour || '-' || s.contre || '-' || s.abstention from lois l join scrutins s on s.id=l.scrutin_an "
     "where l.id='2021-1017'", "326-115-42"),
    ("Manipulation de l'information : loi organique et loi ordinaire ont chacune leur scrutin",
     "select count(distinct scrutin_id) from lectures where id in ('DLR5L15N36468-AN1','DLR5L15N36488-AN1')", 2),
    ("Services aériens Tchad-Angola (2020-86) : pas de scrutin public (celui du jour porte sur l'Éthiopie)",
     "select mode_adoption from lectures where id='DLR5L15N37132-AN1'", "MAIN_LEVEE"),
    ("Dialogue social (2017-1340) : CMP adoptée au Sénat par scrutin public (SN2016-142, 225-109, compte rendu)",
     "select s.pour || '-' || s.contre from lectures l join scrutins s on s.id=l.scrutin_id "
     "where l.id='DLR5L15N35836-CMP-SN'", "225-109"),
    ("Budget 2026 : désaccord en CMP daté de la réunion (19/12/2025), pas de l'acte saisi le 02/01/2026",
     "select date from evenements where loi_id='2026-103' and type='cmp_desaccord'", "2025-12-19"),
    ("ESSOC (2018-727) : nouvelle lecture retrouvée sous le titre du dépôt (V995)",
     "select scrutin_id from lectures where id='DLR5L15N36159-ANNLEC'", "VTANR5L15V995"),
]

# Ventilations incomplètes dans le dump AN de la XVe (docs/SOURCES.md, anomalie 20).
VENTILATIONS_INCOMPLETES = {
    "VTANR5L15V2816": "groupe MoDem absent de la ventilation (46 voix pour)",
    "VTANR5L15V3778": "une voix pour non ventilée",
}


def verifier(chemin: Path) -> tuple[bool, list[str]]:
    if not chemin.exists():
        return False, [f"base absente : {chemin} (lancer `qfl build`)"]
    con = sqlite3.connect(chemin)
    ok, out = True, []

    def controle(nom: str, reussi: bool, detail: str = "") -> None:
        nonlocal ok
        ok &= reussi
        out.append(f"{'OK ' if reussi else 'ÉCHEC'} {nom}" + (f" : {detail}" if detail else ""))

    out.append("== Invariants")
    for leg, attendu in ((15, 318), (16, 141), (17, 147)):
        n = _un(con, "select count(*) from lois where statut='promulguee' and legislature=?", leg)
        controle(f"lois promulguées, législature {leg}", n >= attendu, f"{n} ({attendu} au 28/10/2026)")
    controle("chaque loi a au moins une lecture close",
             not _un(con, "select count(*) from lois where n_lectures = 0"))
    sans = _q(con, "select id from lois where id not in (select loi_id from lectures where chambre='AN' "
                   "and issue!='sans_decision') or id not in (select loi_id from lectures where chambre='SN' "
                   "and issue!='sans_decision')")
    controle("chaque loi a une lecture close dans chaque chambre", not sans, ", ".join(r[0] for r in sans))
    doubles = _q(con, "select scrutin_id, count(*) from lectures where scrutin_id is not null "
                      "and mode_adoption!='ART_49_3' group by 1 having count(*) > 1")
    controle("un scrutin décisif ne sert qu'une lecture", not doubles, str(doubles))
    incoh = _q(con, "select l.id from lectures l join scrutins s on s.id=l.scrutin_id "
                    "where l.mode_adoption not in ('ART_49_3') and ("
                    "(l.issue='adopte' and (s.sort!='adopte' or s.objet not in ('ensemble','article_unique'))) or "
                    "(l.issue='rejete' and not ((s.objet in ('motion_rejet','suppression_article_unique') and s.sort='adopte') "
                    "or s.sort='rejete')))")
    controle("issue de la lecture cohérente avec son scrutin décisif", not incoh, ", ".join(r[0] for r in incoh))
    ecarts = _q(con, "select s.id, s.pour, sum(p.pour) from scrutins s join positions_groupes p on p.scrutin_id=s.id "
                     "where s.chambre='AN' group by s.id having s.pour != sum(p.pour)")
    connus = [e for e in ecarts if e[0] in VENTILATIONS_INCOMPLETES]
    ecarts = [e for e in ecarts if e[0] not in VENTILATIONS_INCOMPLETES]
    controle("AN : la ventilation par groupe redonne le total des pour", not ecarts, str(ecarts[:5]))
    for sid, *_ in connus:
        out.append(f"info {sid} : ventilation incomplète dans la source ({VENTILATIONS_INCOMPLETES[sid]})")
    ecarts_sn = _q(con, "select s.id, s.pour, sum(p.pour) from scrutins s join positions_groupes p "
                        "on p.scrutin_id=s.id where s.chambre='SN' group by s.id having s.pour != sum(p.pour)")
    out.append(f"info Sénat : {len(ecarts_sn)} scrutins dont la ventilation nominative diffère du total proclamé "
               f"(délégations, rectifications) {ecarts_sn[:5]}")
    blocs = set(referentiels.blocs()["blocs"])
    hors = _q(con, "select distinct bloc from groupes")
    controle("tout groupe a un bloc connu", all(b in blocs for (b,) in hors))

    out.append("\n== Textes témoins")
    for nom, sql, attendu in TEMOINS:
        obtenu = _un(con, sql)
        controle(nom, obtenu == attendu, "" if obtenu == attendu else f"obtenu {obtenu!r}, attendu {attendu!r}")

    out.append("\n== Motions de rejet adoptées à l'AN (règle du rejet inversé)")
    for sid, score, mode, loi in _q(con, "select scrutin_id, score_rejet_inverse, mode_adoption, loi_id from lectures "
                                         "where chambre='AN' and mode_adoption in ('MOTION_REJET','REJET_INVERSE') "
                                         "order by date"):
        out.append(f"  {sid} (loi {loi}) : part des voix de la motion venant des soutiens du texte = {score} → {mode}")
    flags = referentiels.flags()
    attente = [f"{n}:{k}" for n in ("vote_bloque", "main_levee_confirmee")
               for k, v in (flags.get(n) or {}).items() if v.get("statut") == "a_valider"]
    out.append(f"  flags manuels en attente : {', '.join(attente) or 'aucun'}")
    con.close()
    return ok, out
