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

## Cycle Baselines ✅ (2026-10-28) — `v1.1.0`

La XVIIe comparée aux XVIe et XVe, sur les mêmes règles : 606 lois depuis
2017, une page par législature, une page « Comparer », récit éditorial par
législature, amorce des récits (zooms). Chiffres comparés :
`docs/METHODO.md` §15 ; conception : `docs/CONCEPTION.md` §15 à §17.
Arbitrages (blocs et socle de la XVe, Sénat, vote bloqué, récits) tranchés
sur délégation de Max.

## Cycles Coalitions, Fiches, Textes en cours ✅ (2026-10-28) — `v1.2.0`

- **Coalitions** : page `/coalitions`, chronologie trimestrielle des
  coalitions et des groupes décisifs depuis 2017 (METHODO §16). Pas de
  Sankey : une loi est soutenue par plusieurs blocs, aucun flux ne se
  conserve. LR reste dans le socle sous toute la XVIIe, pas de « décisif à
  plusieurs » (décisions de Max).
- **Fiches** : 10 récits relus (budget 2025, narcotrafic, aide à mourir,
  Nouvelle-Calédonie, pouvoir d'achat 2022, passe vaccinal en plus).
- **Textes en cours** : page `/en-cours` et 126 fiches, textes votés au
  moins une fois sans être promulgués, règle de périmètre fixe (METHODO §17).

Menés en parallèle, relus par Max ; périmètre des textes en cours validé.

## Ensuite

Un cycle à la fois, nommé au moment de l'ouvrir. Pistes : suite des récits,
vue Sénat des coalitions, mise à jour régulière des données (textes en
cours).
