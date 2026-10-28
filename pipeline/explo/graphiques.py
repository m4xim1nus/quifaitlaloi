"""Graphiques bruts des métriques 1 à 5, pour relecture (étape 2). Sortie : out_figures/*.png.

Lit data/qfl.sqlite et data/export/metriques.json ; jetable, le site refera ces vues en d3.
"""
import json
import sqlite3
from pathlib import Path

import matplotlib.pyplot as plt
import polars as pl

RACINE = Path(__file__).resolve().parents[2]
OUT = Path(__file__).parent / "out_figures"
OUT.mkdir(exist_ok=True)
con = sqlite3.connect(RACINE / "data/qfl.sqlite")
MET = json.loads((RACINE / "data/export/metriques.json").read_text())
PERIODES = [p for p in MET["periodes"] if p["code"] not in ("xvi", "dissolution")]
LIB_P = {"avant_censure": "juil. → déc. 2024 (Barnier)", "apres_censure": "déc. 2024 → oct. 2025",
         "accords_ps": "depuis oct. 2025 (« accords PS »)"}

# palette de référence (skill dataviz), ordre fixe ; gris pour « sans information »
SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"]
GRIS = "#b4b2aa"
ENCRE, ENCRE2, GRILLE, FOND = "#0b0b0b", "#52514e", "#e6e5e0", "#fcfcfb"
plt.rcParams.update({"font.size": 9, "axes.edgecolor": GRILLE, "axes.labelcolor": ENCRE2, "xtick.color": ENCRE2,
                     "ytick.color": ENCRE2, "axes.spines.top": False, "axes.spines.right": False,
                     "figure.facecolor": FOND, "axes.facecolor": FOND, "savefig.facecolor": FOND})


def q(sql):
    return pl.read_database(sql, con)


def empile(ax, cles, series, valeurs, couleurs, horizontal=False):
    bas = [0] * len(cles)
    for s, c in zip(series, couleurs):
        v = [valeurs.get((k, s), 0) for k in cles]
        if horizontal:
            ax.barh(cles, v, left=bas, color=c, label=s, edgecolor=FOND, linewidth=1.5, height=0.6)
        else:
            ax.bar(cles, v, bottom=bas, color=c, label=s, edgecolor=FOND, linewidth=1.5, width=0.7)
        bas = [b + x for b, x in zip(bas, v)]


def sauver(fig, nom):
    fig.tight_layout()
    fig.savefig(OUT / nom, dpi=150)
    plt.close(fig)
    print(OUT / nom)


# 1. Lois par trimestre d'adoption, selon le mode de la dernière lecture AN -------------
MODES = ["SCRUTIN_SOLENNEL", "SCRUTIN_ORDINAIRE", "ART_49_3", "MAIN_LEVEE"]
LIB_M = {"SCRUTIN_SOLENNEL": "scrutin solennel", "SCRUTIN_ORDINAIRE": "scrutin ordinaire", "ART_49_3": "49.3",
         "MAIN_LEVEE": "sans scrutin public (main levée)"}
COUL_M = [SERIES[0], SERIES[2], SERIES[1], GRIS]
lois = q("select id, type, date_adoption, mode_an, classe_an, contournement from lois").with_columns(
    pl.format("{}-T{}", pl.col("date_adoption").str.to_date().dt.year(),
              pl.col("date_adoption").str.to_date().dt.quarter()).alias("trim"))
fig, axes = plt.subplots(2, 1, figsize=(9, 6), sharex=True)
for ax, (titre, d) in zip(axes, [("Lois ordinaires, organiques, financières", lois.filter(pl.col("type") != "convention")),
                                 ("Conventions internationales", lois.filter(pl.col("type") == "convention"))]):
    cles = sorted(lois["trim"].unique())
    c = {(r["trim"], LIB_M[r["mode_an"]]): r["len"] for r in d.group_by("trim", "mode_an").len().to_dicts()}
    empile(ax, cles, [LIB_M[m] for m in MODES], c, COUL_M)
    ax.set_title(titre, loc="left", color=ENCRE, fontsize=10)
    ax.set_ylabel("lois")
    ax.grid(axis="y", color=GRILLE, linewidth=0.6)
    ax.set_axisbelow(True)
