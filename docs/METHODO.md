# Méthodologie (v1.1)

Base de la page « Méthodologie » du site (`site/src/routes/methodologie`).
Chiffres : instantané du 28/10/2026 (`data/export/meta.json` date les
sources). Les choix marqués **[validé]** ont été arbitrés par Max le 28/10/2026.

## 1. Ce qu'on mesure

Pour chaque loi adoptée sous les XVe, XVIe et XVIIe législatures (depuis
juin 2017), on reconstitue son parcours au Parlement, lecture par lecture. On note comment chaque lecture
s'est conclue : vote nominatif, vote sans scrutin public, 49.3, motion de
rejet. Pour chaque vote décisif, on note quels groupes l'ont fait passer.

**Périmètre.** Les lois promulguées depuis le 27/06/2017 (606 au
28/10/2026 : 318 sous la XVe, 141 sous la XVIe, 147 sous la XVIIe), plus
les textes adoptés définitivement mais pas encore promulgués (aucun à cette
date ; détection limitée à la législature en cours). Chaque loi est
rattachée à la législature de son **adoption définitive**. Les conventions
internationales (155) sont gardées, dans une catégorie à part : chaque
chiffre existe avec et sans elles. Les lectures tenues sous une législature
précédente sont incluses pour les textes concernés.

Une loi, la 2024-850 (ingérences étrangères), a été adoptée le 05/06/2024
et promulguée le 25/07/2024 : elle est rattachée à la XVIe
(`legislature = 16`) **[validé]**. Le site v1 la comptait parmi les 148 lois
« promulguées depuis juillet 2024 » ; la page de la XVIIe en compte 147.

## 2. Sources

Uniquement l'open data officiel de l'Assemblée nationale et du Sénat
(détail, volumes et anomalies : `docs/SOURCES.md`) :

- dossiers législatifs et scrutins publics de l'AN (XVe, XVIe et XVIIe ;
  un dossier présent dans plusieurs dumps est pris dans le plus récent) ;
- base Dosleg du Sénat (textes, lectures, scrutins, votes nominatifs) et
  historique d'appartenance des sénateurs aux groupes.

datan.fr sert au contrôle croisé (scrutins V2957 et V4758 : chiffres
identiques groupe par groupe), jamais de source.

## 3. Du dossier aux lectures

Le dossier législatif de l'AN sert d'ossature, y compris pour les lectures
du Sénat. Une **lecture** est le passage du texte dans une chambre, conclu
par une décision de séance : 1re, 2e, nouvelle lecture, lecture définitive,
ou lecture des conclusions de la commission mixte paritaire (CMP), une fois
dans chaque chambre.

Le dossier AN contient des erreurs qu'on corrige par des règles explicites
(`pipeline/qfl/parcours.py`) :

- **décisions du Sénat mal codées** : « modifié » pour un texte en fait
  adopté conforme. On ne se fie pas à ce code pour dater l'adoption
  définitive ;
- **lectures de CMP sans chambre, ou avec la mauvaise** : la chambre se
  déduit, dans l'ordre, du scrutin AN référencé, de la date de séance de
  chaque chambre, puis de l'étiquette. Si la décision d'une chambre manque
  pour un texte promulgué mais que sa séance est datée, la lecture est
  **déduite** (`decision_deduite = 1`, 2 cas) ;
- **décision rangée sous une CMP en désaccord** : elle est rendue à la
  lecture suivante (1 cas, loi Paris-Lyon-Marseille) ;
- **textes redéposés après la dissolution** : l'étape interrompue en 2024,
  sans décision, est ignorée au profit de l'étape rouverte (12 dossiers).

## 4. Le scrutin décisif d'une lecture

C'est le vote qui conclut la lecture : vote sur l'ensemble du texte (ou sur
son article unique), ou motion de rejet adoptée si le texte est rejeté.

