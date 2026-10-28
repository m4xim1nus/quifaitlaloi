"""Métriques 1 à 5 du brief (§7), agrégées par trimestre et par période charnière.

Chaque métrique sur les lois existe en deux vues : toutes les lois, et hors
conventions internationales (`vue` = toutes | hors_conventions).
"""

import polars as pl

from . import referentiels


def _trimestre(col: str) -> pl.Expr:
    d = pl.col(col).str.to_date()
    return pl.format("{}-T{}", d.dt.year(), d.dt.quarter())


def _periode(col: str) -> pl.Expr:
    ps = referentiels.periodes()["periodes"]
    e = pl.lit(None, dtype=pl.Utf8)
    for p in ps:  # dans l'ordre : la dernière période commencée l'emporte
        e = pl.when(pl.col(col) >= p["debut"]).then(pl.lit(p["code"])).otherwise(e)
    return e


def _vues(df: pl.DataFrame) -> list[tuple[str, pl.DataFrame]]:
    return [("toutes", df), ("hors_conventions", df.filter(pl.col("type") != "convention"))]


def _par(df: pl.DataFrame, cles: list[str], aggs: list[pl.Expr]) -> list[dict]:
    out = []
    for vue, d in _vues(df):
        for grain in ("trimestre", "periode"):
            g = d.group_by([grain, *cles]).agg(aggs).sort([grain, *cles])
            out += [{"vue": vue, "grain": grain, "cle": r.pop(grain), **r} for r in g.to_dicts()]
    return out


def calculer(dfs: dict[str, pl.DataFrame], pos: dict[str, list[dict]], scrutins: dict[str, dict]) -> dict:
    lois = dfs["lois"].with_columns(_trimestre("date_adoption").alias("trimestre"),
                                    _periode("date_adoption").alias("periode"))

    # 1. Part des lois adoptées par contournement, et sa décomposition
    m1 = _par(lois, [], [
        pl.len().alias("lois"),
        pl.col("contournement").sum().alias("contournement"),
        pl.col("a_49_3").sum().alias("art_49_3"),
        pl.col("a_49_3_final").sum().alias("art_49_3_lecture_finale"),
        pl.col("a_rejet_inverse").sum().alias("rejet_inverse"),
        pl.col("a_motion_rejet").sum().alias("motion_rejet_non_qualifiee"),
        pl.col("a_vote_bloque").sum().alias("vote_bloque"),
        pl.col("a_delai_expire").sum().alias("delai_expire"),
    ])
    for r in m1:
        r["part_contournement"] = round(r["contournement"] / r["lois"], 3)

    # 2. Signature de coalition du scrutin décisif (dernière lecture AN / Sénat)
    m2 = []
    for ch in ("an", "sn"):
        d = lois.with_columns(pl.col(f"classe_{ch}").fill_null(
            pl.when(pl.col(f"mode_{ch}") == "MAIN_LEVEE").then(pl.lit("main_levee")).otherwise(pl.lit("sans_scrutin"))
        ).alias("classe"))
        m2 += [{"chambre": ch.upper(), **r} for r in _par(d, ["classe"], [pl.len().alias("lois")])]

    # 3. Groupe pivot sur les scrutins décisifs AN (fréquence par groupe)
    sigles = dict(dfs["groupes"].select("id", "sigle").iter_rows())
    lignes = []
    for r in lois.select("id", "type", "trimestre", "periode", "scrutin_an", "scrutin_sn").to_dicts():
        for ch in ("an", "sn"):
            sid = r[f"scrutin_{ch}"]
            for p in pos.get(sid, []) if sid else []:
                lignes.append({"chambre": ch.upper(), "type": r["type"], "trimestre": r["trimestre"],
                               "periode": r["periode"], "groupe": sigles[p["groupe_id"]], "bloc": p["bloc"],
                               "pivot": p["pivot"], "pivot_abstention": p["pivot_abstention"]})
    m3 = _par(pl.DataFrame(lignes), ["chambre", "groupe", "bloc"], [
        pl.len().alias("scrutins"), pl.col("pivot").sum().alias("pivot"),
        pl.col("pivot_abstention").sum().alias("pivot_abstention")])

    # 4. Cohésion (Rice) et participation par groupe, sur tous les scrutins publics
    lignes = []
    for sid, ps in pos.items():
        s = scrutins[sid]
        if s["type_vote"] == "MOC":
            continue
        for p in ps:
            lignes.append({"chambre": s["chambre"], "date": s["date"], "ensemble": s["objet"] in ("ensemble", "article_unique"),
                           "groupe": sigles[p["groupe_id"]], "bloc": p["bloc"], "rice": p["rice"],
                           "cohesion": p["cohesion"], "participation": p["participation"]})
    c = pl.DataFrame(lignes).with_columns(_trimestre("date").alias("trimestre"), _periode("date").alias("periode"))
    m4 = []
    for portee, d in (("tous", c), ("ensemble", c.filter(pl.col("ensemble")))):
        for grain in ("trimestre", "periode"):
            g = (d.group_by([grain, "chambre", "groupe", "bloc"])
                  .agg(pl.len().alias("scrutins"), pl.col("rice").mean().round(3).alias("rice"),
                       pl.col("cohesion").mean().round(3).alias("cohesion"),
                       pl.col("participation").mean().round(3).alias("participation"))
                  .sort([grain, "chambre", "groupe"]))
            m4 += [{"portee": portee, "grain": grain, "cle": r.pop(grain), **r} for r in g.to_dicts()]

    # 5. Mode d'adoption des lectures : toutes, et dernière lecture de chaque chambre
    lect = (dfs["lectures"].join(lois.select(pl.col("id").alias("loi_id"), "type"), on="loi_id")
            .with_columns(_trimestre("date").alias("trimestre"), _periode("date").alias("periode")))
    derniere = lect.filter(pl.col("issue") != "sans_decision").group_by("loi_id", "chambre").agg(pl.col("id").last())
    m5 = []
    for portee, d in (("toutes", lect), ("derniere_par_chambre", lect.join(derniere, on=["loi_id", "chambre", "id"]))):
        m5 += [{"portee": portee, **r} for r in _par(d, ["chambre", "mode_adoption"], [pl.len().alias("lectures")])]

    return {
        "periodes": referentiels.periodes()["periodes"],
        "contournement": m1,
        "coalitions": m2,
        "pivots": m3,
        "cohesion": m4,
        "modes": m5,
    }
