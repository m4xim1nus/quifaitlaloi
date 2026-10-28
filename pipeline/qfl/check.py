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
]


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
    n = _un(con, "select count(*) from lois where statut='promulguee'")
    controle("lois promulguées depuis le 18/07/2024", n >= 148, f"{n} (148 au 28/10/2026)")
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
                    "(l.issue='rejete' and not ((s.objet='motion_rejet' and s.sort='adopte') or s.sort='rejete')))")
    controle("issue de la lecture cohérente avec son scrutin décisif", not incoh, ", ".join(r[0] for r in incoh))
    ecarts = _q(con, "select s.id, s.pour, sum(p.pour) from scrutins s join positions_groupes p on p.scrutin_id=s.id "
                     "where s.chambre='AN' group by s.id having s.pour != sum(p.pour)")
    controle("AN : la ventilation par groupe redonne le total des pour", not ecarts, str(ecarts[:5]))
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
