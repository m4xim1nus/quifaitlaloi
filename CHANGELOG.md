# Changelog

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).
Les tags `v*` du dépôt suivent ces versions.

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
