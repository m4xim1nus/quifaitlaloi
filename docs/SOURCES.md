# Sources

Fiche des sources de données de QuiFaitLaLoi, établie au spike de l'étape 1
(téléchargements du 28/10/2026). Scripts d'exploration : `pipeline/explo/`.

## Verdict : GO

L'open data officiel AN + Sénat permet de reconstruire les parcours
législatifs de la XVIIe, sans Légifrance ni PISTE :

- les trois cas témoins se reconstruisent intégralement (voir plus bas) ;
- la liste des lois promulguées sort des actes `PROM-PUB` des dossiers AN.
  Elle est **identique** à celle de la base Dosleg du Sénat : 148 lois
  depuis le 18/07/2024 ;
- les scrutins des deux chambres sont ventilables par groupe. Au Sénat, la
  ventilation recalculée retombe exactement sur celle publiée par senat.fr.

Les limites relevées (main levée, rattachement scrutin ↔ lecture avant
mars 2026, lectures tenues sous la XVIe) se traitent dans le pipeline.
Aucune n'est bloquante.

## Inventaire

| Source | URL | Format | Volume (zip → brut) | Rôle |
|---|---|---|---|---|
| Scrutins AN XVIIe | `data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip` | JSON, 1 fichier par scrutin | 28 Mo → 195 Mo, 9 155 scrutins (08/10/2024 → 27/10/2026) | votes nominatifs, ventilés par groupe |
| Dossiers législatifs AN XVIIe | `…/17/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip` | JSON : 3 374 dossiers + 7 542 documents | 11 Mo → 59 Mo | chaîne des actes, 49.3, motions, CMP, promulgation |
| Scrutins AN XVIe / XVe | `…/16/loi/scrutins/Scrutins.json.zip`, `…/15/loi/scrutins/Scrutins_XV.json.zip` | JSON | XVe : 9 Mo, 4 417 scrutins (figé le 09/06/2022) | baselines |
| Dossiers AN XVIe / XVe | `…/16/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip`, `…/15/loi/dossiers_legislatifs/Dossiers_Legislatifs_XV.json.zip` | JSON | XVe : 15 Mo (figé le 09/06/2022) | baselines |
| Acteurs et organes AN (historique) | `…/17/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip` | JSON : 3 175 acteurs, 10 819 organes | 14 Mo → 133 Mo | sigles et dates des groupes (`organeRef`) |
| Dosleg Sénat | `data.senat.fr/data/dosleg/dosleg.zip` | dump PostgreSQL (53 tables) | 16 Mo → 127 Mo | lois, lectures, **scrutins Sénat** (`scr`) et votes nominatifs (`votsen`, 1,67 M lignes) |
| Groupes des sénateurs | `data.senat.fr/data/senateurs/ODSEN_HISTOGROUPES.csv` | CSV latin-1, en-tête `%` | 0,6 Mo | appartenance sénateur → groupe, datée |
| Scrutin Sénat (page) | `www.senat.fr/scrutin-public/{session}/scr{session}-{n}.html` (et `.json`) | HTML / JSON | ~20 Ko par scrutin | contrôle : ventilation officielle par groupe. Le `.json` ne contient que les votes nominatifs. |

Tous les dumps sont régénérés chaque nuit (horodatage `Last-Modified` du
27 ou du 28/10/2026). Pour les baselines, les mêmes dumps existent pour la
XVIe (`…/16/loi/scrutins/Scrutins.json.zip`, `…/16/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip`)
et pour la XVe, avec un suffixe : `…/15/loi/scrutins/Scrutins_XV.json.zip`,
`…/15/loi/dossiers_legislatifs/Dossiers_Legislatifs_XV.json.zip`.

Pas de Postgres nécessaire : les blocs `COPY` du dump Dosleg se lisent
directement en Python (`explo/senat_dosleg.py`, quelques secondes).

## Clés de jointure

**AN**

- Scrutin → groupe : la ventilation est fournie dans le scrutin
  (`ventilationVotes.organe.groupes.groupe[]`, avec `organeRef` et le
  décompte). Pas besoin de reconstruire les appartenances.
- Décision de lecture → scrutin, dans cet ordre :
  1. `voteRefs` sur l'acte `…-DEBATS-DEC`, ou sur `…-MOTION-VOTE` pour une
     motion de censure. Présent sur 153 des 215 décisions AN des lois
     promulguées.
  2. Sinon, même séance (`reunionRef` de l'acte = `seanceRef` du
     scrutin) **et** titre du scrutin commençant par « l'ensemble », « la
     motion de rejet » ou « l'article unique » et contenant le titre du
     texte : 21 cas de plus.
  3. Sinon, pas de scrutin public : 35 cas, dont 24 conventions. Ce sont
     des candidats `MAIN_LEVEE`, à confirmer.
