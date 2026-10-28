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
      'Élue en juin 2017 après la victoire d’Emmanuel Macron, l’Assemblée donne à La République en marche seule la majorité absolue, élargie au MoDem.'
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
      'Réélu en 2022, Emmanuel Macron n’obtient qu’une majorité relative : il manque une quarantaine de sièges à la majorité présidentielle. La législature s’achève par la dissolution du 9 juin 2024.'
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
      'Issue de la dissolution, l’Assemblée se partage en trois blocs dont aucun n’approche la majorité. Le centre gouverne avec la droite.'
  }
];

export const legislature = (num: number): Legislature => {
  const l = LEGISLATURES.find((x) => x.num === num);
  if (!l) throw new Error(`législature inconnue : ${num}`);
  return l;
};