axes[0].legend(frameon=False, ncols=4, loc="upper left", bbox_to_anchor=(0, 1.32))
plt.setp(axes[1].get_xticklabels(), rotation=45, ha="right")
fig.suptitle("M1/M5 — Lois promulguées par trimestre d'adoption définitive, mode de la dernière lecture AN",
             x=0.01, ha="left", fontsize=11, color=ENCRE)
sauver(fig, "1_modes_par_trimestre.png")

# 2. Classes de coalition du scrutin décisif AN, par période -----------------------------
CLASSES = ["consensus", "transpartisan", "socle_gauche", "socle_rn", "socle_droite", "socle_seul", "hors_socle"]
LIB_C = {"consensus": "consensus (aucun groupe contre)", "transpartisan": "socle + gauche + RN",
         "socle_gauche": "socle + gauche", "socle_rn": "socle + RN", "socle_droite": "socle + droite (XVIe)",
         "socle_seul": "socle seul", "hors_socle": "sans le socle", "main_levee": "sans scrutin public"}
COUL_C = [SERIES[2], SERIES[6], SERIES[4], SERIES[1], SERIES[3], SERIES[0], SERIES[7], GRIS]
fig, axes = plt.subplots(1, 2, figsize=(12, 3.6))
for ax, vue in zip(axes, ["toutes", "hors_conventions"]):
    rows = [r for r in MET["coalitions"] if r["vue"] == vue and r["grain"] == "periode" and r["chambre"] == "AN"]
    cles = [p["code"] for p in PERIODES][::-1]
    tot = {k: sum(r["lois"] for r in rows if r["cle"] == k) for k in cles}
    c = {(r["cle"], LIB_C.get(r["classe"], r["classe"])): r["lois"] / tot[r["cle"]] for r in rows if r["cle"] in cles}
    empile(ax, [k for k in cles], [LIB_C[k] for k in CLASSES + ["main_levee"]], c, COUL_C, horizontal=True)
    ax.set_yticks(range(len(cles)), [f"{LIB_P[k]}\n(n = {tot[k]})" for k in cles])
    ax.set_xlim(0, 1)
    ax.xaxis.set_major_formatter(lambda x, _: f"{x:.0%}")
    ax.set_title("toutes les lois" if vue == "toutes" else "hors conventions", loc="left", color=ENCRE)
axes[1].legend(frameon=False, loc="upper left", bbox_to_anchor=(1.01, 1))
fig.suptitle("M2 — Classe de coalition du scrutin décisif AN (49.3 : groupes qui ne votent pas la censure)",
             x=0.01, ha="left", fontsize=11, color=ENCRE)
sauver(fig, "2_coalitions_par_periode.png")

# 3. Fréquence pivot par groupe et par période (scrutin décisif AN, hors conventions) -------
rows = [r for r in MET["pivots"] if r["vue"] == "hors_conventions" and r["grain"] == "periode" and r["chambre"] == "AN"]
GROUPES = ["RN", "UDR", "UDDPLR", "SOC", "LIOT", "DR", "ECOS", "LFI-NFP", "EPR", "DEM", "HOR"]
fig, axes = plt.subplots(1, 2, figsize=(11, 4), sharey=True)
for ax, champ, titre in zip(axes, ["pivot", "pivot_abstention"],
                            ["pivot : sans ses « pour », le texte tombait", "pivot par abstention : s'il votait contre, le texte tombait"]):
    for i, p in enumerate(PERIODES):
        v = {r["groupe"]: r[champ] for r in rows if r["cle"] == p["code"]}
        ax.barh([y + (i - 1) * 0.26 for y in range(len(GROUPES))], [v.get(g, 0) for g in GROUPES], height=0.24,
                color=SERIES[i], label=LIB_P[p["code"]], edgecolor=FOND, linewidth=1)
    ax.set_yticks(range(len(GROUPES)), GROUPES)
    ax.xaxis.get_major_locator().set_params(integer=True)
    ax.set_title(titre, loc="left", color=ENCRE, fontsize=9)
    ax.set_xlabel("lois (scrutin décisif AN)")
    ax.grid(axis="x", color=GRILLE, linewidth=0.6)
    ax.set_axisbelow(True)
