# CLAUDE.md

Guide pour Claude Code dans ce dépôt.

## Le projet

**QuiFaitLaLoi** est une étude quali-quanti des modes d'adoption des lois
françaises et des coalitions de vote depuis 2022, restituée sous forme de
site web statique. Chaque loi adoptée est classée selon son **chemin
procédural** (scrutin, main levée, 49.3, rejet préalable « inversé », CMP,
lecture définitive, vote bloqué). Chaque scrutin décisif reçoit sa
**signature de coalition** et son **groupe pivot**. On cherche ensuite des
ruptures aux dates charnières : juin 2022, dissolution de juin 2024,
censure de déc. 2024, accords PS de fin 2025.

Hypothèse de travail de Max : le régime ne produit plus de majorités
stables, seulement des contournements ou des pivots alternés (RN / PS). Le
site doit **vérifier, quantifier, dater, et réfuter là où les données
contredisent**. C'est un instrument de preuve, pas un tract.

Le brief complet est dans `docs/source/INIT_quifaitlaloi.md` : figé, non
versionné (cadrage privé). Il fait référence pour la taxonomie (§5), le
modèle de données (§6), les métriques (§7) et le prior art (§9). En cas
d'écart, ce fichier prime.

## Décisions de cadrage (2026-10-28)

- **Stack alignée sur `~/dev/perso/prenoms-app`** : Python 3.12 + uv +
  polars → SQLite + JSON, puis site SvelteKit adapter-static + d3, Node 22.
  En cas de doute sur une convention (build.sh, CI, tests), copier prenoms.
- **Public dès la v1** : dépôt GitHub public `m4xim1nus/quifaitlaloi`,
  Cloudflare Pages relié au dépôt (option 2 de
  `~/knowledge/wiki/syntheses/options-deploiement-web.md`),
  `quifaitlaloi.technoperchoir.fr`.
- **Les données sont un instantané versionné.** Le pipeline tourne en
  local, puis `data/qfl.sqlite` et `data/export/` sont commités. Le build
  Cloudflare ne fait que construire le site, sans télécharger de dump.
  Chaque mise à jour des données devient ainsi un diff lisible.
- **Pas de PISTE/Légifrance a priori.** La liste des lois promulguées vient
  des actes de promulgation des dossiers AN. Si ça ne suffit pas :
  vie-publique.fr, puis PISTE (Max peut obtenir des identifiants).
- **Conventions et traités internationaux** : ingérés dans une catégorie à
  part (`type = convention`). Toutes les vues existent avec et sans eux.
- **Périmètre** : XVIIe pour la v1, puis XVIe et XVe comme baselines. Aller
  plus loin (2007) reste ouvert, voir le backlog. Les dumps AN de la XVIe
  sont toutefois ingérés dès la v1, pour les lectures antérieures à la
  dissolution des lois promulguées sous la XVIIe (21 décisions, cf.
  `docs/SOURCES.md`).

## Règles dures

- **Données** : uniquement de l'open data officiel (AN, Sénat, et au besoin
  Légifrance ou vie-publique). datan.fr, La Fabrique de la loi et
  NosDéputés servent au **contrôle croisé**, jamais de source primaire.
- **Choix politiques sensibles** : le mapping groupes → blocs
  (`blocs.yaml`), les règles de qualification (`REJET_INVERSE` : règle
  fixe, `docs/METHODO.md` §5) et les flags manuels (`VOTE_BLOQUE`) sont
  **validés par Max**. On ne les tranche jamais seul, et ils sont affichés
  sur la page méthodo. Préférer une règle fixe à un jugement au cas par
  cas.
- La position d'un groupe est sa position **majoritaire parmi les
  exprimés**, toujours affichée avec sa cohésion.
- `MAIN_LEVEE` signifie qu'il n'y a pas d'information nominative, pas que
  le texte fait consensus. Ne jamais l'agréger avec « adopté largement ».
- Sur un 49.3, la position des groupes se lit sur la **motion de censure**
  (scrutin miroir).
- Site public : **ton factuel**, méthodologie auditable, lisible par un
  non-spécialiste.
- FOSS, aucun tracker, aucun CDN tiers.

## Arborescence

```
data/raw/            dumps téléchargés (cache local, non versionné)
data/qfl.sqlite      base de sortie (versionnée)
data/export/         JSON + CSV pour le site et le téléchargement (versionnés)
docs/source/         brief initial (non versionné)
docs/SOURCES.md      fiche des sources
docs/METHODO.md      méthodologie, base de la page Méthodologie
docs/CONCEPTION.md   conception du site : récit, pages, direction visuelle, arbitrages
pipeline/qfl/        package Python (CLI download / build / check)
pipeline/explo/      scripts jetables (spike, graphiques de relecture)
pipeline/referentiels/  YAML maintenus à la main (codes_actes, blocs, flags, périodes, titres courts)
pipeline/tests/      pytest, dont les textes témoins
recits/              récits des textes emblématiques (Markdown, un par loi), zooms du site
site/                SvelteKit adapter-static + d3 : lit data/export/ au prérendu
build.sh             build Cloudflare Pages (site seulement, aucun téléchargement)
```

Site (`site/src/`) : `lib/server/` lit les CSV de `data/export/` au
prérendu (rien n'est envoyé au navigateur hors ce que chaque `load`
extrait) ; fonctions pures testées dans `lib/*.ts` (libellés et
définitions, récit, agrégats, frise, hémicycle, majorité, filtres) ;
composants dans `lib/components/`. Routes : `/` (XVIIe), `/legislature/[num]` (XVe, XVIe),
`/comparer`, `/recits`, `/lois`, `/lois/[id]`, `/methodologie`, `/donnees`,
toutes prérendues. Textes éditoriaux par législature : `lib/legislatures.ts`. `scripts/donnees.mjs`
copie l'instantané dans `static/donnees/` pour le téléchargement.

## Suivi

- `ROADMAP.md` contient les étapes jusqu'à la v1, puis les cycles. Le
  détail se limite à l'étape en cours ; on le met à jour quand une étape se
  ferme.
- `BACKLOG.md` est la file brute, une ligne par item. Tout retour capté en
  session y va d'abord.
- `CHANGELOG.md` sera créé au premier tag (`v1.0.0`).

## Commandes

```bash
cd pipeline && uv sync              # environnement Python
cd pipeline && uv run qfl download  # dumps AN + Sénat → data/raw/ (+ manifeste.json)
cd pipeline && uv run qfl build     # → data/qfl.sqlite + data/export/ (≈ 10 s)
cd pipeline && uv run qfl check     # invariants, textes témoins, flags à arbitrer
cd pipeline && uv run pytest        # tests (les tests `donnees` exigent la base et les dumps)
cd pipeline && uv run python explo/graphiques.py   # graphiques bruts de relecture

cd site && npm install              # Node 22, versions épinglées
cd site && npm run dev              # serveur de dev (copie d'abord les données)
cd site && npm run check            # svelte-check
cd site && npm test                 # vitest (dont contrôle croisé avec metriques.json)
cd site && npm run build            # → site/build/, puis npm run preview
cd site && npm run format           # prettier (format:check exigé par la CI)
bash build.sh                       # ce que fait Cloudflare Pages
```

Après un `qfl build`, relancer `npm run build` : le site se reconstruit
depuis `data/export/`. Toute colonne ajoutée à l'export se déclare dans
`site/src/lib/server/donnees.ts` et `site/src/lib/types.ts`.
