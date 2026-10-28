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

## Étape 3 : site v1 ← *en cours*

But : mise en ligne publique.

- [x] **Passe de conception** (28/10/2026, `docs/CONCEPTION.md`) : étude
  du prior art (leurs-votes.fr, datan.fr, La Fabrique de la loi, AN),
  récit en trois questions, principe « un carré = une loi », direction
  visuelle (Newsreader + Atkinson Hyperlegible Next, palettes non
  partisanes validées). Arbitrages délégués par Max à un relecteur
  indépendant, tous appliqués.
- [x] **Site** SvelteKit adapter-static + d3, lu depuis `data/export/` au
  prérendu : accueil (frise, chemins, coalitions par période, groupes
  décisifs, limites), explorateur `/lois`, 148 fiches, méthodologie,
  données. Clair et sombre, mobile, sans traceur ni ressource tierce.
- [x] Pipeline : titre court par loi (titre officiel, `titres_courts.yaml`),
  couleur officielle des groupes AN.
- [x] `build.sh`, CI GitHub Actions (pytest, svelte-check, vitest,
  prettier, build).
- [ ] **Mise en ligne** : pousser `main` sur `m4xim1nus/quifaitlaloi`,
  projet Cloudflare Pages relié au dépôt (commande `bash build.sh`, sortie
  `site/build`, `NODE_VERSION=22`), domaine
  `quifaitlaloi.technoperchoir.fr`.
- [ ] **Recette de Max** sur téléphone, puis tag `v1.0.0` et
  `CHANGELOG.md`.

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
