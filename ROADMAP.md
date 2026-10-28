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

## Cycle Baselines ← *en cours*

But : comparer la XVIIe aux XVIe et XVe (2017-2024), sur les mêmes règles.

- [x] **Pipeline** sur trois législatures : 606 lois (XVe 318, XVIe 141,
  XVIIe 147), XVIIe inchangée. Rapprochement des scrutins durci (conventions,
  lois organiques, titres en navette), motions de censure de la XVIe
  retrouvées par les dossiers d'engagement, textes témoins XVe/XVIe.
- [x] Main levée XVe/XVIe vérifiée sur 16 comptes rendus : 15 confirmées,
  l'erreur corrigée par une règle (intitulés « conclusions de la CMP »).
- [x] **Site** : une page par législature sur le gabarit de l'accueil
  (l'accueil reste la XVIIe), page « Comparer » en petits multiples
  (gaufres à même échelle), législature dans `/lois` et sur les fiches
  (`docs/CONCEPTION.md` §15).
- [x] Méthodo (v1.1, §15 chiffres comparés), sources et page données à jour.
- [x] Passe éditoriale (retour de Max) : un message par question et par
  législature, coalitions résumées, méthode retirée des pages ; relue contre
  la base par un relecteur indépendant (`docs/CONCEPTION.md` §16).
- [x] Amorce du cycle **Fiches** : récits en Markdown (`recits/`), insérés
  comme « zooms » au bon endroit du fil de chaque législature et sur la
  fiche de la loi ; page `/recits`. Quatre brouillons : retraites 2023, loi
  immigration, loi Duplomb, budget 2026 (`docs/CONCEPTION.md` §17).
- [ ] **Arbitrages de Max** : blocs et socle de la XVe, groupes du Sénat,
  flag de vote bloqué (retraites 2023), relecture des quatre récits.
- [x] Polish issu de la recette v1 : dates clés dans la frise mobile,
  sommaire à ancres en tête de page, messages courts en tête de section
  (les chiffres restent dans les graphiques).
- [ ] Recette de Max, puis tag `v1.1.0`.

## Ensuite

Un cycle à la fois, nommé au moment de l'ouvrir :

- **Coalitions** : séries temporelles des signatures, fréquence pivot
  RN / PS / LR, Sankey blocs → adoptions.
- **Fiches** (amorcé) : compléter jusqu'à une dizaine de récits (budget 2025,
  aide à mourir, narcotrafic, Nouvelle-Calédonie, simplification…).
- **Textes en cours** : afficher l'actualité chaude, c'est-à-dire les
  textes pas encore définitivement adoptés (lectures déjà votées,
  coalitions, prochaines étapes). Exemple : casseurs-payeurs.