axes[0].invert_yaxis()  # axe partagé : une seule inversion
axes[1].legend(frameon=False, loc="lower right")
fig.suptitle("M3 — Groupes pivots sur le scrutin décisif AN, par période (hors conventions ; sur une censure, pivot de non-censure)",
             x=0.01, ha="left", fontsize=11, color=ENCRE)
sauver(fig, "3_pivots_par_periode.png")

# 4. Cohésion (Rice) et participation par groupe, par trimestre (AN, votes sur l'ensemble) --
rows = [r for r in MET["cohesion"] if r["portee"] == "ensemble" and r["grain"] == "trimestre" and r["chambre"] == "AN"
        and r["cle"] >= "2024-T3"]
GR = ["RN", "EPR", "LFI-NFP", "SOC", "DR", "ECOS", "DEM", "HOR", "LIOT", "GDR"]
fig, axes = plt.subplots(2, 5, figsize=(13, 5), sharex=True, sharey=True)
trims = sorted({r["cle"] for r in rows})
for ax, g in zip(axes.flat, GR):
    d = {r["cle"]: r for r in rows if r["groupe"] == g}
    for champ, coul in (("rice", SERIES[0]), ("participation", SERIES[1])):
        xs = [t for t in trims if t in d and d[t][champ] is not None]
        ax.plot(xs, [d[t][champ] for t in xs], color=coul, linewidth=2, label=champ)
    ax.set_title(g, loc="left", color=ENCRE, fontsize=9)
    ax.set_ylim(0, 1.05)
    ax.grid(axis="y", color=GRILLE, linewidth=0.6)
    plt.setp(ax.get_xticklabels(), rotation=90, fontsize=7)
axes[0][0].legend(frameon=False, loc="lower left", fontsize=8)
fig.suptitle("M4 — Indice de Rice moyen et participation moyenne, scrutins AN sur l'ensemble d'un texte, par trimestre",
             x=0.01, ha="left", fontsize=11, color=ENCRE)
sauver(fig, "4_cohesion_participation.png")

# 5. Mode de la dernière lecture de chaque chambre, par période ----------------------------
MODES5 = ["SCRUTIN_SOLENNEL", "SCRUTIN_ORDINAIRE", "SCRUTIN_PUBLIC", "ART_49_3", "MOTION_REJET", "MAIN_LEVEE"]
LIB5 = {**LIB_M, "SCRUTIN_PUBLIC": "scrutin public (Sénat)", "MOTION_REJET": "motion de rejet adoptée"}
COUL5 = [SERIES[0], SERIES[2], SERIES[5], SERIES[1], SERIES[7], GRIS]
fig, axes = plt.subplots(1, 2, figsize=(13, 3.8))
for ax, vue in zip(axes, ["toutes", "hors_conventions"]):
    rows = [r for r in MET["modes"] if r["portee"] == "derniere_par_chambre" and r["vue"] == vue and r["grain"] == "periode"]
    cles = [f"{ch} · {p['code']}" for ch in ("SN", "AN") for p in PERIODES[::-1]]
    tot = {}
    for r in rows:
        k = f"{r['chambre']} · {r['cle']}"
        tot[k] = tot.get(k, 0) + r["lectures"]
    c = {(f"{r['chambre']} · {r['cle']}", LIB5[r["mode_adoption"]]): r["lectures"] / tot[f"{r['chambre']} · {r['cle']}"]
         for r in rows if r["mode_adoption"] in LIB5}
    cles = [k for k in cles if k in tot]
    empile(ax, cles, [LIB5[m] for m in MODES5], c, COUL5, horizontal=True)
    ax.set_yticks(range(len(cles)), [f"{k} (n = {tot[k]})" for k in cles])
    ax.set_xlim(0, 1)
    ax.xaxis.set_major_formatter(lambda x, _: f"{x:.0%}")
    ax.set_title("toutes les lois" if vue == "toutes" else "hors conventions", loc="left", color=ENCRE)
axes[1].legend(frameon=False, loc="upper left", bbox_to_anchor=(1.01, 1))
fig.suptitle("M5 — Mode de la dernière lecture de chaque chambre, par période de cette lecture", x=0.01, ha="left",
             fontsize=11, color=ENCRE)
sauver(fig, "5_modes_par_chambre.png")