- **AN** : le scrutin référencé par le dossier (`voteRefs`), s'il porte
  sur l'ensemble (les `voteRefs` ne citent parfois qu'une motion rejetée).
  À défaut, un scrutin de la même séance, sur l'ensemble, dont l'intitulé
  correspond au titre du texte. On compare le début du titre, ou au moins
  60 % des mots significatifs, aux titres du texte : titre du dossier, de la
  loi, du Sénat, et de chaque texte déposé ou adopté (le titre change en
  navette : la loi ESSOC est votée en nouvelle lecture sous son titre de
  dépôt). Dernier recours, dans la séance de la décision puis dans son jour :
  40 % des mots, et le même type de lecture dans l'intitulé (« première
  lecture », etc.).
- **Mots significatifs** : hors mots-outils, mots de procédure et formule
  des conventions (« autorisant l'approbation de l'accord entre le
  Gouvernement de la République française et le Gouvernement de… ») : sans
  cela, deux accords du même jour se confondent. Une **loi organique** et la
  loi ordinaire qui l'accompagne ont le même titre : l'intitulé du scrutin
  (« projet de loi organique ») les départage.
- **Un scrutin, une lecture** : si deux lectures se disputent un même
  scrutin trouvé par la séance, il revient à celle qui le référence
  (`voteRefs`), sinon au titre le plus proche ; l'autre est requalifiée sans
  lui.
- **Sénat** : les scrutins de la même loi et du même type de lecture dans
  Dosleg (intitulés « sur l'ensemble… », ou, jusqu'en 2019, « sur les
  conclusions de la CMP… »).
- **Rejet par suppression de l'article unique** : quand l'AN adopte les
  amendements de suppression de l'article unique, le texte est rejeté sans
  vote sur l'ensemble. Ce scrutin est alors le scrutin décisif (loi
  2026-470). Si la décision n'a pas de séance renseignée, on cherche parmi
  les scrutins du jour de la décision.
- **Lecture antérieure à la XVe** (avant le 27/06/2017) : ses scrutins ne
  sont pas ingérés, le mode serait `NON_RENSEIGNE`. Aucun cas depuis
  l'ingestion de la XVe (la loi 2025-444, seul cas de la v1, a retrouvé son
  scrutin de 2022).
- **Sans scrutin trouvé** : la lecture est classée `MAIN_LEVEE`.

> `MAIN_LEVEE` veut dire qu'**aucun scrutin public n'a eu lieu** : on ne
> connaît pas le vote de chaque groupe. Cela ne veut pas dire que le texte
> fait consensus, et cette catégorie n'est jamais agrégée avec « adopté
> largement ».

**Vérification sur les comptes rendus** (28/10/2026, 16 lectures tirées
parmi les `MAIN_LEVEE`, 8 AN et 8 Sénat). 14 sont confirmées : adoption à
main levée, ou procédure d'examen simplifiée pour les 5 conventions de
l'échantillon. Les 2 infirmées ont conduit aux deux règles ci-dessus : une
lecture tenue sous la XVe, et un rejet par suppression de l'article unique.
Une lecture sans scrutin sur l'ensemble peut compter des scrutins sur des
amendements, d'où l'exigence d'un scrutin portant sur l'ensemble. Au Sénat,
« adopté à l'unanimité des présents » reste un vote à main levée.

