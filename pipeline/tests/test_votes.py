from qfl import votes


def g(gid, membres, pour, contre, abst):
    return {"groupe_id": gid, "membres": membres, "pour": pour, "contre": contre, "abstention": abst, "non_votants": 0}


def test_position_et_cohesion():
    assert votes.position(g("A", 10, 6, 2, 2), False)[:2] == ("pour", 0.6)
    assert votes.position(g("A", 10, 3, 3, 0), False)[0] == "partage"
    assert votes.position(g("A", 10, 0, 0, 0), False)[0] == "absent"
    assert votes.position(g("A", 10, 6, 2, 2), False)[2] == 0.5  # Rice = |6-2| / 8


def test_position_censure():
    assert votes.position(g("A", 66, 5, 0, 0), True)[0] == "pas_censure"
    assert votes.position(g("A", 71, 71, 0, 0), True)[0] == "censure"


def test_pivot_adopte():
    s = {"type_vote": "SPS", "sort": "adopte", "pour": 316, "contre": 223, "exprimes": 539, "requis": 270}
    # règle du basculement : les « pour » du groupe votent contre
    assert votes.pivot(s, g("RN", 123, 119, 0, 2)) == (True, False)    # 197 pour < 342 contre
    assert votes.pivot(s, g("EPR", 91, 64, 14, 10)) == (True, False)   # 252 pour < 287 contre
    assert votes.pivot(s, g("LIOT", 22, 20, 0, 1)) == (False, False)   # 296 pour > 243 contre


def test_pivot_basculement_pas_abstention():
    # marge de 34 : 20 voix ne suffisent pas en abstention, mais suffisent en basculant
    s = {"type_vote": "SPO", "sort": "adopte", "pour": 64, "contre": 30, "exprimes": 94, "requis": 48}
    assert votes.pivot(s, g("RN", 122, 20, 0, 0))[0] is True        # 44 pour < 50 contre


def test_pivot_rejete():
    s = {"type_vote": "SPO", "sort": "rejete", "pour": 40, "contre": 60, "exprimes": 100, "requis": 51}
    assert votes.pivot(s, g("X", 30, 0, 11, 0))[0] is True          # 51 pour, 49 contre
    assert votes.pivot(s, g("Y", 30, 0, 9, 0))[0] is False          # 49 pour, 51 contre


def test_pivot_abstention():
    s = {"type_vote": "SPS", "sort": "adopte", "pour": 247, "contre": 232, "exprimes": 479, "requis": 240}
    assert votes.pivot(s, g("ECOS", 38, 2, 9, 27))[1] is True   # 247 contre 259 si les abstentions votaient contre


def test_pivot_censure_rejetee():
    s = {"type_vote": "MOC", "sort": "rejete", "pour": 269, "requis": 289}
    assert votes.pivot(s, g("SOC", 69, 5, 0, 0))[0] is True     # 269 + 64 ≥ 289
    assert votes.pivot(s, g("GDR", 17, 14, 0, 0))[0] is False   # 269 + 3 < 289


def test_signature_socle_rn():
    s = {"id": "X", "type_vote": "SPS", "sort": "adopte", "date": "2025-07-08",
         "pour": 210, "contre": 130, "exprimes": 340, "requis": 171}
    blocs = {"EPR": "centre", "DR": "droite", "RN": "rn", "SOC": "gauche", "LFI": "gauche"}
    grs = [g("EPR", 90, 80, 0, 0), g("DR", 47, 40, 0, 0), g("RN", 123, 90, 0, 0),
           g("SOC", 66, 0, 60, 0), g("LFI", 71, 0, 70, 0)]
    pos = votes.positions(s, grs, blocs)
    sig = votes.signature(s, pos, {k: k for k in blocs})
    assert sig["classe"] == "socle_rn"
    assert sig["pivots_hors_socle"] == "RN"
