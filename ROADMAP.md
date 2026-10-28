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

## Étape 2 : pipeline XVIIe ← *en cours, livrable en relecture*

But : une base SQLite fiable sur la XVIIe et les premiers chiffres.

- [x] Package `qfl` : `download` → `build` → `check`, qui écrit
  `data/qfl.sqlite` et `data/export/` (CSV, `metriques.json`, `meta.json`).
- [x] Sources : dumps XVIIe, plus les scrutins AN de la XVIe (les dossiers
  XVIe n'apportent rien de plus, `docs/SOURCES.md` §17).
- [x] Modèle de données du brief (§6), taxonomie v0 affinée (type de lecture
  × mode, `docs/METHODO.md` §5), métriques 1 à 5 (§7).
- [x] Référentiels : `codes_actes.yaml`, `blocs.yaml` (validé par Max),
  `flags.yaml`, `periodes.yaml`.
- [x] Textes témoins dans `qfl check` et `pytest` (Duplomb, PLF 2026,
  PLFSS 2025, LFSS 2026, Paris-Lyon-Marseille, meublés de tourisme,
  casseurs-payeurs au Sénat), contrôle croisé datan.fr sur V2957 et V4758.
- [x] Relecture avec Max (28/10/2026) : graphiques bruts, `docs/METHODO.md`
  v0 validé, règle fixe du rejet inversé, date des « accords PS ».
- [ ] Échantillon de comptes rendus pour confirmer `MAIN_LEVEE` (BACKLOG).

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