- `scrutin.objet.dossierLegislatif` n'est renseigné qu'à partir de mars
  2026. On ne peut pas s'y fier sur la période antérieure.

**Sénat** (Dosleg)

```
scr.code → date_seance.code ; date_seance.lecidt (= un lecassidt)
         → lecass.lecassidt → lecass.lecidt → lecture.lecidt → lecture.loicod → loi.loicod
```

Cette chaîne rattache 737 scrutins Sénat sur 737 depuis le 18/07/2024.
Votes nominatifs : `votsen (sesann, scrnum, senmat, posvotcod)`, à joindre
sur `ODSEN_HISTOGROUPES` à la date du scrutin.

**AN ↔ Sénat** : `titreDossier.senatChemin` (URL `…/ppl24-108.html`)
contient le `loi.signet` de Dosleg. Les 5 lois financières et une
convention n'en ont pas : rapprochement par numéro et date de loi.

## Cas témoins

### 1. Loi « Duplomb » (n° 2025-794) : rejet préalable puis CMP

Dossier AN `DLR5L17N50819`, Sénat `ppl24-108`.

| Date | Acte | Donnée |
|---|---|---|
| 27/01/2025 | `SN1-DEBATS-DEC` | adoptée par le Sénat |
| 26/05/2025 | `AN1-DEBATS-DEC` « rejetée » | scrutin `V2105` : motion de rejet préalable **déposée par MM. Dive, Wauquiez, Attal, Fesneau et Christophe**, adoptée par 274 voix contre 121 |
| 28/05/2025 | `CMP-SAISIE` | CMP saisie sur le texte du Sénat |
| 01/07/2025 | `CMP-DEC` | accord |
| 08/07/2025 | `CMP-DEBATS-AN-DEC` | `V2956`, motion de rejet LFI rejetée (158-264) ; `V2957`, scrutin solennel sur l'ensemble, adopté (316-223) |
| 07/08/2025 | `CC-CONCLUSION` | partiellement conforme (2025-891 DC) |
| 11/08/2025 | `PROM-PUB` | loi 2025-794 |

Ventilation de `V2105` (pour / contre) : RN 105/0, EPR 56/1, DR 41/0,
HOR 24/0, DEM 21/4, LIOT 13/0, UDR 11/0, d'un côté ; LFI-NFP 0/47, ECOS
0/36, SOC 0/25, GDR 0/6, de l'autre. Les groupes qui votent la motion sont
ceux qui adopteront le texte CMP. C'est le signal que cherche le flag
`REJET_INVERSE`.

Le repérage semi-automatique est faisable : 12 motions de rejet préalable
ont été adoptées sous la XVIIe. Quatre sont des candidats évidents, parce
que la motion est déposée par la majorité ou adoptée sans voix contre :
`V2105` (Duplomb), `V2208` (A69, 176-0), `V3060` (MM. Caure et Metzdorf),
`V6133` (Mme Dubré-Chirat). La validation reste manuelle.

### 2. PLF 2026 (loi n° 2026-103) : 49.3 et motions de censure miroirs

Dossier AN `DLR5L17N52428`. Le parcours entier figure dans le dossier.

- 1re lecture AN : texte rejeté (`AN1-DEBATS-DEC`, `voteRefs` → `V4241`) ;
  Sénat : texte modifié ; CMP : désaccord (02/01/2026).
- Nouvelle lecture AN : deux engagements de responsabilité (`ANNLEC-DGVT`
  les 20 et 23/01/2026). Chacun porte deux `ANNLEC-MOTION-VOTE` avec
  `voteRefs` : `V5154`/`V5155`, puis `V5193`/`V5194`, toutes rejetées.
  Décision : `TSORTF06`, « considéré comme adopté … article 49, alinéa 3 ».
- Lecture définitive : troisième 49.3 (30/01/2026), motions `V5284` et
  `V5285` rejetées le 02/02/2026.
- CC partiellement conforme le 19/02/2026, promulgation le même jour.

Chaque 49.3 fait aussi l'objet d'un **dossier séparé** (procédure
« Engagement de la responsabilité gouvernementale », codes `AN21-*`) qui
reprend les mêmes motions et `voteRefs`. Il y en a 20 sous la XVIIe, motions
de censure spontanées (49.2) comprises. Les 23 scrutins de type `MOC` en
découlent.

