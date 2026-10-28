// Les trois législatures comparées (cycle Baselines). Le « socle » est le bloc gouvernemental
// de référence de chacune (pipeline/referentiels/blocs.yaml) : il ne recouvre pas les mêmes
// groupes d'une législature à l'autre, d'où un libellé par législature.

export interface Legislature {
  num: number;
  /** « XVIIe » */
  romain: string;
  /** Première séance de l'Assemblée. */
  debut: string;
  /** Dernière date utile (veille de la législature suivante), null pour celle en cours. */
  fin: string | null;
  annees: string;
  url: string;
  majorite: string;
  /** Nom du socle, sans développement (« socle commun »). */
  socle: string;
  /** Nom du socle développé, à la première occurrence d'une page. */
  socleDeveloppe: string;
  /** Une phrase de contexte, sans chiffre de résultat. */
  contexte: string;
  /**
   * Le message de chaque question, en tête de section : ce que montrent les graphiques qui
   * suivent, presque sans chiffres (les chiffres se lisent dessous). Écrits d'après les données
   * du 28/10/2026, hors accords internationaux ; à relire à chaque mise à jour des données.
   */
  messages: { chemins: string; coalitions: string; decisifs: string };
}

export const LEGISLATURES: Legislature[] = [
  {
    num: 15,
    romain: 'XVe',
    debut: '2017-06-27',
    fin: '2022-06-27',
    annees: '2017-2022',
    url: '/legislature/15',
    majorite: 'majorité absolue',
    socle: 'majorité présidentielle',
    socleDeveloppe:
      'majorité présidentielle (La République en marche, le MoDem, puis Agir ensemble à partir de 2020)',
    contexte:
      'Élue en juin 2017 après la victoire d’Emmanuel Macron, l’Assemblée donne à La République en marche seule la majorité absolue, élargie au MoDem.',
    messages: {
      chemins:
        'Avec une majorité absolue, aucune loi ne contourne le vote de l’Assemblée. Mais une loi sur trois passe sans vote nominatif : un scrutin public n’a lieu que s’il est demandé.',
      coalitions:
        'La majorité présidentielle n’a besoin de personne. Elle vote seule, avec LR ou une partie de la gauche, ou sans qu’aucun bloc s’y oppose.',
      decisifs:
        'Aucun groupe extérieur à la majorité n’a jamais été en position de faire tomber un texte : elle gagne seule chaque vote.'
    }
  },
  {
    num: 16,
    romain: 'XVIe',
    debut: '2022-06-28',
    fin: '2024-07-17',
    annees: '2022-2024',
    url: '/legislature/16',
    majorite: 'majorité relative',
    socle: 'majorité présidentielle',
    socleDeveloppe: 'majorité présidentielle (Renaissance, le MoDem et Horizons)',
    contexte:
      'Réélu en 2022, Emmanuel Macron n’obtient qu’une majorité relative : il manque une quarantaine de sièges à la majorité présidentielle. La législature s’achève par la dissolution du 9 juin 2024.',
    messages: {
      chemins:
        'Sans majorité absolue, le vote nominatif devient la règle. Le 49.3 apparaît, mais pour les seuls textes financiers, dont la réforme des retraites.',
      coalitions:
        'Une loi sur deux environ passe sans opposition d’aucun bloc. Pour les autres, la majorité présidentielle trouve des voix à droite, à gauche ou au RN, qui vote souvent avec elle.',
      decisifs:
        'Ces appoints ne décident presque jamais : au décompte des votants, la majorité présidentielle l’emporte seule. Les rares exceptions comptent la réforme des retraites (LR, en ne votant pas la censure) et la loi immigration (RN).'
    }
  },
  {
    num: 17,
    romain: 'XVIIe',
    debut: '2024-07-18',
    fin: null,
    annees: 'depuis 2024',
    url: '/',
    majorite: 'majorité relative',
    socle: 'socle commun',
    socleDeveloppe:
      'socle commun (les groupes du centre, EPR, Les Démocrates et Horizons, et la Droite républicaine)',
    contexte:
      'Issue de la dissolution, l’Assemblée se partage en trois blocs dont aucun n’approche la majorité. Le centre gouverne avec la droite.',
    messages: {
      chemins:
        'Presque toutes les lois sont votées, nom par nom. Le contournement reste l’exception : le 49.3 pour les budgets, et des textes rejetés d’emblée par leurs propres partisans pour passer par une commission mixte paritaire.',
      coalitions:
        'Près d’une loi sur deux passe sans opposition d’aucun bloc. Les autres, le socle commun ne les fait presque jamais seul : il lui faut l’appoint de la gauche, du RN, ou des deux.',
      decisifs:
        'Pour près d’une loi sur trois, un groupe extérieur au socle pouvait faire tomber le texte. Deux fois sur trois, c’est le RN ; sinon la gauche, le PS en tête, dont les budgets adoptés depuis l’automne 2025.'
    }
  }
];

export const legislature = (num: number): Legislature => {
  const l = LEGISLATURES.find((x) => x.num === num);
  if (!l) throw new Error(`législature inconnue : ${num}`);
  return l;
};
