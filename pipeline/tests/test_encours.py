"""Textes en cours : règle de périmètre, prochaine étape, décisions du Sénat lues dans Dosleg."""

import sqlite3

import pytest

from qfl import encours, parcours

REF = "2026-10-28"


def lecture(etape, chambre, type_lecture, rang, date=None, statut=None, typlec="1"):
    """Lecture au format de `parcours.lectures_dossier` ; `statut` : code TSORTF… (None = pas de décision)."""
    dec = {"codeActe": f"{etape}-DEBATS-DEC", "dateActe": date, "statutConclusion": {"fam_code": statut}} if statut else None
    return {"dossier": "DLRTEST", "etape": etape, "chambre": chambre, "type_lecture": type_lecture, "typlec": typlec,
            "rang": rang, "ordre_brut": rang, "dec": dec, "date": date or ""}


ADOPTE, MODIFIE, REJETE = "TSORTF01", "TSORTF05", "TSORTF07"


def test_seuil_inactivite():
    assert encours.seuil_inactivite("2026-10-28") == "2025-10-28"
    assert encours.seuil_inactivite("2026-10-28", 6) == "2026-04-28"
    assert encours.seuil_inactivite("2024-02-29") == "2023-02-28"


# --- Règle de périmètre ---------------------------------------------------------

def test_legitime_defense_en_cours():
    """Adoptée à l'AN le 07/07/2026, transmise au Sénat : en cours."""
    ls = [lecture("AN1", "AN", "premiere", 0, "2026-07-07", ADOPTE), lecture("SN1", "SN", "premiere", 1)]
    assert encours.motif_ecart(ls, [], "ordinaire", "en_cours", "2026-07-07", REF) is None


def test_inactif_au_dela_de_douze_mois():
    """Impôt plancher de 2 % : rien depuis le 12/06/2025 (plus d'un an avant l'instantané)."""
    ls = [lecture("AN1", "AN", "premiere", 0, "2025-02-20", ADOPTE),
          lecture("SN1", "SN", "premiere", 1, "2025-06-12", REJETE), lecture("AN2", "AN", "deuxieme", 2)]
    assert encours.motif_ecart(ls, [], "ordinaire", "en_cours", "2025-06-12", REF) == "inactif"
    # une séance inscrite à l'ordre du jour compte comme activité
    assert encours.motif_ecart(ls, [], "ordinaire", "en_cours", "2026-11-19", REF) is None
    # la limite est incluse
    assert encours.motif_ecart(ls, [], "ordinaire", "en_cours", "2025-10-28", REF) is None


def test_rejet_par_la_premiere_assemblee():
    """Rejeté en première lecture par la première assemblée saisie : le texte n'est pas transmis."""
    ls = [lecture("AN1", "AN", "premiere", 0, "2026-10-01", REJETE)]
    assert encours.motif_ecart(ls, [], "ordinaire", None, "2026-10-01", REF) == "rejete"
    # loi de financement : transmise au Sénat malgré le rejet (PLFSS 2027)
    assert encours.motif_ecart(ls, [], "financement_ss", None, "2026-10-23", REF) is None
    # rejet suivi d'une autre lecture : le texte a été transmis (comptes de la Sécurité sociale)
    ls2 = ls + [lecture("SN1", "SN", "premiere", 1, "2026-10-10", MODIFIE)]
    assert encours.motif_ecart(ls2, [], "ordinaire", "en_cours", "2026-10-10", REF) is None


def test_rejet_par_la_seconde_assemblee_ne_clot_pas():
    """Corse : adopté à l'AN, rejeté au Sénat, la navette continue."""
    ls = [lecture("AN1", "AN", "premiere", 0, "2026-06-23", ADOPTE),
          lecture("SN1", "SN", "premiere", 1, "2026-10-26", REJETE)]
    assert encours.motif_ecart(ls, [], "constitutionnelle", "en_cours", "2026-10-26", REF) is None


def test_etats_dosleg_et_retrait():
    ls = [lecture("SN1", "SN", "premiere", 0, "2026-10-01", ADOPTE)]
    for etat in ("rejete", "caduc", "fusionne", "retire"):
        assert encours.motif_ecart(ls, [], "ordinaire", etat, "2026-10-01", REF) == etat
    assert encours.motif_ecart(ls, [{"type": "retrait"}], "ordinaire", "en_cours", "2026-10-01", REF) == "retire"


# --- Prochaine étape -------------------------------------------------------------

