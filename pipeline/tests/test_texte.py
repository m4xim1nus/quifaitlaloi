from qfl.texte import nettoyer, objet_scrutin, similarite


def test_objet_an():
    assert objet_scrutin("l'ensemble du projet de loi de finances pour 2026 (lecture définitive).") == "ensemble"
    assert objet_scrutin("la motion de rejet préalable, déposée par M. X, de la proposition de loi") == "motion_rejet"
    assert objet_scrutin("la motion de censure déposée en application de l'article 49, alinéa 3") == "motion_censure"
    assert objet_scrutin("le sous-amendement n° 12 de M. Y à l'amendement n° 3") == "amendement"
    assert objet_scrutin("le projet de loi autorisant l'approbation de l'accord (première lecture).") == "ensemble"
    assert objet_scrutin("la première partie du projet de loi de finances pour 2026") == "partie"


def test_objet_senat():
    assert objet_scrutin("sur l\u0092ensemble du projet de loi relatif à la réparation") == "ensemble"
    assert objet_scrutin("sur la motion n° 1, présentée par Mme Z, tendant à opposer la question préalable") == "motion_rejet"
    assert objet_scrutin("sur la motion n° 2 tendant au renvoi en commission") == "motion_renvoi"


def test_nettoyer_apostrophe_cp1252():
    assert nettoyer("sur l\u0092ensemble  du texte ") == "sur l’ensemble du texte"


def test_similarite_titre_change_en_navette():
    scrutin = "l'ensemble de la proposition de loi relative à la sûreté dans les transports (première lecture)."
    assert similarite(scrutin, "relative au renforcement de la sûreté dans les transports") >= 0.6
    assert similarite(scrutin, "portant création d'un statut de l'élu local") == 0


def test_suppression_article_unique():
    t = ("l'amendement n° 1 de M. Monnet et les amendements identiques suivants de suppression de l'article unique "
         "du projet de loi portant transposition de l'avenant n° 3 (première lecture).")
    assert objet_scrutin(t) == "suppression_article_unique"
