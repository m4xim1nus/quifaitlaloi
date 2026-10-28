// Dictionnaire des fichiers téléchargeables (page Données). Les colonnes non décrites ici sont
// des identifiants techniques documentés dans docs/METHODO.md.

export interface Fichier {
  nom: string;
  description: string;
  lignes: string;
  colonnes: [string, string][];
}

export const FICHIERS: Fichier[] = [
  {
    nom: 'lois.csv',
    description:
      'Une ligne par loi, avec son parcours résumé et son vote décisif dans chaque chambre.',
    lignes: 'lois',
    colonnes: [
      ['id', 'numéro de la loi (année-numéro), ou identifiant provisoire si non promulguée'],
      ['titre, titre_court', 'titre officiel, titre d’affichage'],
      ['type', 'ordinaire, organique, constitutionnelle, finances, financement_ss, convention'],
      ['initiative', 'projet (gouvernement) ou proposition (parlementaires)'],
      ['date_adoption, date_promulgation', 'adoption définitive, promulgation'],
      ['parcours', 'suite des lectures (AN1 → SN1 → CMP-AN…)'],
      ['mode_an, mode_sn', 'mode d’adoption de la dernière lecture dans chaque chambre'],
      [
        'scrutin_an, scrutin_sn',
        'scrutin décisif de cette lecture (sur un 49.3 : la motion de censure)'
      ],
      ['classe_an, classe_sn', 'signature de coalition du scrutin décisif'],
      [
        'pivots_hors_socle_an',
        'groupes hors socle qui, en votant à l’inverse, renversaient le résultat'
      ],
      ['a_49_3, a_rejet_inverse, a_vote_bloque', 'composantes du contournement'],
      ['contournement', 'vrai si l’une des trois composantes est vraie'],
      [
        'a_delai_expire',
        'lecture close à l’expiration des délais budgétaires (hors contournement)'
      ],
      [
        'themes',
        'thèmes du Sénat (base Dosleg), du plus spécifique au plus général, séparés par « ; »'
      ]
    ]
  },
  {
    nom: 'lectures.csv',
    description:
      'Une ligne par passage du texte dans une chambre, conclu par une décision de séance.',
    lignes: 'lectures',
    colonnes: [
      ['etape, chambre, type_lecture', 'étape du dossier AN, chambre (AN, SN), type de lecture'],
      ['date, statut, issue', 'date et libellé de la décision, issue normalisée'],
      ['mode_adoption', 'mode de la lecture (voir Méthodologie)'],
      ['scrutin_id, rattachement', 'scrutin décisif et règle qui l’a trouvé'],
      ['score_rejet_inverse', 'part des voix de la motion venant des soutiens du texte final']
    ]
  },
  {
    nom: 'scrutins.csv',
    description:
      'Les scrutins utiles : décisifs, motions de rejet et de censure du parcours (lois et textes en cours).',
    lignes: 'scrutins',
    colonnes: [
      ['type_vote', 'SPS solennel, SPO ordinaire (AN) ; SCR (Sénat) ; MOC motion de censure'],
      ['objet', 'ensemble, article_unique, partie, motion_rejet, motion_censure…'],
      ['sort, pour, contre, abstention, requis', 'résultat proclamé et majorité requise']
    ]
  },
  {
    nom: 'positions_groupes.csv',
    description: 'La position de chaque groupe sur chaque scrutin utile.',
    lignes: 'positions_groupes',
    colonnes: [
      ['membres, pour, contre, abstention, non_votants', 'décompte du groupe'],
      ['position', 'position majoritaire parmi les votants du groupe'],
      ['cohesion', 'part de cette position parmi les votants du groupe'],
      [
        'pivot, pivot_abstention',
        'le groupe a-t-il décidé du résultat (par son vote, par son abstention)'
      ]
    ]
  },
  {
    nom: 'signatures.csv',
    description: 'La signature de coalition de chaque scrutin utile.',
    lignes: 'signatures',
    colonnes: [
      ['camp', 'camp gagnant (pour, contre ; pas_censure sur une censure rejetée)'],
      ['classe', 'consensus, transpartisan, socle_rn, socle_gauche, socle_seul…'],
      ['bloc_*', 'position majoritaire de chaque bloc'],
      [
        'gagnants_hors_socle, pivots, pivots_hors_socle',
        'groupes du camp gagnant hors socle, pivots'
      ]
    ]
  },
  {
    nom: 'groupes.csv',
    description: 'Les groupes politiques et leur bloc (choix affiché sur la page Méthodologie).',
    lignes: 'groupes',
    colonnes: [['sigle, nom, bloc', 'sigle d’affichage, nom officiel, bloc']]
  },
  {
    nom: 'evenements.csv',
    description:
      'Événements de procédure : CMP, engagements de responsabilité, motions de censure, Conseil constitutionnel, promulgation.',
    lignes: 'evenements',
    colonnes: [['type, date, detail', 'nature, date et précision de l’événement']]
  },
  {
    nom: 'en_cours.csv',
    description:
      'Textes en cours : votés au moins une fois depuis juillet 2024, ni promulgués ni adoptés définitivement. Ce ne sont pas des lois : ils n’entrent dans aucun chiffre du site. Les textes écartés (retirés, rejetés, sans activité depuis un an) y figurent avec leur motif.',
    lignes: 'en_cours',
    colonnes: [
      ['id', 'identifiant du dossier à l’Assemblée'],
      [
        'motif_ecart',
        'vide si le texte est en cours ; sinon retire, rejete, caduc, fusionne, inactif'
      ],
      ['date_derniere_lecture, issue_derniere_lecture', 'date et issue du dernier vote'],
      [
        'date_derniere_activite',
        'dernier acte de procédure connu (dépôt, commission, séance, vote)'
      ],
      [
        'attente, attente_chambre, attente_etape',
        'où en est le texte : lecture, transmis, cmp, cmp_conclusions, navette'
      ],
      ['seance_prevue', 'première séance inscrite à l’ordre du jour pour l’étape attendue'],
      [
        'mode_an, classe_an, pivots_hors_socle_an (et _sn)',
        'dernière lecture votée dans chaque chambre : mode, coalition, groupes décisifs'
      ]
    ]
  },
  {
    nom: 'en_cours_lectures.csv',
    description: 'Les lectures déjà votées des textes en cours (mêmes colonnes que lectures.csv).',
    lignes: 'en_cours_lectures',
    colonnes: [
      ['texte_id', 'identifiant du texte dans en_cours.csv'],
      [
        'decision_dosleg',
        'décision du Sénat lue dans sa base Dosleg, pas encore enregistrée par l’Assemblée'
      ]
    ]
  },
  {
    nom: 'en_cours_evenements.csv',
    description: 'Événements de procédure des textes en cours (mêmes colonnes que evenements.csv).',
    lignes: 'en_cours_evenements',
    colonnes: [['texte_id', 'identifiant du texte dans en_cours.csv']]
  }
];
