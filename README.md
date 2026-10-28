# QuiFaitLaLoi

Comment les lois françaises sont-elles adoptées depuis 2022 ? Par quel
chemin procédural (scrutin solennel, main levée, 49.3, motion de rejet
préalable, CMP…), et avec quelles coalitions de groupes ?

QuiFaitLaLoi classe chaque loi adoptée selon son **mode d'adoption** et la
**coalition** qui l'a votée (avec le groupe **pivot** : celui sans lequel
le texte tombait), puis compare les législatures. Restitution en site web
statique, méthodologie et données téléchargeables.

**État** : site v1 construit, mise en ligne en cours, voir
[`ROADMAP.md`](ROADMAP.md). Méthodologie : [`docs/METHODO.md`](docs/METHODO.md) ;
conception du site : [`docs/CONCEPTION.md`](docs/CONCEPTION.md).

## Construire

```bash
cd pipeline && uv sync && uv run qfl download && uv run qfl build   # données → data/
bash build.sh                                                        # site → site/build/
```

Les données (`data/qfl.sqlite`, `data/export/`) sont versionnées : le site
se construit sans télécharger les sources (Node 22 suffit).

## Sources

Uniquement de l'open data officiel :

- Assemblée nationale : [data.assemblee-nationale.fr](https://data.assemblee-nationale.fr)
  (scrutins, dossiers législatifs, acteurs et organes).
- Sénat : [data.senat.fr](https://data.senat.fr) (base Dosleg, scrutins publics).

## Licence

Code sous licence MIT. Les données dérivées sont publiées sous
[Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/),
comme les données sources.