**Seconde vérification** (28/10/2026, cycle Baselines, 16 lectures tirées
parmi les `MAIN_LEVEE` de la XVe et de la XVIe : 12 AN, 4 Sénat). 15 sont
confirmées (dont 2 en procédure d'examen simplifiée, art. 106 du Règlement,
et 2 constats d'unanimité au Sénat). L'infirmée (Sénat, 02/08/2017) a conduit
à reconnaître les intitulés « sur les conclusions de la CMP » (4 lectures
corrigées).

## 5. Modes d'adoption

Chaque lecture a un **type** (`type_lecture` : premiere, deuxieme,
nouvelle, definitive, cmp) et un **mode** (`mode_adoption`). Écart avec la
taxonomie v0 du brief : `TEXTE_CMP` et `LECTURE_DEFINITIVE` y étaient des
modes. Ce sont des types de lecture, croisés ici avec le mode, puisqu'un
texte de CMP peut passer par scrutin, sans scrutin public ou au 49.3.

| Mode | Sens | Détection |
|---|---|---|
| `SCRUTIN_SOLENNEL` | vote solennel (AN) | type de scrutin `SPS` |
| `SCRUTIN_ORDINAIRE` | scrutin public ordinaire (AN) | type `SPO` |
| `SCRUTIN_PUBLIC` | scrutin public (Sénat) | Dosleg ne distingue pas le solennel |
| `MAIN_LEVEE` | aucun scrutin public | aucun scrutin rattaché |
| `ART_49_3` | texte considéré comme adopté (ou rejeté, si censure) sans vote | statut de la décision ou engagement de responsabilité dans la lecture |
| `MOTION_REJET` | texte rejeté par l'adoption d'une motion de rejet préalable (AN) ou d'une question préalable (Sénat) | scrutin décisif = motion adoptée |
| `REJET_INVERSE` | motion de rejet votée par les partisans du texte pour aller en CMP sur la version du Sénat | motion de rejet AN adoptée + règle ci-dessous |
| `DELAI_EXPIRE` | lecture close sans décision : loi de finances ou de financement transmise à l'expiration des délais (art. 47 et 47-1) | aucune décision dans l'étape (1re lecture AN des PLFSS 2025 et 2026) |
| `SANS_DECISION` | idem, hors texte financier | — (aucun cas) |
| `NON_RENSEIGNE` | lecture tenue avant la XVe, scrutins non ingérés | date < 27/06/2017 (aucun cas) |

Le **vote bloqué** (art. 44, al. 3) est un attribut (`vote_bloque`) posé à
la main dans `flags.yaml` : aucun intitulé de scrutin AN ne le mentionne.
Un cas retenu : le vote unique du Sénat sur la réforme des retraites
(11/03/2023), validé sur délégation de Max ; la loi était déjà un
contournement (49.3).

**Sur un 49.3, la position des groupes se lit sur la motion de censure**
(scrutin miroir) : la plus votée de la lecture. Sous la XVIe, les motions
du dossier n'ont pas de `voteRefs` : on passe par le dossier « Engagement de
la responsabilité » de chaque 49.3 (même date, même projet), dont les
motions sont appariées aux scrutins de censure dans l'ordre (34 motions, 34
scrutins ; l'ordre est vérifié en XVIIe, où les `voteRefs` existent).
Exemple : réforme des retraites, motion LIOT du 20/03/2023, 278 voix.

**Règle du rejet inversé [validé].** Une motion de rejet préalable adoptée
à l'AN est un rejet inversé si (1) le texte part ensuite en CMP et (2) plus
de la moitié des voix « pour » la motion viennent de groupes qui votent
ensuite pour le texte final à l'AN (sur un 49.3 : qui ne votent pas la
censure). Le test est que des groupes votent le rejet puis le texte ; le
seuil de 50 % évite de requalifier une motion d'opposition qui aurait eu
l'appoint d'un groupe finalement favorable. La part est stockée dans
`score_rejet_inverse`. Résultat au 28/10/2026 : Duplomb (V2105, 100 %) et
report des élections en Nouvelle-Calédonie (V3060, 66 % ; le RN vote la
motion puis contre le texte, le PS s'abstient puis vote pour). Pas de
jugement au cas par cas : la règle s'applique seule.

## 6. Contournement

Indicateur par loi : `contournement = 1` si l'une de ses lectures AN est au
49.3 ou en rejet inversé, ou si une lecture porte un vote bloqué.
Les composantes sont gardées à part (`a_49_3`, `a_49_3_final`,
`a_rejet_inverse`, `a_vote_bloque`). L'expiration des délais budgétaires
(`a_delai_expire`) est comptée à part, **hors contournement [validé]**.

## 7. Position, cohésion, participation d'un groupe

- **Position** : la position majoritaire de ses votants, entre pour, contre
  et abstention. Les non-votants sont exclus. En cas d'égalité, la position
  est « partage » ; sans aucun votant, « absent ». **[validé]** Au sens
  du Règlement, les abstentions ne sont pas des suffrages exprimés. On les
  compte pourtant ici : sinon, un groupe qui s'abstient en bloc (le PS sur
  un budget) n'aurait jamais la position « abstention ».
