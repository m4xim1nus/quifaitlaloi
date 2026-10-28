# Conception du site v1

Passe de conception de l'étape 3 (28/10/2026). Max a délégué les arbitrages
de maquette : les choix ci-dessous ont été tranchés en session, après une
étude du prior art et une relecture critique par un sous-agent arbitre
(§7). Ce document décrit ce qui a été construit ; il prime sur la roadmap
pour le détail du site.

## 1. Ce que le site doit faire

Un visiteur qui n'a jamais entendu parler du 49.3 doit, en deux minutes,
pouvoir répondre à trois questions, chiffres à l'appui :

1. **Comment les lois passent-elles à l'Assemblée ?** Combien contournent
   à une étape le vote de l'Assemblée sur le texte, lesquelles, quand.
2. **Avec quelles voix ?** Les coalitions au vote décisif, et leur
   évolution aux dates charnières.
3. **Quels groupes ont été décisifs ?** Les groupes sans lesquels le
   résultat s'inversait.

Puis, s'il le veut, descendre jusqu'à une loi, un scrutin, un groupe, et
remonter aux sources. Le site **pose des questions et y répond avec les
données**, sans adjectif : l'hypothèse de Max (plus de majorité stable,
seulement des contournements ou des pivots alternés) n'est ni affichée en
thèse ni cachée. Les sections sont formulées pour qu'elle puisse être
confirmée ou démentie. Pas de « passage en force » (vocabulaire des
oppositions, et faux pour le rejet par les partisans, qui finit par un
vote), pas de « le gouvernement fait voter » (87 lois sur 114 sont des
propositions de loi).

## 2. Ce que disent les données (28/10/2026)

Socle factuel du récit, recalculé à chaque build depuis `data/export/` :

- 148 lois promulguées, dont 34 accords internationaux.
- **5 contournements sur 114** (hors accords) : 3 budgets au 49.3 (État
  2025 et 2026, Sécurité sociale 2025), 2 rejets par les partisans
  (Duplomb, report des élections en Nouvelle-Calédonie en 2025). Le budget
  de la Sécurité sociale 2026 est voté sans 49.3.
- Vote décisif à l'Assemblée, hors accords : 50 sans bloc contre, 24 socle
  + gauche + RN, 23 socle + RN, 13 socle + gauche, 2 socle sans gauche ni
  RN, 1 centre + LR (lecture sous la XVIe), 1 sans vote nominatif.
- **Groupes décisifs hors socle** : 33 lois sur 114 avec la règle du
  basculement (RN 22, SOC 9, LFI-NFP 3, ECOS 3, LIOT 2… ; §10). Avec
  l'ancienne règle de l'abstention : 11.
- 87 lois sur 114 sont des propositions de loi.

Conséquence pour le récit : la thèse « que des contournements » ne tient
pas au niveau des lois ; « pas de majorité stable » se lit en revanche
dans l'alternance des appoints (RN, gauche, ou les deux) et dans le fait
que le socle ne gagne presque jamais seul. Le site montre les deux.

## 3. Parcours de lecture

```
Accueil ──► « Comment les lois passent ? » ──► fiche d'une loi (49.3, rejet)
   │              └─► Méthodologie #chemins, #rejet-inverse
   ├──► « Avec quelles voix ? » ──► carré d'une loi ──► fiche
   ├──► « Quels groupes décisifs ? » ──► carré ou titre ──► fiche
   └──► Les lois (explorateur) ──► fiche ──► scrutin sur le site AN / Sénat
Données ◄── pied de chaque page ; Méthodologie ◄── lien « comment c'est compté »
```

Règles transverses :

- **Chaque chiffre a son « comment c'est compté »** : un lien vers l'ancre
  de la méthodologie qui le définit. Les ancres sont vérifiées au build
  (prérendu strict de SvelteKit).
- **Chaque graphique se lit sans légende externe** : phrase de lecture,
  libellés directs, légende intégrée ; l'explorateur sert de vue tableau.
- **Avec ou sans accords internationaux** : un interrupteur sur l'accueil
  et l'explorateur, porté par l'URL (`?conventions=1`). Par défaut :
  **sans**, et le dénominateur le dit (« 114 lois, hors 34 accords
  internationaux »).
- **Sans vote nominatif ≠ consensus** : carré vide (contour ardoise),
  toujours séparé des coalitions, jamais à côté de « Aucun bloc contre ».

## 4. Pages

### Accueil `/`

