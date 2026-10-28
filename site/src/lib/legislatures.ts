// Les trois législatures comparées (cycle Baselines). Le « socle » est le bloc gouvernemental
// de référence de chacune (pipeline/referentiels/blocs.yaml) : il ne recouvre pas les mêmes
// groupes d'une législature à l'autre, d'où un libellé par législature.
import type { Classe } from './types';

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
  /*
   * Textes éditoriaux : le message de la page et de chaque question, ce que recouvre chaque
   * coalition. Peu de chiffres (ils se lisent dans les graphiques). Écrits d'après les données
   * du 28/10/2026, hors accords internationaux : à relire à chaque mise à jour des données.
   */
  /** Chapô de la page (pour la XVe et la XVIe, il suit `contexte`). */
  chapo: string;
  messages: { chemins: string; coalitions: string; decisifs: string };
  /** Les lois que recouvre chaque coalition, en une phrase. */
  coalitions: Partial<Record<Classe | 'aucune', string>>;
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
    chapo:
      'Elle adopte une cinquantaine de lois par an sans jamais forcer le vote. La majorité présidentielle n’a besoin de personne : elle s’allie quand elle le veut, et vote seule ses textes les plus contestés.',
    messages: {
      chemins:
        'Toutes les lois sont votées ; un tiers à main levée, faute de demande de scrutin public quand l’issue ne fait pas de doute. Le seul 49.3 de la législature, sur la réforme des retraites de 2020, porte sur un texte abandonné ensuite.',
      coalitions:
        'Plus d’un quart des lois ne rencontre l’opposition d’aucun bloc. Pour le reste, la majorité choisit ses appuis : LR sur l’ordre public, la crise sanitaire ou la réforme ferroviaire, une partie de la gauche sur la vie politique ; elle vote seule la lutte contre les fausses nouvelles ou contre la haine en ligne.',
      decisifs:
        'Aucun groupe extérieur à la majorité n’a jamais été en position de faire tomber un texte : elle gagne seule chaque vote. C’est le point de comparaison des deux législatures suivantes.'
    },
    coalitions: {
      consensus:
        'Des textes de consensus : deuil d’un enfant, information sur les produits alimentaires, organisation du référendum en Nouvelle-Calédonie, report des élections pendant l’épidémie.',
      socle_droite:
        'L’ordre et l’urgence : ordonnances sur le droit du travail, nouveau pacte ferroviaire, maintien de l’ordre dans les manifestations, état d’urgence sanitaire, justice pénale des mineurs.',
      socle_gauche:
        'Moins souvent : la confiance dans la vie politique, la réforme du Conseil économique, social et environnemental, un budget rectificatif de crise en 2020.',
      socle_seul:
        'Les textes que la majorité porte seule : manipulation de l’information, contenus haineux en ligne, dette sociale, plusieurs budgets de la Sécurité sociale, prorogations de l’état d’urgence sanitaire.',
      aucune:
        'Un tiers des lois passent à main levée à leur dernier vote à l’Assemblée : on ne sait pas qui a voté quoi.'
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
    chapo:
      'Elle continue pourtant d’adopter une cinquantaine de lois par an, presque toutes par un vote nominatif, et réserve le 49.3 aux budgets et aux retraites.',
    messages: {
      chemins:
        'Sans majorité absolue, chaque vote compte et se fait nom par nom. Les contournements se concentrent sur les textes financiers : les quatre budgets annuels, la programmation des finances publiques et la réforme des retraites passent au 49.3.',
      coalitions:
        'Près d’une loi sur deux ne rencontre l’opposition d’aucun bloc, jusqu’à l’inscription de l’IVG dans la Constitution. Sur les textes disputés, la majorité présidentielle trouve des voix au RN plus souvent qu’à gauche : pouvoir d’achat, sécurité intérieure, logements squattés, immigration.',
      decisifs:
        'Ces appoints décident pourtant rarement : au décompte des votants, la majorité présidentielle l’emporte presque toujours seule. Les exceptions comptent la réforme des retraites, sauvée par LR qui ne vote pas la censure, et la loi immigration, adoptée grâce au RN.'
    },
    coalitions: {
      consensus:
        'L’IVG dans la Constitution, et une foule de lois de société : influenceurs, majorité numérique, violences intrafamiliales, sécurité des maires.',
      socle_rn:
        'L’économie et le régalien : pouvoir d’achat en 2022, programmation du ministère de l’Intérieur, occupation illicite des logements, immigration, sûreté nucléaire.',
      transpartisan:
        'La relance du nucléaire, et les budgets passés au 49.3 qu’aucune motion de censure n’a fait tomber.',
      socle_gauche:
        'Énergies renouvelables, sortie des régimes d’exception de l’épidémie, dérives sectaires, reconstruction après les émeutes de 2023.',
      socle_droite:
        'La réforme des retraites, que LR laisse passer en ne votant pas la censure, et un budget rectificatif.',
      socle_seul:
        'Quelques textes d’urgence économique : inflation, budgets de fin d’année, restauration des étudiants.'
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
    chapo:
      'Sans majorité, coupée en trois blocs, l’Assemblée élue en 2024 passait pour ingouvernable. Elle adopte pourtant autant de lois que ses devancières, une cinquantaine par an, presque toujours par un vote. Ses majorités se font texte par texte.',
    messages: {
      chemins:
        'Presque toutes les lois sont votées, nom par nom. Les contournements restent rares mais marquants : le 49.3 sur trois budgets, et deux textes rejetés d’emblée par leurs propres partisans pour reprendre la version du Sénat, la loi Duplomb sur l’agriculture et le report des élections en Nouvelle-Calédonie.',
      coalitions:
        'Près d’une loi sur deux ne rencontre l’opposition d’aucun bloc. Pour les autres, le socle commun cherche ses voix : à gauche pour quelques textes clés, les budgets de 2026, l’aide à mourir ou la parité aux municipales ; plus souvent au RN, pour la sécurité, la justice pénale ou l’agriculture. La défense, le narcotrafic et la Nouvelle-Calédonie rassemblent les deux.',
      decisifs:
        'Voter avec le socle ne veut pas dire peser. Pour près d’une loi sur trois, pourtant, un groupe extérieur pouvait faire tomber le texte : deux fois sur trois le RN, sinon la gauche, le PS en tête, dont il a permis les budgets adoptés depuis l’automne 2025.'
    },
    coalitions: {
      consensus:
        'Urgences et textes sans clivage : Mayotte après le cyclone, soins palliatifs, sport professionnel, lois spéciales qui assurent la continuité du budget.',
      transpartisan:
        'Souveraineté et sécurité : programmation militaire, narcotrafic, Nouvelle-Calédonie, Jeux olympiques de 2030, réseaux sociaux des mineurs ; et les budgets 2025, passés au 49.3 sans que la gauche ni le RN votent la censure.',
      socle_gauche:
        'Peu de textes, mais des textes clés : les budgets de 2026, l’aide à mourir, la parité aux élections municipales.',
      socle_rn:
        'Le régalien et l’agriculture : sûreté dans les transports, justice des mineurs, rétention, lutte contre la fraude, loi Duplomb, souveraineté agricole, assurance chômage.',
      socle_seul:
        'Rare : la loi de finances de fin de gestion 2025 et une loi d’adaptation au droit européen.'
    }
  }
];

export const legislature = (num: number): Legislature => {
  const l = LEGISLATURES.find((x) => x.num === num);
  if (!l) throw new Error(`législature inconnue : ${num}`);
  return l;
};