- **Cohésion** : la part de cette position parmi les votants du groupe. Un
  groupe « pour » à 55 % n'est pas un groupe « pour » à 98 %, et la
  cohésion est toujours affichée à côté de la position.
- **Indice de Rice** : |pour − contre| / (pour + contre), métrique 4.
- **Participation** : votants / membres du groupe.
- **Motion de censure** : seuls les « pour » sont recueillis. Un groupe est
  « censure » si plus de la moitié de ses membres la votent, sinon
  « pas_censure ».

Ventilation par groupe : à l'AN, celle publiée dans chaque scrutin. Elle
redonne exactement les totaux. Deux corrections : 146 ventilations du dump
XVIIe ont un groupe `PO0`, qu'on retrouve par les mandats des votants, et
le champ `nonVotantsVolontaires`, qui recopie toujours les abstentions, est
ignoré. Au Sénat, on recompte les votes nominatifs selon l'appartenance de
chaque sénateur à la date du scrutin. Le résultat est identique à senat.fr
(scrutin casseurs-payeurs), avec 3 écarts d'une voix sur le total proclamé
(délégations, rectifications).

## 8. Blocs et socle

Le mapping groupes → blocs (`pipeline/referentiels/blocs.yaml`) est un
choix politique, validé par Max le 28/10/2026 pour les XVIe et XVIIe et
affiché tel quel ; la XVe est tranchée le même jour sur délégation de Max,
avec la même logique (voir plus bas) :

- **gauche** : LFI, SOC, écologistes, GDR ; au Sénat SER, CRCE-K, GEST ;
- **centre (bloc présidentiel)** : EPR/RE, DEM, HOR ; au Sénat RDPI, UC, Les Indépendants ;
- **droite** : DR/LR ;
- **RN et alliés** : RN, UDR puis UDDPLR ; au Sénat UNT (depuis le 05/10/2026) ;
- **autres** : LIOT, RDSE, non-inscrits. Avant octobre 2026, les sénateurs
  RN siégeaient parmi les non-inscrits et sont donc comptés en « autres ».

Le **socle** est le bloc gouvernemental de référence : centre seul sous la
XVe et la XVIe (majorité présidentielle), centre + droite sous la XVIIe
(socle commun).