1. **En-tête** : « Qui fait la loi depuis 2024 ? », phrase de cadrage,
   interrupteur des accords internationaux.
2. **La frise** (l'élément marquant du site) : une colonne par mois, un
   carré par loi, coloré par chemin, contournements empilés en haut et
   nommés. Dates charnières en filets (dissolution, nouvelle Assemblée,
   censure Barnier, annonce de la suspension des retraites). Survol ou
   focus : titre, date, chemin ; clic : fiche. Sur téléphone, la frise
   pivote (un mois par ligne). Lien d'évitement (114 arrêts de tabulation).
3. **Trois phrases-réponses** sous la frise, calculées, avec dénominateur.
4. **« Comment les lois passent-elles à l'Assemblée ? »** : les cinq
   chemins (définition, compte), puis la liste des contournements.
5. **« Avec quelles voix ? »** : une ligne par coalition, une colonne par
   période de la XVIIe, un carré par loi, compte et part inscrits.
6. **« Quels groupes ont été décisifs ? »** : une ligne par groupe
   (couleur AN + sigle), un carré par loi, titres des lois.
7. **« Ce que ces chiffres ne disent pas »** : cinq limites en clair.

### Les lois `/lois`

Liste filtrable (recherche sans accents, chemin, coalition, groupe
décisif, période, type), état dans l'URL, compteur « 39 lois sur 114 ».
Une ligne par loi : date, titre court, type, chemin, coalition, groupes
décisifs. Sur téléphone, les lignes deviennent des cartes.

### Fiche `/lois/[id]`

1. Titre court, titre officiel, type, origine, dates, procédure accélérée.
2. Étiquettes chemin et coalition, puis **le parcours en phrases**
   (`site/src/lib/recit.ts`) et les définitions des deux étiquettes.
3. **Le parcours** : lectures et événements (49.3, CMP, Conseil
   constitutionnel, promulgation) dans l'ordre, avec décompte et lien vers
   chaque scrutin.
4. **Le vote décisif** à l'Assemblée, puis au Sénat : phrases de lecture,
   **barre de majorité** d'abord (voix par groupe face à la majorité
   requise, groupe décisif cerclé, contre-factuel en clair), **hémicycle**
   ensuite, puis le **tableau des groupes** avec la cohésion. Sur un 49.3,
   la motion de censure face aux 289 voix requises.
5. Les autres motions de censure, et les sources (AN, Sénat, Légifrance).

### Méthodologie `/methodologie`

Version publique de `docs/METHODO.md` : périmètre, accords, sources,
lectures, chemins (et règle du rejet par les partisans), contournement,
position d'un groupe, blocs (tableau généré depuis `blocs.yaml`),
coalitions, groupe décisif, périodes, limites. Les définitions viennent du
même fichier que les libellés du site (`site/src/lib/libelles.ts`).

### Données `/donnees`

Téléchargements (SQLite, sept CSV, deux JSON), dictionnaire des colonnes,
sources avec date et empreinte SHA-256, licence.

## 5. Direction visuelle

