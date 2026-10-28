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

## Étape 2 : pipeline XVIIe ✅ (2026-10-28)

Package `qfl` (`download` → `build` → `check`) : 148 lois, 431 lectures,
scrutins décisifs avec positions de groupe, coalitions et pivots, dans
`data/qfl.sqlite` et `data/export/`. Méthodologie v0 validée
(`docs/METHODO.md`), dont la règle fixe du rejet inversé. Main levée vérifiée
sur 16 comptes rendus, textes témoins dans `qfl check`. Premier constat :
5 lois sur 148 passent par un contournement.

## Étape 3 : site v1 ✅ (2026-10-28) — `v1.0.0`

Site SvelteKit statique lu depuis `data/export/` : accueil (frise,
chemins, coalitions, groupes décisifs, limites), explorateur `/lois`,
148 fiches, méthodologie, données. Conception et retours de relecture dans
`docs/CONCEPTION.md` ; règle du groupe décisif changée par Max (basculement,
`docs/METHODO.md` §10). En ligne sur `quifaitlaloi.technoperchoir.fr`
(Cloudflare Pages relié au dépôt, `bash build.sh` → `site/build`), recette
sur téléphone faite.

## Après la v1

Un cycle à la fois, nommé au moment de l'ouvrir :

- **Baselines** : XVIe puis XVe, et comparaison des législatures (l'argument
  visuel le plus fort). Une page par législature sur le gabarit de
  l'accueil, et une page « Comparer » en petits multiples
  (`docs/CONCEPTION.md` §13) ; pas de filtre de dates global.
- **Coalitions** : séries temporelles des signatures, fréquence pivot
  RN / PS / LR, Sankey blocs → adoptions.
- **Fiches** : une dizaine de textes emblématiques en récit chronologique
  (brief §7).
- **Textes en cours** : afficher l'actualité chaude, c'est-à-dire les
  textes pas encore définitivement adoptés (lectures déjà votées,
  coalitions, prochaines étapes). Exemple : casseurs-payeurs.