**XVe (tranché sur délégation de Max)** : groupe allié de la majorité au
centre, groupes charnières hors majorité en « autres » (comme LIOT ensuite). gauche = FI, GDR, Nouvelle
Gauche puis Socialistes, Écologie Démocratie Solidarité (dissidents LREM,
2020) ; centre = LREM, MoDem puis Démocrates, Agir ensemble (2020) ;
droite = LR ; autres = Les Constructifs puis UDI-Agir et ses successeurs,
Libertés et Territoires, non-inscrits (dont les 8 députés RN, sans groupe).
Socle = centre. Au Sénat, le groupe Écologiste (`ECO`, jusqu'en 2017) est à
gauche ; les autres codes sont ceux de la XVIIe. UC et Les Indépendants
restent au centre sous la XVe, alors qu'ils étaient dans l'opposition
sénatoriale : un seul mapping Sénat, plus clair, et sans effet sur ce que
montre le site (les coalitions affichées sont celles de l'Assemblée).

## 9. Signature de coalition

Pour chaque scrutin décisif, on prend le **camp gagnant** : les « pour » si
le texte est adopté, les « contre » s'il est rejeté. Sur une censure
rejetée, ce sont les groupes qui ne la votent pas. Classes, dans l'ordre :

1. `consensus` : aucun groupe (hors bloc « autres ») dans le camp opposé.
   L'abstention ne compte pas comme opposition ;
2. `hors_socle` : le socle, pris en bloc, n'est pas dans le camp gagnant ;
3. sinon, selon les blocs hors socle qui ont au moins un groupe dans le camp
   gagnant : `transpartisan` (gauche et RN), `socle_rn`, `socle_gauche`,
   `socle_droite` (XVe et XVIe), `socle_seul`.

**Sur un 49.3, ne pas censurer n'est pas soutenir** (tranché le 28/10/2026,
délégation de Max : règle inchangée, lecture explicitée). Un groupe qui ne
vote pas une motion peu soutenue (déposée par un autre, sans chance
d'aboutir) entre dans le camp gagnant. Les budgets au 49.3 ressortent souvent
`transpartisan` : ni la gauche ni le RN ne les font tomber, sans les voter.
On garde la règle (la motion la plus votée de la dernière lecture), plus
simple qu'un traitement à part, et on l'explique sur le site.

La signature garde aussi la position de chaque bloc et la liste des
groupes gagnants hors socle (`gagnants_hors_socle`). Le **scrutin décisif
d'une loi** est celui de sa dernière lecture AN, et de sa dernière lecture
au Sénat pour la vue Sénat.

## 10. Groupe pivot

Un groupe est **pivot** (« groupe décisif » sur le site) si, en votant à
l'inverse, il renversait le résultat. **Règle du basculement [validé]**
(Max, 28/10/2026, à la lecture du site ; elle remplace la règle du brief,
où les « pour » du groupe étaient reportés en abstention) :

- texte adopté : si ses « pour » avaient voté contre, le texte tombait.
  Les exprimés ne changent pas : le groupe est pivot si ses « pour »
  atteignent la moitié de la marge (pour − contre) ;
- texte rejeté : si ses « contre » avaient voté pour, il passait ;
- censure rejetée : si tous ses membres l'avaient votée, elle passait
  (« pivot de non-censure »). Mécaniquement, les groupes du socle le sont
  aussi : on lit donc `pivots_hors_socle` ;
- **pivot par abstention** (texte adopté) : si ses abstentionnistes avaient
  voté contre, le texte tombait. C'est l'abstention qui laisse passer un
  texte (exemple : ECOS sur la LFSS 2026).

Seuls les députés qui ont pris part au vote basculent : faire voter les
absents surestimerait le poids des groupes sur les scrutins ordinaires peu
suivis. L'ancienne règle (abstention) mesurait la *nécessité* des voix ;
celle-ci mesure le *pouvoir* du groupe sur l'issue. Effet au 28/10/2026,
hors conventions : 33 lois avec un pivot hors socle au lieu de 11 ; le RN
est pivot sur 20 des 23 lois « socle + RN », le PS sur 6 des 13 « socle +
gauche ».

Le pivot est individuel. Sur le budget 2025 (49.3, février 2025, motion
V693 : 128 voix pour 289 requises), ni le RN (124 membres) ni le PS (60
non-censeurs) n'étaient pivots **seuls** : la censure n'aurait abouti
qu'avec les deux.

## 11. Périodes

Agrégation par trimestre et par période charnière
(`pipeline/referentiels/periodes.yaml`) : XVIIe jusqu'à la censure Barnier
(04/12/2024), puis jusqu'aux « accords PS ». **[validé]** La date
retenue pour ces accords est le 14/10/2025 (annonce de la suspension de la
réforme des retraites). La date d'une loi est celle de son adoption
définitive.

## 12. Premiers chiffres (28/10/2026)

- **Contournement** : 5 lois sur 148. Trois budgets au 49.3 (PLF 2025,
  PLFSS 2025, PLF 2026) et deux rejets inversés (Duplomb ; report des
  élections en Nouvelle-Calédonie, loi organique 2025-1055).
- **Dernière lecture AN** (hors conventions, 114 lois) : 41 scrutins
  solennels, 69 scrutins ordinaires, 3 au 49.3, 1 sans scrutin public. Les
  conventions passent sans scrutin public 26 fois sur 34.
- **Sénat** : la dernière lecture est sans scrutin public pour 49 lois sur
  114 hors conventions.
- **Coalitions** (scrutin décisif AN, hors conventions) : 50 consensus, 24
  transpartisan, 23 socle + RN, 13 socle + gauche, 2 socle seul.
- **Pivots hors socle** (même base, règle du basculement) : 33 lois ;
  RN 22, SOC 9, LFI-NFP 3, ECOS 3, LIOT 2. Avec l'ancienne règle
  (abstention), 11 lois seulement : les appoints confortent souvent un
  texte que le socle gagnait déjà, mais ils pouvaient presque toujours le
  faire tomber.

Ces chiffres ne valident pas la thèse « que des contournements » au niveau
des lois. Ils la nuancent : le contournement se concentre sur les budgets,
hors budget il passe par le rejet inversé, et les majorités alternent bien
entre RN et gauche. À creuser à l'étape
suivante avec les baselines XVIe et XVe.

## 13. Limites connues

- Le solennel n'est pas distingué de l'ordinaire au Sénat.
- `MAIN_LEVEE` n'est confirmé que sur deux échantillons de 16 lectures (§4).
  Les conventions passent en procédure d'examen simplifiée, sans vote
  nominatif : ce sous-type n'est pas encore distingué.
- Vote bloqué : repérage manuel seulement.
- Textes adoptés non promulgués : détection par saisine du Conseil
  constitutionnel, structure du dossier AN et texte « adopté
  définitivement » dans Dosleg. Elle est fiable mais n'a pas encore été
  éprouvée sur un cas réel (aucun au 28/10/2026).
- Positions stockées seulement pour les scrutins utiles (décisifs, motions
  de censure) : 1 121 scrutins.
- XVe : deux scrutins AN ont une ventilation par groupe incomplète dans la
  source (V2816 : groupe MoDem absent ; V3778 : une voix). Les totaux restent
  justes ; `qfl check` les signale sans échouer.
- Le mapping des blocs et le socle de la XVe ont été tranchés sur délégation
  de Max (§8), sans validation groupe par groupe. La cohésion (métrique 4) est calculée sur tous
  les scrutins publics, mais exportée agrégée seulement.

## 14. Affichage sur le site

Le site (`site/`, étape 3) reprend cette méthode sans la modifier. Ses
choix propres sont décrits dans `docs/CONCEPTION.md` :

- **Vocabulaire public** : `REJET_INVERSE` s'affiche « rejet par ses
  partisans » (dit « rejet inversé »), `MAIN_LEVEE` « sans vote nominatif »,
  `consensus` « aucun bloc contre », `socle_seul` « socle, sans gauche ni
  RN », le pivot « groupe décisif ». Libellés et définitions :
  `site/src/lib/libelles.ts`.
- **Chemin d'une loi** : une seule catégorie par loi, le 49.3 puis le rejet
  par les partisans l'emportant sur le mode de la dernière lecture AN.
  `SCRUTIN_SOLENNEL` et `SCRUTIN_ORDINAIRE` y sont réunis en « vote
  nominatif ».
- **Fin de navette** : lecture définitive s'il y en a une, sinon texte de
  CMP s'il y en a un, sinon vote conforme.
- **Titre officiel** (`lois.titre`) : celui du JO tel que le publie le Sénat
  (Dosleg `loi.loititjo`), avec apostrophes et « œ » typographiques ; à
  défaut, l'acte de promulgation de l'AN, qui perd parfois « organique » et
  colle des mots (`docs/SOURCES.md`, anomalie 28).
- **Titre court** (`lois.titre_court`) : le titre officiel de la loi sans
  « Loi visant à… », jamais coupé (le site passe à la ligne), sans paraphrase
  (`qfl/texte.py:titre_court`). Exceptions (budgets, nom d'usage en second,
  comme « (loi Duplomb) ») : `referentiels/titres_courts.yaml`.
- **Couleur des groupes** (`groupes.couleur`) : celle publiée par l'AN
  (`couleurAssociee` du référentiel AMO). Le Sénat n'en publie pas.
- **Thèmes** (`lois.themes`) : classement du Sénat (Dosleg, tables `the` et
  `loithe`), 1 à 4 par loi ; rangés du plus spécifique au plus général
  (fréquence croissante dans Dosleg, « Société » en dernier).

## 15. Baselines : les trois législatures comparées (28/10/2026)

Mêmes règles, hors conventions. Le socle est la majorité présidentielle
sous la XVe et la XVIe, le socle commun sous la XVIIe ; la XVe repose sur
un mapping des blocs tranché sur délégation de Max (§8).

| | XVe (2017-2022) | XVIe (2022-2024) | XVIIe (depuis 2024) |
|---|---|---|---|
| Lois (par an) | 238 (48) | 100 (49) | 113 (50) |
| 49.3 / rejet par ses partisans | 0 / 0 | 6 / 0 | 3 / 2 |
| Sans vote nominatif (dernière lecture AN) | 80 (34 %) | 3 (3 %) | 1 (1 %) |
| Aucun bloc contre | 66 | 43 | 50 |
| Socle + RN / + gauche + RN | — (pas de groupe RN) | 17 / 18 | 23 / 23 |
| Socle + gauche | 22 | 7 | 13 |
| Socle + LR | 24 | 7 | 1 (lecture de la XVIe) |
| Socle seul | 46 | 5 | 2 |
| Lois avec un groupe hors socle décisif | 0 | 4 (LR 2, RN, SOC) | 33 (RN 22, SOC 9…) |

Lecture, au regard de l'hypothèse de travail (le régime ne produit plus de
majorités stables, seulement des contournements ou des pivots alternés) :

- **Le contournement date de 2022, pas de 2024.** Sous la XVIe, six lois
  passent au 49.3 : les quatre budgets annuels, la programmation des
  finances publiques et la réforme des retraites. Il reste concentré sur les
  textes financiers sous les deux législatures ; la nouveauté de la XVIIe
  est le rejet par ses partisans (Duplomb, Nouvelle-Calédonie). La motion de
  rejet adoptée sur la loi immigration (décembre 2023) ne remplit pas la
  règle (47,8 % des voix de la motion viennent des soutiens du texte final).
- **Les pivots, eux, datent de 2024.** Sous la XVIe, la majorité relative
  gagne presque toujours seule au décompte des votants : un groupe extérieur
  n'est décisif que sur 4 lois (LR sur les retraites, au sens de la
  non-censure ; le RN sur la loi immigration). Sous la XVIIe, 33 lois.