Sur une motion de censure, seuls les votes « pour » sont recueillis. La
position d'un groupe se lit donc en part de ses membres votant la censure.
Exemple, `V5154` (269 pour, majorité requise 289) : RN 122/122, LFI-NFP
71/71, ECOS 36/38, GDR 14/17, UDDPLR 16/16, SOC 5/69.

### 3. « Casseurs-payeurs » : scrutin Sénat du 27/10/2026

Projet de loi relatif à la réparation des dommages résultant de violences
ou de dégradations commises dans l'espace public (Dosleg `pjl25-952`, en
cours, 1re lecture). Scrutin n° 41 de la session 2026, sur l'ensemble :
229 pour, 105 contre.

| Groupe (code Dosleg) | Pour | Contre | Abst. | NPPV |
|---|---|---|---|---|
| Les Républicains (`UMP`) | 123 | 0 | 0 | 1 |
| Union centriste (`UC`) | 58 | 1 | 2 | 2 |
| RDPI (`LREM`) | 15 | 0 | 1 | 0 |
| Les Indépendants (`RTLI`) | 15 | 0 | 0 | 0 |
| Union nationale pour les territoires (`UNT`) | 15 | 0 | 0 | 0 |
| RDSE | 3 | 10 | 5 | 0 |
| Socialiste (`SOC`) | 0 | 62 | 0 | 0 |
| CRCE-K (`CRC`) | 0 | 18 | 0 | 0 |
| Écologiste (`GEST`) | 0 | 14 | 0 | 1 |
| Non-inscrits | 0 | 0 | 0 | 2 |

Recalcul Dosleg × `ODSEN_HISTOGROUPES` : identique, groupe par groupe, à
la page senat.fr. À noter : sans les 15 voix UNT, le texte passe quand même
(214 contre 105). UNT est dans la coalition mais n'est **pas pivot**.

Le texte n'est pas encore dans le dump AN : il n'y a pas été transmis.

## Lois promulguées (XVIIe, depuis le 18/07/2024)

148 lois : 11 en 2024, 79 en 2025, 58 en 2026 au 28/10.

| Type (procédure AN) | Nombre |
|---|---|
| Proposition de loi ordinaire | 80 |
| Projet de ratification des traités et conventions | 32 |
| Projet de loi ordinaire | 21 (dont 2 lois spéciales) |
| Loi organique | 9 |
| LFI / LFSS / LFR | 2 / 2 / 2 |

- Même ensemble de 148 lois côté AN et côté Sénat (Dosleg
  `loi.date_loi`) : 143 rapprochées par signet, 5 évidentes (budgets, une
  convention).
- Un seul écart : la loi 2025-136 est datée du 14/02/2025 à l'AN et du
  15/02/2025 au Sénat. À vérifier sur Légifrance.
- Les conventions ne sont pas classées pareil partout : le Sénat compte 34
  `cvn`, l'AN classe la loi 2025-449 (accord-cadre France–ONU) en « projet
  de loi ordinaire ». Règle proposée : `convention` si l'une des deux
  sources le dit ou si le titre commence par « autorisant l'approbation /
  la ratification ».
- Les textes adoptés définitivement mais pas encore promulgués (en attente
  du Conseil constitutionnel) ne sont pas dans cette liste. On les détecte
  par une décision finale sans `PROM-PUB` (étape 2).

## Codes d'actes rencontrés (dossiers AN XVIIe)

Le préfixe désigne la lecture : `AN1`, `AN2`, `ANNLEC` (nouvelle lecture),
`ANLDEF` (lecture définitive), `ANLUNI` (résolutions), `SN1`, `SN2`,
`SNNLEC`, `CMP`, `CC`, `PROM`. `AN20` couvre les missions et rapports,
`AN21` les engagements de responsabilité.

| Suffixe | Sens | Usage |
|---|---|---|
| `-DEPOT` | dépôt / transmission (`provenance`) | début de lecture |
| `-PROCACC` | procédure accélérée engagée | attribut du texte |
| `-COM-FOND-*`, `-COM-AVIS-*` | commissions | ignoré |
| `-DEBATS-SEANCE` | séance de discussion (`reunionRef`) | jointure scrutins |
| `-DEBATS-DEC` | décision de la chambre (`statutConclusion`, `voteRefs`) | **issue de la lecture** |
| `-DGVT` | déclaration du Gouvernement (49.3) | événement `49.3` |
| `-MOTION` / `-MOTION-VOTE` | motion de censure déposée / votée (`voteRefs`, `decision`) | scrutin miroir |
| `-RTRINI` | retrait de l'initiative | — |
| `-ETI`, `-AVCE`, `-ACIN` | étude d'impact, avis du Conseil d'État, accord international | métadonnées |
| `CMP-SAISIE`, `CMP-DEC` | convocation, accord / désaccord (`TCCMP01/02`) | événement CMP |
| `CMP-DEBATS-AN-DEC`, `CMP-DEBATS-SN-DEC` | lecture des conclusions | lecture `TEXTE_CMP` |
| `CC-SAISIE-*`, `CC-CONCLUSION` | saisine et décision du Conseil constitutionnel | événement |
| `PROM-PUB` | promulgation (`codeLoi`, `infoJO.referenceNOR`) | table pivot `lois` |

