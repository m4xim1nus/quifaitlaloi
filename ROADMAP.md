# Roadmap

Projet solo, sans calendrier engageant. Trois étapes jusqu'à la v1, puis des
cycles courts. Chaque étape se termine par un **livrable relu par Max**
avant de passer à la suivante. Les idées non planifiées vont dans
`BACKLOG.md`.

## Étape 0 : cadrage ✅ (2026-10-28)

Brief rangé dans `docs/source/`, décisions de cadrage dans `CLAUDE.md`,
squelette du dépôt.

## Étape 1 : spike sources ✅ (2026-10-28)

Verdict **GO** : l'open data AN + Sénat suffit, sans PISTE. Trois cas
témoins reconstruits (Duplomb, PLF 2026, casseurs-payeurs), liste des lois
promulguées identique côté AN et côté Sénat (148 lois). Détail, trous et
limites : `docs/SOURCES.md`.

## Étape 2 : pipeline XVIIe ← *en cours*

But : une base SQLite fiable sur la XVIIe et les premiers chiffres.

- Package `qfl` : `download` → `build` → `check`, qui écrit
  `data/qfl.sqlite` et `data/export/` (JSON + CSV).
- Sources : dumps XVIIe listés dans `docs/SOURCES.md`, **plus les scrutins
  et dossiers AN de la XVIe**. Certaines lois promulguées depuis juillet
  2024 ont eu une lecture AN avant la dissolution.
- Modèle de données du brief (§6), taxonomie v0 (§5), métriques 1 à 5
  (§7).
- Référentiels maintenus à la main : `pipeline/referentiels/codes_actes.yaml`
  et `blocs.yaml`. **Max valide le mapping groupes → blocs.**
- Tests sur 6 à 8 textes au parcours connu, confrontés aux faits établis et
  à datan.fr. Chaque écart est soit un bug, soit une note de méthode.
- **Livrable** : graphiques bruts des métriques, relus avec Max, et
  `docs/METHODO.md` v0.

## Étape 3 : site v1

But : mise en ligne publique.

- SvelteKit (adapter-static) + d3. Pages : accueil (chiffres clés et frise
  des lois par mode d'adoption), explorateur, fiche par loi, méthodologie,
  données.
- `build.sh`, dépôt public `m4xim1nus/quifaitlaloi`, Cloudflare Pages relié
  au dépôt, `quifaitlaloi.technoperchoir.fr`.
- **Livrable** : site en ligne, tag `v1.0.0`, `CHANGELOG.md` créé.

## Après la v1

Un cycle à la fois, nommé au moment de l'ouvrir :

- **Baselines** : XVIe puis XVe, et comparaison des législatures (l'argument
  visuel le plus fort).
- **Coalitions** : séries temporelles des signatures, fréquence pivot
  RN / PS / LR, Sankey blocs → adoptions.
- **Fiches** : une dizaine de textes emblématiques en récit chronologique
  (brief §7).
- **Textes en cours** : afficher l'actualité chaude, c'est-à-dire les
  textes pas encore définitivement adoptés (lectures déjà votées,
  coalitions, prochaines étapes). Exemple : casseurs-payeurs.