- **Le vote nominatif devient la règle avec la majorité relative.** Sous la
  XVe, un tiers des lois passe sans scrutin public à leur dernière lecture
  AN ; depuis 2022, presque aucune. C'est un effet de la demande de scrutin
  (§4), pas une mesure du consensus.
- **Le RN vote déjà avec la majorité sous la XVIe** (35 lois socle + RN ou
  transpartisanes sur 100), mais n'y est décisif qu'une fois (loi
  immigration).


## Cycle Coalitions : chronologie des coalitions et des groupes décisifs (28/10/2026)

La page `/coalitions` reprend les règles des §9 et §10 sans les modifier. Elle
les range dans le temps, de 2017 à aujourd'hui.

- **Unité et date.** L'unité est la loi, avec son scrutin décisif à l'AN
  (dernière lecture AN). Chaque loi est placée au **trimestre de son adoption
  définitive**, comme dans le reste du site. Le vote décisif peut être plus
  ancien : sur 367 lois votées nominativement (hors accords), 43 changent de
  trimestre si on les date par ce vote, et 7 changent de législature. Ces dernières portent un point blanc.
  La classe de coalition et le caractère « hors socle » d'un groupe se lisent
  selon le socle **à la date du vote** (`socle_a_date`). Une loi adoptée en
  2025, mais votée en dernier à l'AN sous la XVIe, peut donc être classée
  « socle + LR ».
