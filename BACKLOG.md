# Backlog

File d'attente brute, non ordonnée. Une ligne par item :

```
- [TAG] description courte (origine, date)
```

**Tags** : `[ ]` à trier, `[→Étape N]` ou `[→Codename]` rangé, `[creuser]`
à réfléchir avant d'arbitrer, `[refusé]` tranché négatif (trace gardée).
**Origines** : `user:moi`, `claude`, `gh#N`.

---

## À trier

- [creuser] Remonter la baseline à 2007 (ères Sarkozy/Hollande) au-delà de la XVe ? (brief §11, 2026-10-28)
- [creuser] Identifiants PISTE/Légifrance : Max peut en obtenir, seulement si le spike montre un trou dans la liste des lois promulguées (claude, 2026-10-28)
- [creuser] Nom de domaine propre (ex. quifaitlaloi.fr) à la place du sous-domaine technoperchoir (claude, 2026-10-28)
- [ ] Loi 2025-136 datée du 14/02/2025 à l'AN, du 15/02/2025 au Sénat : trancher sur Légifrance (claude, 2026-10-28)
- [ ] Sénat : distinguer scrutin solennel et ordinaire (absent de Dosleg ; pages HTML des scrutins ?) (claude, 2026-10-28)
- [refusé] Dater la participation de LR au socle (sortie du gouvernement Lecornu II ?) : LR reste dans le socle, ses votes suivent ceux d'EPR comme Horizons (décision de Max, METHODO, 2026-10-28)
- [ ] Éprouver la détection « adopté, pas encore promulgué » sur un cas réel dès qu'il s'en présente (aucun au 28/10/2026) (claude, 2026-10-28)
- [refusé] Stocker les positions de groupe de tous les scrutins (pas seulement les décisifs) : ≈ 215 000 lignes au lieu de 11 000 pour un gain faible, cf. METHODO §16 (claude, 2026-10-28)
- [refusé] Pivot « à deux » (RN + PS ensemble sur une censure) : le décisif reste individuel ; sur le budget 2025, RN + UDR + LIOT suffisaient sans le PS (décision de Max, 2026-10-28)
- [ ] Distinguer la procédure d'examen simplifiée (conventions) de la main levée ordinaire (vérification des comptes rendus, claude, 2026-10-28)
- [ ] Cartes partageables générées au build (phrase factuelle, graphique, source, date, URL), recommandées par l'étude du prior art (claude, 2026-10-28)
- [ ] Glossaire au survol (49.3, CMP, lecture définitive, exprimés…) accessible au toucher et au clavier, en plus des définitions en ligne (claude, 2026-10-28)
- [ ] Fiche : lien vers datan.fr pour le vote député par député et les explications de vote (claude, 2026-10-28)
- [ ] Poids des fiches : ≈ 150 ko de HTML (deux hémicycles en SVG inline, 25 ko gzip) ; avec les baselines, 606 fiches, `site/build` ≈ 67 Mo (claude, 2026-10-28)
- [ ] Fiche : proposer un repli de l'hémicycle en barre sur petit écran si la recette le demande (claude, 2026-10-28)
- [ ] Les messages en tête de section (`site/src/lib/legislatures.ts`) sont écrits d'après les données du 28/10/2026 : les relire à chaque mise à jour, ou les tester contre les chiffres (claude, 2026-10-28)
- [ ] Classe de coalition : LR est masqué par la précédence (une loi « socle + RN » peut aussi avoir LR dans le camp gagnant sous la XVe/XVIe) ; afficher la présence de LR à part ? (claude, 2026-10-28)
- [ ] Coalitions : les messages de `/coalitions` sont testés dans `coalitions.test.ts` ; les relire si le test casse après une mise à jour des données (claude, 2026-10-28)
- [ ] Coalitions : couper la colonne 2024-T4 autour de la censure si d'autres trimestres charnières se remplissent (un seul cas aujourd'hui) (claude, 2026-10-28)
- [ ] Coalitions : vue Sénat de la chronologie (positions déjà en base) (claude, 2026-10-28)
- [ ] Pipeline : PLF 2025, le scrutin Sénat n° 175 (ensemble, 23/01/2025) manque à la table `scr` de Dosleg ; la lecture SN1 est rattachée au vote de la première partie. Reconstituer depuis les votes nominatifs ou signaler dans `qfl check` (claude, 2026-10-28)
- [ ] Pipeline : date `cmp_accord` du PLF 2025 au 30/01/2025, accord trouvé le 31/01 (claude, 2026-10-28)
- [ ] Qualifier les rejets du Sénat par suppression de tous les articles, sans vote sur l'ensemble (aide à mourir, SN2 du 12/05/2026), autrement que `MAIN_LEVEE` (claude, 2026-10-28)
- [ ] Loi 2022-1158 : saisine du Conseil constitutionnel datée du 08/08/2022, senat.fr dit 05/08 (claude, 2026-10-28)
- [→Fiches] Récits suivants : simplification de la vie économique (2026-403, RN décisif), un récit « chemins » pour la XVe (claude, 2026-10-28)
- [ ] Récits : préférer « si le groupe avait voté contre » à « sans ses voix », ambigu au regard de la règle du basculement (claude, 2026-10-28)
- [ ] Textes en cours : factoriser `VoteDetaille` dans la fiche `/lois/[id]` (copie de sa section de vote) (claude, 2026-10-28)
- [ ] Poids du build : 78 Mo avec les 126 fiches de textes en cours (claude, 2026-10-28)
- [ ] Titres courts : élision « Accord avec d'Antigua-et-Barbuda », 14 titres courts de textes en cours commencent par « Proposition de loi… » (claude, 2026-10-28)
- [ ] Textes en cours : 4 motions de rejet adoptées (1er mai V6133, Nouvelle-Calédonie V6022, comptes 2025 V7350 et V7351), rejet inversé à qualifier au vote final (claude, 2026-10-28)
- [ ] Textes en cours : dater davantage de séances à venir (ordre du jour de l'AN en open data ?) (claude, 2026-10-28)
