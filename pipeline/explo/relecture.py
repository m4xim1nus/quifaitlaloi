"""Page HTML locale de relecture de l'étape 2 : flags à arbitrer, graphiques bruts, docs/METHODO.md.

Usage : uv run --with markdown python explo/relecture.py → out_figures/relecture.html (jetable).
"""
import base64
import html
import sqlite3
from pathlib import Path

import markdown

RACINE = Path(__file__).resolve().parents[2]
OUT = Path(__file__).parent / "out_figures"
con = sqlite3.connect(RACINE / "data/qfl.sqlite")

CANDIDATS = [  # (loi, motion, scrutin final AN)
    ("2025-794", "VTANR5L17V2105", "VTANR5L17V2957"),
    ("2025-1055", "VTANR5L17V3060", "VTANR5L17V3182"),
]


def positions(sid):
    return {r[0]: r[1:] for r in con.execute(
        "select g.sigle, p.pour, p.contre, p.abstention, p.position from positions_groupes p "
        "join groupes g on g.id=p.groupe_id where scrutin_id=? order by p.membres desc", (sid,))}


def candidat(loi, motion, final):
    titre, = con.execute("select titre from lois where id=?", (loi,)).fetchone()
    tm, dm, pm, cm = con.execute("select titre, date, pour, contre from scrutins where id=?", (motion,)).fetchone()
    df, pf, cf = con.execute("select date, pour, contre from scrutins where id=?", (final,)).fetchone()
    score, = con.execute("select score_rejet_inverse from lectures where scrutin_id=?", (motion,)).fetchone()
    pm_, pf_ = positions(motion), positions(final)
    lignes = []
    for g in pm_:
        a, b = pm_[g], pf_.get(g)
        meme = b and a[3] == b[3] and a[3] in ("pour", "contre")
        lignes.append(f"<tr><td>{g}</td><td>{a[0]} / {a[1]} / {a[2]}</td><td class='{a[3]}'>{a[3]}</td>"
                      f"<td>{b[0]} / {b[1]} / {b[2] if b else ''}</td><td class='{b[3] if b else ''}'>{b[3] if b else '—'}</td>"
                      f"<td>{'✓' if meme else ''}</td></tr>")
    return f"""
<section class="carte">
  <h3>{html.escape(titre)} <span class="muted">(loi {loi})</span></h3>
  <p><b>Motion</b> {motion[-5:]} du {dm} : {html.escape(tm)} — <b>adoptée {pm}-{cm}</b>.<br>
  <b>Texte final AN</b> {final[-5:]} du {df} (conclusions de CMP) : adopté {pf}-{cf}.<br>
  Accord motion / texte final : <b>{score:.0%}</b> des députés.</p>
  <table><thead><tr><th>Groupe</th><th>Motion p / c / a</th><th>Position</th><th>Texte final p / c / a</th>
  <th>Position</th><th>Même camp</th></tr></thead><tbody>{''.join(lignes)}</tbody></table>
</section>"""


def figure(nom, legende):
    b64 = base64.b64encode((OUT / nom).read_bytes()).decode()
    return f'<figure><img src="data:image/png;base64,{b64}" alt="{html.escape(legende)}"><figcaption>{legende}</figcaption></figure>'


FIGURES = [
    ("1_modes_par_trimestre.png", "M1/M5 — Lois par trimestre d'adoption, mode de la dernière lecture AN"),
    ("2_coalitions_par_periode.png", "M2 — Classe de coalition du scrutin décisif AN, par période"),
    ("3_pivots_par_periode.png", "M3 — Groupes pivots, par période"),
    ("4_cohesion_participation.png", "M4 — Cohésion (Rice) et participation par groupe"),
    ("5_modes_par_chambre.png", "M5 — Mode de la dernière lecture de chaque chambre"),
]
methodo = markdown.markdown((RACINE / "docs/METHODO.md").read_text(), extensions=["tables"])

page = f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relecture étape 2</title>
<style>
:root {{ --fond:#fcfcfb; --carte:#ffffff; --encre:#0b0b0b; --encre2:#52514e; --trait:#e6e5e0; --accent:#2a78d6;
        --pour:#1baf7a; --contre:#e34948; --abst:#eda100; }}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --fond:#1a1a19; --carte:#232322; --encre:#f0efec;
        --encre2:#c3c2b7; --trait:#3a3a38; --accent:#3987e5; }} }}
:root[data-theme="dark"] {{ --fond:#1a1a19; --carte:#232322; --encre:#f0efec; --encre2:#c3c2b7; --trait:#3a3a38; --accent:#3987e5; }}
body {{ background:var(--fond); color:var(--encre); font:15px/1.55 system-ui, sans-serif; margin:0; padding:0 16px 64px; }}
main {{ max-width:1100px; margin:0 auto; }}
h1 {{ margin:32px 0 4px; }} h2 {{ margin-top:48px; border-bottom:1px solid var(--trait); padding-bottom:6px; }}
.muted, figcaption {{ color:var(--encre2); font-size:13px; }}
nav a {{ color:var(--accent); margin-right:16px; }}
.carte {{ background:var(--carte); border:1px solid var(--trait); border-radius:8px; padding:4px 20px 12px; margin:16px 0; overflow-x:auto; }}
table {{ border-collapse:collapse; font-size:13px; margin:8px 0; }}
th, td {{ border-bottom:1px solid var(--trait); padding:4px 10px; text-align:left; }}
td.pour {{ color:var(--pour); font-weight:600; }} td.contre {{ color:var(--contre); font-weight:600; }}
td.abstention {{ color:var(--abst); font-weight:600; }}
.question {{ font-weight:600; }}
figure {{ margin:24px 0; }} img {{ max-width:100%; height:auto; border:1px solid var(--trait); border-radius:6px; background:#fcfcfb; }}
.methodo table {{ font-size:13px; }} .methodo code {{ font-size:13px; }}
blockquote {{ border-left:3px solid var(--accent); margin:12px 0; padding:2px 16px; color:var(--encre2); }}
</style></head><body><main>
<h1>QuiFaitLaLoi — relecture de l'étape 2</h1>
<p class="muted">Instantané du 28/10/2026. Page jetable générée par <code>pipeline/explo/relecture.py</code>.</p>
<nav><a href="#flags">Rejet inversé</a><a href="#graphes">Graphiques</a><a href="#methodo">Méthodologie</a></nav>

<h2 id="flags">Motions de rejet adoptées suivies d'une CMP</h2>
<p>Règle fixe (docs/METHODO.md §5) : rejet inversé si plus de la moitié des voix « pour » la motion viennent de
groupes qui votent ensuite pour le texte final à l'AN.</p>
{''.join(candidat(*c) for c in CANDIDATS)}

<h2 id="graphes">Graphiques bruts</h2>
{''.join(figure(*f) for f in FIGURES)}

<h2 id="methodo">Méthodologie v0</h2>
<div class="methodo">{methodo}</div>
</main></body></html>
"""
(OUT / "relecture.html").write_text(page)
print(OUT / "relecture.html")