Étude du prior art (leurs-votes.fr, datan.fr, La Fabrique de la loi, pages
scrutin de l'AN) : on reprend de leurs-votes la question-titre, le chiffre
suivi de son dénominateur, la méthode au point d'usage et l'interrupteur
méthodologique visible ; on refuse son cadre normatif (« en faveur des
Français »), le vert/rouge moral, les camemberts et le rendu sans HTML. De
l'AN, la synthèse du vote (majorité requise), affichée telle quelle. On
lie le site de l'AN pour le vote de chaque député. La Fabrique de la loi
ne couvre pas la XVIIe : pas de lien.

**Principe unique : un carré = une loi.** La frise, les coalitions par
période et les groupes décisifs sont des graphiques d'unités : chaque loi
est un carré cliquable, au même gabarit partout. Les effectifs sont petits
(7 lois hors accords avant la censure Barnier) : des barres à 100 % les
masqueraient, des carrés les montrent. C'est l'élément marquant du site ;
tout le reste est discret.

**Typographie.** Deux familles libres (OFL), auto-hébergées dans
`site/static/fonts/` :

- *Newsreader* (Production Type), serif à axe optique : questions-titres,
  grands nombres, titres de loi. Chiffres tabulaires.
- *Atkinson Hyperlegible Next* (Braille Institute) : texte, interface,
  libellés. Choisie pour la lisibilité (public lycéen).
  Pas de Marianne : la police de l'État donnerait une apparence officielle.

Pas de capitales espacées ni de surtitres. Texte aligné à gauche, colonne
de 40 rem ; graphiques jusqu'à 72 rem.

**Couleurs.** Papier froid `#fbfbf9`, encre `#1a2029`, ardoise `#5b6573`,
filets `#e3e6e9`. Trois registres de données, aucun ne reprend une couleur
de parti (jetons `--ch-*`, `--co-*`, `--vo-*` de `site/src/app.css`) :

| Registre | Clair | Remarque |
|---|---|---|
| Chemins | solennel `#1c5cab`, vote nominatif `#6da7ec`, sans vote nominatif carré vide, rejet par les partisans `#c2417c`, 49.3 `#eb6834` | votes nominatifs en bleu ordinal, contournements en teintes chaudes |
| Coalitions | aucun bloc contre `#cfd4da`, socle + gauche + RN `#7a5bd6`, socle + gauche `#1a9e77`, socle + RN `#d9a300`, centre + LR `#8a96a3`, socle sans gauche ni RN `#2f3742`, sans le socle `#a3502a` | palette construite |
| Votes | pour `#0089a3`, contre `#b5651d`, abstention `#b9bcc0`, non-votant cercle vide | divergente sarcelle/brun : ni bleu/rouge (droite/gauche), ni vert/rouge (moral) |

Les groupes AN gardent leur **couleur officielle** (`couleurAssociee` du
référentiel AMO, exportée dans `groupes.csv`), toujours doublée du sigle.
Le Sénat ne publie pas de couleur : sigle seul.

Palettes passées au validateur du skill dataviz (bande de luminosité,
chroma, séparation sous daltonisme, plancher en vision normale) en clair et
en sombre, avec des pas recalés pour le fond sombre `#161a1f`. Les teintes
sous 3:1 (vote nominatif, socle + RN) sont toujours étiquetées ; les carrés
« vote nominatif » de la frise ont un contour. Le contre `#b5651d` et le
49.3 `#eb6834` sont proches mais ne figurent jamais dans le même graphique.

## 6. Composants (`site/src/lib/components/`)

- `Frise` : colonnes mensuelles, deux carrés par rangée, étiquettes sans
  chevauchement (`lib/frise.ts`), légende-filtre cliquable.
- `Coalitions`, `Pivots`, `Carre` : graphiques d'unités.
- `Parcours` : lectures et événements entremêlés.
- `Majorite` : barre de majorité, groupes décisifs cerclés (§12).
- `Hemicycle` : sièges colorés selon le décompte du groupe (`lib/hemicycle.ts`),
  groupes de la gauche à la droite, arc de couleur AN. La place d'un siège
  dans son groupe n'est pas celle d'un député, et c'est écrit.
- `Groupes` : tableau des groupes, position avec cohésion, mention
  « décisif ».
- `Interrupteur`, `Comment` (lien vers l'ancre de méthodologie).

## 7. Arbitrages

Relecteur indépendant (sous-agent), 28/10/2026. Tous appliqués :

1. Accords exclus par défaut : oui, dénominateur toujours explicite ;
   libellé « Accord international » (la loi autorise le traité, elle n'est
   pas le traité).
2. « Sans le socle » passe du rouge au brun (le rouge était aussi
   « contre ») ; « sans vote nominatif » devient un carré vide, à part.
   Mode sombre recalé teinte par teinte.
3. Votes : sarcelle/brun au lieu de bleu/rouge (lecture droite/gauche sur
   un hémicycle ordonné de gauche à droite).
4. Fiche : barre de majorité d'abord, hémicycle ensuite, tableau toujours.
5. Frise : pièce maîtresse, sans les accords par défaut ; contour des
   carrés clairs ; lien d'évitement.
6. Titres courts tirés du **titre officiel** de la loi (plus du titre du
   dossier AN : « Fin de vie » devient « Droit à l'aide à mourir »), sans
   paraphrase ; nom d'usage en second (« … (loi Duplomb) »).
7. Libellés : « Vote nominatif », « Sans vote nominatif », « Rejet par ses
   partisans » (dit « rejet inversé »), « Aucun bloc contre » (le
   « consensus » ignorait LIOT et les non-inscrits), « Socle, sans gauche
   ni RN », « Centre + LR (XVIe) », « groupe décisif ». « Socle commun »
   développé à la première occurrence, jamais « gouvernemental ».
   Définitions institutionnelles corrigées (vote solennel, 49.3 et ses 289
   voix, rejet préalable et procédure accélérée).
8. Titres de section en questions non évaluatives.
9. Phrases d'en-tête et phrases-réponses rédigées par l'arbitre, rendues
   dynamiques.
10. « Contourner » toujours qualifié (« à une étape », « sur le texte ») ;
    contre-factuel de la censure formulé « si le groupe avait voté la
    censure ».

**Reste à décider par Max** (choix politiques, CLAUDE.md) : dater la
sortie de LR du socle (refus de participer au gouvernement Lecornu II,
octobre 2025) ; la page Méthodologie l'affiche comme limite en attendant.

## 8. Retours de Max (28/10/2026, première lecture)

Tous appliqués ; ils priment sur les sections ci-dessus quand elles
divergent.

- **Chemins** : « vote solennel » et « scrutin ordinaire » sont réunis en
  **vote nominatif** (le solennel est un vote nominatif ; la distinction
  troublait plus qu'elle n'éclairait). Quatre chemins : vote nominatif,
  sans vote nominatif, rejet par ses partisans, 49.3. La carte « vote
  nominatif » donne le nombre de votes solennels ; les fiches gardent
  « vote nominatif solennel » / « ordinaire ».
- **Frise et chemins dans un même bloc** (« Comment les lois passent-elles
  à l'Assemblée ? »), avec la phrase-réponse au-dessus. Les phrases sur
  les coalitions et les groupes décisifs ouvrent leur propre section, à
  côté du graphique qui les montre.
- **Navette** : décompte des lois conclues par un vote conforme, un texte
  de CMP ou une lecture définitive (62 / 48 / 4 hors accords), pour qu'on
  ne croie pas que la CMP n'existe qu'avec le rejet par les partisans.
- **Période globale** (`Reglages`, `lib/plage.ts`) : préréglages (toute la
  période, les trois périodes charnières) et curseur à deux poignées au
  mois, collés en haut de l'écran ; tout l'accueil suit, état dans l'URL
  (`?du=…&au=…`). La frise estompe les lois hors période. Prévu pour les
  baselines : chaque législature deviendra un préréglage et la frise
  s'allongera, sans autre changement d'interface.
- **« Avec quelles voix ? »** en trois vues au lieu d'une matrice
  période × coalition :
  1. *Les coalitions* : une barre de proportions, puis une carte par
     coalition avec ses lois les plus récentes et un lien vers
     l'explorateur filtré ;
  2. *Comment chaque groupe a voté* : une barre par groupe (de la gauche à
     la droite), découpée selon sa position au vote décisif de chaque loi ;
  3. *D'une période à l'autre* : une barre à 100 % par période, effectif
     affiché (affichée si la période choisie en couvre plusieurs).
- **Groupes décisifs** : matrice lois × groupes (disque : décisif par son
  vote ; cercle : par son abstention), qui montre les cumuls (SOC et
  LFI-NFP sur les municipales, SOC et LIOT sur la Sécurité sociale 2026).
  Sur téléphone, une liste par loi.
- Questions factuelles : la réforme des retraites (2023) et la présomption
  de légitime défense des forces de l'ordre (adoptée à l'AN le
  07/07/2026, en attente au Sénat) sont hors périmètre : la première
  avant juillet 2024 (baselines), la seconde pas encore promulguée
  (cycle « Textes en cours »).

## 9. Bloc « Les coalitions » (deuxième retour de Max)

Max trouvait encore le bloc difficile à lire (cartes de même poids,
définitions répétées, mur de liens). Trois propositions d'un sous-agent
designer, recommandation retenue avec deux corrections :

- **Une rangée par coalition**, dans un ordre fixe qui ne bouge pas avec
  les filtres : chevron, libellé, **grille de présence** (Gauche / Socle /
  RN : ● au moins un groupe vote pour, · absent du camp gagnant, ? pas de
  vote nominatif), une **rangée de carrés** (un carré = une loi, une seule
  échelle, survol : titre, mois, chemin) et l'effectif.
- **Les lois au clic** : la rangée se déplie (définition courte, huit lois
  au plus, lien vers l'explorateur filtré). Les carrés sont hors de
  l'ordre de tabulation ; au clavier, le bouton de la rangée donne le même
  accès, avec un nom accessible complet.
- Une **note unique** sous le graphique (glyphes, socle commun, règle du
  49.3) au lieu de la phrase répétée dans chaque définition.
- Rangées vides affichées estompées (« 0 », une absence est une
  information) ; « Centre + LR (XVIe) », « Sans le socle » et « Sans vote
  nominatif » masquées quand elles sont vides.
- Corrections à la proposition : « Aucun bloc contre » montre ○ (« pour ou
  abstention, mais pas contre ») pour la gauche et le RN, et non ●, qui
  aurait affirmé un vote pour ; le libellé reste « Socle, sans gauche ni
  RN » (« Socle seul » est faux quand LIOT ou des non-inscrits l'appuient,
  §7).

## 10. Groupe décisif : règle du basculement (décision de Max)

Question de Max : pourquoi 36 lois « socle + gauche » ou « socle + RN »,
mais si peu de groupes décisifs ? Réponse : le socle commun (≈ 211 sièges)
bat seul la gauche (≈ 193) ou le RN (≈ 140) ; l'ancienne règle (« pour »
reportés en abstention) mesurait la *nécessité* des voix et ne retenait
que 11 lois. Max a proposé de mesurer la *capacité d'action* du groupe :
décisif si, en votant contre au lieu de pour, il faisait tomber le texte
(définition du pivot de Banzhaf). Trois règles chiffrées (abstention 10,
basculement 31, tout le groupe contre, absents compris, 76 lois adoptées
par scrutin) ; Max a retenu le basculement seul. Effet : 33 lois, RN 22,
SOC 9. Sur une censure, la règle (tous les membres votent la censure)
reste inchangée ; elle va dans le même sens (le groupe pouvait renverser
l'issue).

## 11. Groupes décisifs en rangées, thèmes du Sénat (troisième retour de Max)

- **« Quels groupes ont été décisifs ? »** reprend la grammaire du bloc des
  coalitions : une rangée par groupe (de la gauche à la droite, couleur AN,
  groupes d'une lecture tenue sous la XVIe en gris), un carré par loi
  (plein : décisif par son vote ; contour : par son abstention), effectif.
  Au clic, les lois du groupe, avec leur chemin, leurs thèmes et les autres
  groupes décisifs sur la même loi. Le tableau croisé lois × groupes reste
  accessible dans un volet repliable.
- **« D'une période à l'autre »** retiré : la chronologie sera traitée dans
  un cycle dédié, et ce graphique apportait peu.
- **Thèmes** : classement du Sénat (Dosleg, tables `the` et `loithe`),
  1 à 4 thèmes par loi sur 30, les 148 lois couvertes. Exportés dans
  `lois.themes`, du plus spécifique au plus général (fréquence croissante,
  « Société », fourre-tout, en dernier). Affichés en étiquettes dans les
  listes (deux au plus), sur la fiche (tous) et en filtre de l'explorateur.

## 12. Fiche : moins de texte sur le vote décisif (quatrième retour de Max)

Les phrases contre-factuelles (« Si le groupe RN avait voté contre, le
texte était rejeté », et leur version chiffrée sous la barre) sont
retirées : la barre de majorité cercle **tous** les groupes décisifs, socle
compris, et le tableau des groupes garde l'étiquette « décisif ». Sur une
censure, les membres d'un groupe décisif hors socle qui ne l'ont pas votée
restent figurés en pointillé au bout de la barre.

## 13. Période globale retirée ; la profondeur viendra par législature

Max n'utilisait pas la barre de période : depuis juillet 2024, les
comportements bougent peu, et un filtre global qui ne change presque rien
coûte de la place et du code. Retirée (préréglages, curseur, atténuation de
la frise) ; l'interrupteur des accords internationaux reste, au-dessus de la
frise. Le code est dans l'historique git (commit cd4de8f).

Pour le cycle Baselines, la profondeur ne passera pas par un filtre de
dates : les législatures ne se lisent pas avec les mêmes catégories (socle
différent, majorité absolue sous la XVe, autres groupes), et l'argument est
la comparaison côte à côte, pas la sélection. Prévu : une page par
législature sur le gabarit de l'accueil, et une page « Comparer » en petits
multiples (part de contournement, de « socle seul », de vote nominatif,
groupes décisifs). La chronologie fine relève du cycle Coalitions.

## 14. Groupes décisifs : filtre par groupe, une ligne par loi (cinquième retour de Max)

La version en rangées dépliables (§11) répétait une loi sous chacun de ses
groupes décisifs, avec un « avec … » peu lisible. Elle est remplacée par :

- en haut, les rangées de carrés par groupe (aperçu des effectifs), qui
  servent de **filtre** : un clic ne garde que les lois du groupe, les
  autres rangées s'estompent ;
- en dessous, le **tableau lois × groupes** (une ligne par loi, un disque
  par groupe décisif, un cercle par abstention décisive), avec date,
  chemin et thèmes ; la colonne du groupe choisi est surlignée. **Sans
  groupe choisi, pas de liste** (une liste chronologique de 35 lois était
  illisible) : une invitation à choisir un groupe, ou à afficher toutes
  les lois. Sur téléphone, une liste par loi avec les groupes en pastilles.

## 15. Baselines : une page par législature, une page « Comparer » (cycle Baselines)

- **Gabarit commun** : le composant `Legislature` porte les trois questions
  (chemins, coalitions, groupes décisifs) pour une législature. L'accueil
  reste la XVIIe (l'actualité) ; la XVe et la XVIe ont `/legislature/15` et
  `/legislature/16`. Un sélecteur en pastilles (XVe · XVIe · XVIIe ·
  Comparer) sous le chapô relie les quatre pages ; « Comparer » entre dans
  la navigation principale.
- **Le socle se nomme par législature** (`site/src/lib/legislatures.ts`) :
  « majorité présidentielle » sous les XVe et XVIe, « socle commun » sous la
  XVIIe. Les libellés de coalition disent « socle », développé en tête de
  page. « Centre + LR (XVIe) » devient « Socle + LR ».
- **Comparer** (`/comparer`) : petits multiples en gaufres, un carré = une
  loi, à la même taille dans les trois colonnes (on compare des parts, la
  surface dit le volume). Trois gaufres par législature (chemin, coalition,
  groupe décisif), rangées par catégorie, chacune suivie d'un tableau de
  comptes et de parts (la version accessible). Pas de filtre de dates.
- **`/lois`** gagne un filtre « Législature » ; les liens des pages de
  législature le pré-remplissent.

## 16. Passe éditoriale (retour de Max, cycle Baselines)

Les textes doivent porter un message ; la donnée se lit dans les graphiques,
la méthode dans la méthodologie.

- **Un récit par législature** (`site/src/lib/legislatures.ts`) : chapô et
  message de chaque question, écrits d'après les données. Pour la XVIIe :
  l'Assemblée qu'on disait ingouvernable adopte autant de lois que ses
  devancières ; presque toujours par un vote, avec des majorités faites
  texte par texte ; quelques contournements marquants ; des alliances larges,
  avec la gauche sur quelques textes clés, plus souvent avec le RN.
- **Coalitions dépliées** : une phrase qui dit quelles lois la coalition
  recouvre, puis les lois en étiquettes, en grand les textes marquants (vote
  solennel, 49.3, rejet par les partisans), les contournements d'abord ; le
  lien vers l'explorateur reste. Plus de liste chronologique ni de définition.
- **Méthode retirée des pages** : définitions des chemins sur les cartes et
  sur les fiches (gardées en infobulle), encadré « Et la navette ? », notes de
  lecture répétées. Chaque section garde un lien « Comment c'est compté ».
- Ces textes datent des données du 28/10/2026 : à relire à chaque mise à
  jour (`BACKLOG.md`).

## 17. Récits et zooms (amorce du cycle Fiches)

Retour de Max : les fiches narratives doivent suivre l'écriture éditoriale,
comme des zooms qui s'insèrent au bon moment du fil.

- **Source** : un fichier `recits/<loi>.md` par texte, écrit à la main,
  versionné. Frontmatter : `loi`, `titre`, `statut` (`brouillon` tant que
  Max n'a pas relu, affiché « en cours de relecture »), `section`
  (chemins | coalitions | decisifs), `accroche`, `chapo` ; les quatre
  premiers sont passés `relu` après une vérification factuelle indépendante
  contre la base (délégation de Max) ; puis une section
  `## AAAA-MM-JJ` par étape. Markdown minimal (gras, italique, liens),
  échappé avant mise en forme (`site/src/lib/markdown.ts`).
- **Zoom** : sur la page de sa législature, le récit apparaît en encart
  (titre, accroche, « Lire le récit ») dans la question `section`.
- **Fiche** : le chapô remplace le résumé automatique ; les étapes du récit
  s'intercalent à leur date dans le parcours, qui devient « Le récit ».
- **`/recits`** : la liste, de la plus récente à la plus ancienne ; entrée
  « Récits » dans la navigation.
- Les faits des récits viennent des données (votes, dates) ou du contexte
  public bien établi ; chaque chiffre se vérifie dans la base.