- **Bornes des périodes.** Une période commence à sa date de début
  (`periodes.yaml`). La loi adoptée le 04/12/2024, jour du vote de la censure
  Barnier, appartient donc à la période précédente.
- **Texte disputé** : loi votée nominativement à l'AN dont au moins un bloc
  hors « autres » est majoritairement dans le camp opposé (toutes les classes
  sauf `consensus`). Les lois sans vote nominatif n'entrent pas dans le
  dénominateur.
- **Fréquence d'un groupe décisif** : nombre de lois où le groupe, hors
  socle, est décisif par son vote, rapporté aux lois votées nominativement de
  la période (dénominateur unique pour tous les groupes). La part n'est
  affichée qu'à partir de 20 lois. La Droite républicaine fait partie du
  socle sous la XVIIe : elle n'est donc jamais un groupe extérieur. Sa sortie
  éventuelle n'est pas datée (question réservée à Max, §7 de CONCEPTION).
- **Contrôle.** Les comptes par période du site sont égaux à
  `metriques.json` (coalitions et pivots, grain période), et les messages de
  la page sont testés contre les données (`site/src/lib/coalitions.test.ts`).

Chiffres au 28/10/2026, hors accords internationaux :

| | XVe | XVIe | XVIIe, juil.-déc. 2024 | déc. 2024-oct. 2025 | depuis oct. 2025 |
|---|---|---|---|---|---|
| Lois / votées nominativement | 238 / 158 | 100 / 97 | 7 / 7 | 49 / 48 | 57 / 57 |
| Textes disputés | 92 | 54 | 5 | 25 | 32 |
| dont socle sans gauche ni RN | 46 | 5 | 0 | 1 | 1 |
| dont RN dans le camp gagnant | — | 35 | 2 | 19 | 25 |
| dont gauche dans le camp gagnant | 22 | 25 | 4 | 14 | 18 |
| Lois avec un groupe hors socle décisif | 0 | 4 | 1 | 14 | 18 |
| RN / SOC décisifs | — / 0 | 1 / 1 | 1 / 0 | 10 / 4 | 11 / 5 |