def test_attente_etape_ouverte():
    ls = [lecture("AN1", "AN", "premiere", 0, "2026-07-07", ADOPTE), lecture("SN1", "SN", "premiere", 1)]
    assert encours.attente(ls, []) == {"attente": "lecture", "etape": "SN1", "chambre": "SN", "type_lecture": "premiere"}


def test_attente_transmis_sans_etape_ouverte():
    """Casseurs-payeurs : voté au Sénat, pas encore de dossier ouvert à l'AN."""
    ls = [lecture("SN1", "SN", "premiere", 0, "2026-10-27", ADOPTE)]
    assert encours.attente(ls, [])["attente"] == "transmis"
    assert encours.attente(ls, [])["chambre"] == "AN"
    # texte financier rejeté en première lecture à l'AN : transmis au Sénat
    ls = [lecture("AN1", "AN", "premiere", 0, "2026-10-23", REJETE)]
    assert encours.attente(ls, [], "financement_ss")["chambre"] == "SN"
    # rejet par la seconde assemblée : la suite n'est pas enregistrée
    ls = [lecture("AN1", "AN", "premiere", 0, "2026-06-23", ADOPTE),
          lecture("SN1", "SN", "premiere", 1, "2026-10-26", REJETE)]
    assert encours.attente(ls, [])["attente"] == "navette"


def test_attente_cmp():
    ls = [lecture("AN1", "AN", "premiere", 0, "2026-03-01", ADOPTE),
          lecture("SN1", "SN", "premiere", 1, "2026-05-01", MODIFIE)]
    convoquee = [{"type": "cmp_convoquee", "date": "2026-05-10"}]
    assert encours.attente(ls, convoquee)["attente"] == "cmp"
    accord = convoquee + [{"type": "cmp_accord", "date": "2026-05-20"}]
    assert encours.attente(ls, accord)["attente"] == "cmp_conclusions"
    desaccord = convoquee + [{"type": "cmp_desaccord", "date": "2026-05-20"}]
    assert encours.attente(ls, desaccord)["attente"] == "navette"
    # conclusions lues à l'AN, le Sénat reste
    ls3 = ls + [lecture("CMP", "AN", "cmp", 2, "2026-06-01", "TSORTF18", "4")]
    r = encours.attente(ls3, accord)
    assert (r["attente"], r["chambre"]) == ("cmp_conclusions", "SN")


# --- Décisions du Sénat absentes du dossier AN ---------------------------------------

def test_completer_senat_par_scrutin():
    idx = parcours.Index([], [{"id": "SN2026-41", "date": "2026-10-27", "numero": 41, "objet": "ensemble",
                               "sort": "adopte", "loicod": "85760", "typleccod": "1"}], {})
    ls = [lecture("SN1", "SN", "premiere", 0)]
    encours.completer_senat(ls, "85760", {}, idx)
    assert ls[0]["date"] == "2026-10-27" and ls[0]["decision_dosleg"]
    assert parcours._statut(ls[0]["dec"])["issue"] == "adopte"


def test_completer_senat_par_texte_puis_question_prealable():
    idx = parcours.Index([], [{"id": "SN1", "date": "2026-03-02", "numero": 3, "objet": "motion_rejet",
                               "sort": "adopte", "loicod": "1", "typleccod": "1"}], {})
    ls = [lecture("SN1", "SN", "premiere", 0)]
    encours.completer_senat(ls, "1", {}, idx)
    assert parcours._statut(ls[0]["dec"])["issue"] == "rejete"
    # le texte adopté (Dosleg) prime sur les scrutins
    ls = [lecture("SN1", "SN", "premiere", 0)]
    encours.completer_senat(ls, "1", {("1", "1"): ("2026-03-05", "adopte")}, idx)
    assert (ls[0]["date"], parcours._statut(ls[0]["dec"])["issue"]) == ("2026-03-05", "adopte")


# --- Base produite ---------------------------------------------------------------------

@pytest.mark.donnees
def test_textes_en_cours_hors_des_lois(base):
    con = sqlite3.connect(base)
    assert not con.execute("select 1 from en_cours e join lois l on l.dossier_an = e.dossier_an").fetchall()
    # les témoins de Max : casseurs-payeurs et légitime défense sont en cours, au bon endroit
    r = dict(con.execute("select id, attente || ' ' || attente_chambre from en_cours where motif_ecart is null "
                         "and id in ('DLR5L17N54925', 'DLR5L17N51037')").fetchall())
    assert r == {"DLR5L17N54925": "transmis AN", "DLR5L17N51037": "lecture SN"}
