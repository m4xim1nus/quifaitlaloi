from qfl import parcours


def dec(code, date, refs=None):
    a = {"codeActe": code, "dateActe": date}
    if refs:
        a["voteRefs"] = {"voteRef": refs}
    return a


def test_chambres_cmp_etiquette_trompeuse():
    # décision étiquetée SN mais portant un scrutin AN (vu sur DLR5L16N46655)
    decs = [dec("CMP-DEBATS-SN-DEC", "2025-02-04", "VTANR5L17V692"), dec("CMP-DEBATS-DEC", "2025-02-13")]
    assert parcours._chambres_cmp(decs, {"AN": set(), "SN": set()}) == ["AN", "SN"]


def test_chambres_cmp_par_date_de_seance():
    decs = [dec("CMP-DEBATS-DEC", "2024-11-07")]
    assert parcours._chambres_cmp(decs, {"AN": {"2024-11-07"}, "SN": {"2024-11-05"}}) == ["AN"]


def test_type_loi():
    d = {"procedureParlementaire": {"libelle": "Projet de loi ordinaire"}}
    assert parcours.type_loi(d, "Loi autorisant l'approbation de l'accord", None) == ("convention", None)
    assert parcours.type_loi(d, "Loi spéciale prévue par l'article 45", None) == ("finances", "loi_speciale")
    d = {"procedureParlementaire": {"libelle": "Projet de loi de finances de l'année"}}
    assert parcours.type_loi(d, "Loi de finances pour 2026", None) == ("finances", "LFI")


def test_titre_loi_xve():
    from qfl.parcours import titre_loi
    assert titre_loi("LOI n° 2021-1017 du 2 août 2021 relative à la bioéthique") == "relative à la bioéthique"
    assert titre_loi("LOI organique n° 2021-27 du 15 janvier 2021 relative au Conseil économique, social et "
                     "environnemental") == "organique relative au Conseil économique, social et environnemental"
    assert titre_loi("Loi d’accélération et de simplification de l’action publique") == (
        "d’accélération et de simplification de l’action publique")
    assert titre_loi("ratifiant l’ordonnance n° 2019-950 (1)") == "ratifiant l’ordonnance n° 2019-950"
    assert titre_loi("de finances pour 2026") == "de finances pour 2026"