Statuts de décision (`statutConclusion.fam_code`) : `TSORTF01` adopté,
`TSORTF02` adopté avec modifications, `TSORTF03` adopté sans modification,
`TSORTF05` modifié, `TSORTF07` rejeté, `TSORTF18` adopté dans les
conditions de l'art. 45 al. 3 (texte CMP), `TSORTF19` adopté définitivement
en application de l'art. 151-7 du Règlement, `TSORTF06` considéré comme
adopté (49.3), `TSORTF24` considéré comme rejeté (49.3 suivi d'une censure :
PLFSS 2025, décembre 2024). Motions : `TSORTMOT01` adoptée, `TSORTMOT02`
rejetée. Les libellés varient en genre (« adopté » / « adoptée ») : il faut
se fier au code, pas au libellé.

L'inventaire complet se régénère avec `explo/an_codes_actes.py`.

## Trous et limites

1. **`positionMajoritaire` (AN) n'est pas fiable.** Sur `V2957`, le RN est
   noté « abstention » avec 119 voix pour sur 123. Sur les motions de
   censure, tous les groupes sont notés « pour », même à 0 voix. La
   position se recalcule toujours depuis `decompteVoix`.
2. **Main levée.** Au Sénat, 82 des 148 lois n'ont aucun scrutin public
   sur l'ensemble : 33 conventions, 44 PPL, 5 projets. À l'AN, 35
   décisions sur 215 n'ont pas de scrutin rattaché. Rien dans les données
   ne confirme positivement une main levée : c'est une absence de scrutin.
   À confirmer sur un échantillon de comptes rendus.
3. **Lectures tenues sous la XVIe.** 21 décisions AN de lois promulguées
   sous la XVIIe datent d'avant le 18/07/2024 (dossiers `DLR5L15…` et
   `DLR5L16…`). Leurs scrutins sont dans le dump XVIe. Il faut donc
   l'ingérer dès la v1.
4. **Rattachement AN avant mars 2026** : par séance et titre (voir plus
   haut). Les titres de dossier sont parfois abrégés (« Réduire l'impact
   environnemental de l'industrie textile »). Pour le rapprochement, mieux
   vaut le `titreLoi` de `PROM-PUB`. Une séance peut contenir plusieurs
   candidats (motion de rejet puis ensemble) : on départage par l'issue de
   la décision.
5. **Codes de groupe Sénat obsolètes** dans `ODSEN_HISTOGROUPES` : `UMP`
   pour LR, `LREM` pour RDPI, `CRC` pour CRCE-K, `RTLI` pour Les
   Indépendants. Le mapping vers `blocs.yaml` doit se faire sur le code,
   avec un libellé d'affichage maintenu à la main.
6. **Groupes AN renommés** : l'`organeRef` change avec le groupe (UDR,
   puis `UDDPLR` en 2026). Le mapping vers les blocs se fait par
   `organeRef`, avec les dates de l'organe.
7. **Encodage Dosleg** : apostrophes en cp1252 (`\x92`) dans du texte UTF-8
   (`scr.scrint`), champs `char` complétés par des espaces. Il faut
   nettoyer à l'ingestion.
8. **Vote bloqué (44.3)** : aucune trace dans les titres de scrutins AN.
   Au Sénat, un scrutin s'y réfère explicitement dans son intitulé (n° 367,
   11/07/2025). La détection restera partielle, avec un flag manuel.
9. Hors période utile, `scr` (Sénat) remonte à 2006 : de quoi faire des
   baselines côté Sénat.

## Anomalies relevées à l'étape 2

Traitées dans le pipeline (`pipeline/qfl/`), détail dans `docs/METHODO.md` §3
et §7.

10. **`PO0` dans les ventilations AN** : 146 ventilations de groupe du dump
    XVIIe n'ont pas d'organe (12 scrutins du 02/12/2024, entièrement ; le RN
    seul dans `V1302` et `V6256`). Le groupe se retrouve par les mandats AMO
    des votants.
11. **`nonVotantsVolontaires`** recopie toujours les abstentions (XVIe et
    XVIIe, 21 550 ventilations) : à ignorer.
