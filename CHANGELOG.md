# Changelog

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).
Les tags `v*` du dépôt suivent ces versions.

## [1.1.0] — à venir (recette de Max)

Cycle **Baselines** : les XVe et XVIe législatures, avec les mêmes règles,
et la comparaison des trois.

### Ajouté

- Pipeline sur trois législatures : 606 lois depuis juin 2017 (XVe 318,
  XVIe 141, XVIIe 147), scrutins AN de la XVe, Sénat depuis 2017.
- Une page par législature (`/legislature/15`, `/legislature/16`) sur le
  gabarit de l'accueil, et une page `/comparer` en petits multiples (un carré
  = une loi, à même échelle).
- Filtre « Législature » dans `/lois` ; législature sur chaque fiche.
- Textes témoins XVe/XVIe (retraites 2023, PLF 2023, immigration…) et seconde
  vérification de la main levée sur les comptes rendus.

### Modifié

- Textes du site réécrits : un message par législature et par question, les
  coalitions dépliées résument les lois qu'elles recouvrent et font ressortir
  les textes marquants ; la méthode n'est plus répétée sur les pages.
- Sommaire à ancres en tête de page ; sur mobile, les dates clés de la frise
  sont placées à leur mois.
- Titre officiel des lois pris au JO publié par le Sénat (« organique »
  rétabli, mots collés corrigés).
- Coalition « Centre + LR (XVIe) » renommée « Socle + LR ».

### Corrigé

- Rapprochement des scrutins : conventions aux titres voisins, loi organique
  et loi ordinaire du même nom, titres changés en navette, intitulés
  « conclusions de la CMP » et « vote unique » du Sénat. La XVIIe est
  inchangée, hormis la lecture de 2022 de la loi 2025-444, désormais
  renseignée.

## [1.0.0] — 2026-10-28

Première version publique, sur
[quifaitlaloi.technoperchoir.fr](https://quifaitlaloi.technoperchoir.fr).
Périmètre : les 148 lois promulguées sous la XVIIe législature (depuis le
18/07/2024), conventions internationales comprises mais séparables.

### Ajouté

- **Pipeline** `qfl` (`download` → `build` → `check`), uniquement sur
  l'open data AN et Sénat : parcours de chaque loi lecture par lecture,
  scrutin décisif et mode d'adoption (vote nominatif, sans vote nominatif,
  49.3, motion de rejet, rejet par ses partisans, délai expiré), positions
  et cohésion des groupes, signature de coalition, groupe décisif (règle du
  basculement). Instantané versionné dans `data/qfl.sqlite` et
  `data/export/`.
- **Site** statique (SvelteKit + d3) : accueil en trois questions (frise des
  lois, chemins, coalitions, groupes décisifs), explorateur `/lois`, une
  fiche par loi (parcours, hémicycles, votes des groupes), méthodologie et
  référentiels affichés, données téléchargeables (CSV, JSON, SQLite).
  Clair et sombre, mobile, sans traceur ni ressource tierce.
- Méthodologie (`docs/METHODO.md`), fiche des sources (`docs/SOURCES.md`),
  conception du site (`docs/CONCEPTION.md`), CI GitHub Actions.