Lecture : avant 2022, la majorité présidentielle gagne seule la moitié des
textes disputés. Ensuite, presque jamais. Les appuis ne changent pas d'une
période à l'autre : le RN est le plus souvent dans le camp gagnant, la gauche
souvent aussi (le RN et la gauche se cumulent dans « socle + gauche + RN »).
Depuis la censure, un groupe extérieur décide d'environ une loi sur trois
(32 sur 105). C'est le RN deux fois sur trois, le PS dans moins d'un cas sur
trois. L'annonce de la suspension des retraites ne déplace pas ces parts : la
thèse des « pivots alternés » se vérifie texte par texte, pas d'une période à
l'autre.

**Pas de Sankey blocs → adoptions.** Un Sankey suppose un flux conservé. Or
une loi est soutenue par plusieurs blocs à la fois : un flux bloc → loi la
compterait plusieurs fois. La seule pondération qui se conserve est le nombre
de voix « pour » de députés. Elle dépend surtout de la participation, et un
non-spécialiste ne peut pas la lire. Le seul flux loi → classe redirait la
chronologie. La classe de coalition décrit déjà la combinaison de blocs, et la
grille de présence de l'accueil la montre loi par loi.

**Positions de tous les scrutins : non stockées.** La base garde les positions
des scrutins utiles (1 122 scrutins, 11 061 lignes de `positions_groupes`,
0,9 Mo en CSV). Pour tous les scrutins, il faudrait environ 214 700 lignes
(195 400 ventilations AN sur 17 677 scrutins des XVe à XVIIe, 19 300 au Sénat
sur 2 213 scrutins), soit à peu près 18 Mo de CSV et 15 Mo de plus dans la
base. Chaque mise à jour donnerait un diff illisible. Les vues du site ont
pour unité la loi, et la proximité entre groupes sur tous les scrutins
(amendements compris) est déjà publiée par datan.fr. La cohésion sur tous les
scrutins reste calculée au build et exportée agrégée (métrique 4).