12. **Statut des décisions du Sénat dans le dossier AN** : 25 lois
    promulguées ont pour dernière décision « SN… modifié ». L'indice fiable
    d'adoption définitive côté Sénat est Dosleg : un texte d'origine
    `oritxt.oritxtado = 'D'` (« adopté définitivement »), présent pour les 148
    lois.
13. **Lectures de CMP** : décision sans chambre (`CMP-DEBATS-DEC`), étiquetée
    « SN » mais portant un scrutin AN, ou absente pour une chambre (2 cas,
    déduits) ; décision rangée sous une CMP en désaccord (loi
    Paris-Lyon-Marseille).
14. **Étapes dédoublées par la dissolution** : 12 dossiers ont deux étapes
    `AN1` ou `AN2`, la première (XVIe) sans décision.
15. **`loi.loinumjo` (Dosleg)** est le numéro du JO, pas celui de la loi.
    Sans signet, le rapprochement AN ↔ Sénat se fait par date de
    promulgation et titre.
16. **Intitulés de scrutins AN** : « le projet de loi autorisant… » (sans
    « l'ensemble ») vaut vote sur l'ensemble d'un texte à article unique.
17. **Dossiers XVIe** : sur les 193 dossiers présents dans les deux dumps,
    celui de la XVIIe est au moins aussi complet (souvent plus : `voteRefs`,
    `PROM-PUB`). Le dump XVIe ne sert qu'aux baselines.
18. **Scrutin du Congrès** (`VTCGR5L16V1`, 04/03/2024) dans le dump XVIe :
    groupes du Sénat, exclu.
19. **Décision AN sans séance ni `voteRefs`** (DLR5L17N53981) : le scrutin
    décisif se cherche parmi les scrutins du jour de la décision. Ici, il
    s'agit des amendements de suppression de l'article unique, adoptés : le
    texte est rejeté sans vote sur l'ensemble.

## Anomalies relevées au cycle Baselines (XVe, XVIe)

20. **Ventilations incomplètes (XVe)** : `V2816` (23/07/2020, loi organique
    dette sociale) n'a pas de ventilation pour le groupe MoDem (46 voix
    pour) ; `V3778` perd une voix pour. Rien à reconstruire (pas de liste
    nominative pour le groupe manquant) : listés dans `qfl check`.
21. **Titres de promulgation (XVe)** : 31 `titreLoi` commencent par « LOI
    n° … du … » ou finissent par le renvoi « (1) » du JO ; nettoyés.
22. **Motions de censure sans `voteRefs` (XVIe)** : ni le dossier du texte ni
    le dossier « Engagement de la responsabilité » (`AN21`) ne les relient à
    leur scrutin. Motions et scrutins `MOC` sont appariés dans l'ordre (34 et
    34). En XVIIe, une motion déposée et non votée décale le compte : on y
    garde les `voteRefs`.
23. **Intitulés de scrutins de CMP au Sénat (2017-2019)** : « sur les
    conclusions de la commission mixte paritaire… », « sur le texte élaboré
    par la CMP… » (4 scrutins) ; reconnus comme votes sur l'ensemble.
24. **Intitulés AN** : coquilles (« lecture défintive », « texte de la
    commission paritaire », « 1ère lecture ») ; `voteRefs` qui ne citent
    qu'une motion de rejet rejetée (SERM, saisie des avoirs criminels) ;
    séance du dossier différente de celle du scrutin, le même jour.
25. **Titres voisins** : deux conventions du même jour (« services aériens »
    avec l'Éthiopie… et avec le Tchad…) ou une loi organique et sa loi
    ordinaire (« manipulation de l'information ») ont des intitulés presque
    identiques. Le rapprochement neutralise la formule des conventions et
    distingue « loi organique » (`docs/METHODO.md` §4).
26. **Congrès** : la révision constitutionnelle de 2024 (IVG) a une étape
    `CG22` (vote du Congrès), ignorée comme lecture. Type `constitutionnelle`.
27. **Vote unique au Sénat (art. 44, al. 3)** : l'intitulé du scrutin
    décisif de la réforme des retraites (SN2022-249, 11/03/2023) commence par
    « sur les articles 9 à 20 et sur l'ensemble du texte… » ; reconnu comme
    vote sur l'ensemble. Le flag `vote_bloque` correspondant attend la
    validation de Max.
28. **`titreLoi` de l'acte de promulgation (AN)** : « organique » ou
    « constitutionnelle » absents (une vingtaine de lois, surtout XVe), mots
    collés (« accompagnerles », « Protégerle »), titre resté celui du dépôt.
    Le titre retenu est celui du JO publié par le Sénat (`loi.loititjo`).
