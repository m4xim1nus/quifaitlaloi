# Roadmap

Projet solo, sans calendrier engageant. Trois étapes jusqu'à la v1, puis des
cycles courts. Chaque étape se termine par un **livrable relu par Max**
avant de passer à la suivante. Les idées non planifiées vont dans
`BACKLOG.md`.

## Étape 0 : cadrage ✅ (2026-10-28)

Brief rangé dans `docs/source/`, décisions de cadrage dans `CLAUDE.md`,
squelette du dépôt.

## Étape 1 : spike sources ← *en cours*

But : savoir si l'open data permet de reconstruire les parcours. C'est le
**go/no-go** du pipeline. Scripts jetables dans `pipeline/explo/`.

- Télécharger dans `data/raw/` : scrutins AN, dossiers législatifs AN,
  acteurs/organes AN (XVIIe) ; dump Dosleg Sénat et scrutins Sénat.
- Reconstruire à la main trois cas témoins :
  1. **Duplomb** : motion de rejet « inversée » du 26/05/2025 → CMP →
     adoption ;
  2. **PLF 2026** : engagements 49.3 et motions de censure miroirs ;
  3. **Casseurs-payeurs** : scrutin Sénat du 27/10/2026, ventilé par
     groupe.
- Vérifier que la liste des lois promulguées de la XVIIe sort des actes de
  promulgation des dossiers AN. Sinon, vie-publique.fr, et PISTE en dernier
  recours.
- **Livrable** : `docs/SOURCES.md` (URLs, formats, volumes, codes d'actes
  rencontrés, trous et limites) et un verdict go/no-go.

## Étape 2 : pipeline XVIIe

But : une base SQLite fiable sur la XVIIe et les premiers chiffres.

- Package `qfl` : `download` → `build` → `check`, qui écrit
  `data/qfl.sqlite` et `data/export/` (JSON + CSV).
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
